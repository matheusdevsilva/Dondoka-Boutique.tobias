import type { Request, Response } from "express"
import pool from "../database/db.js"
import { cleanText, toPositiveInt } from "../utils/validation.js"

function parseImages(value: unknown): string[] {
    if (!value) return []
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === "string" && item.length > 0)
    }
    if (typeof value === "string") {
        const trimmed = value.trim()
        if (!trimmed) return []
        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
                return parsed.filter(
                    (item): item is string => typeof item === "string" && item.length > 0
                )
            }
        } catch {
            if (trimmed.startsWith("http") || trimmed.startsWith("/")) {
                return [trimmed]
            }
        }
    }
    return []
}

function productImages(row: { image_url?: string | null; images?: unknown }): string[] {
    const fromImages = parseImages(row.images)
    if (fromImages.length > 0) return fromImages
    if (row.image_url) return [row.image_url]
    return []
}

function uploadedUrls(files?: Express.Multer.File[]): string[] {
    if (!files?.length) return []
    return files.map((file) => `/uploads/${file.filename}`)
}


function isAdminRequest(req: Request) {
    return req.user?.role === "admin"
}

const SORTS: Record<string, string> = {
    new: "p.id DESC",
    asc: "COALESCE(NULLIF(p.discount_price, 0), p.price) ASC, p.id DESC",
    desc: "COALESCE(NULLIF(p.discount_price, 0), p.price) DESC, p.id DESC",
}

export async function getProducts(req: Request, res: Response) {
    try {
        const conditions: string[] = []
        const params: unknown[] = []
        const add = (sql: string, value: unknown) => {
            params.push(value)
            conditions.push(sql.replace("?", `$${params.length}`))
        }

        if (!isAdminRequest(req)) conditions.push("p.is_active = TRUE")

        const q = cleanText(req.query.q, 100)
        if (q) add("p.name ILIKE ?", `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)

        const category = toPositiveInt(req.query.category)
        if (category) add("p.category_id = ?", category)

        const exclude = toPositiveInt(req.query.exclude)
        if (exclude) add("p.id <> ?", exclude)

        if (req.query.promo === "true") {
            conditions.push("p.discount_price > 0 AND p.discount_price < p.price")
        }

        const size = cleanText(req.query.size, 20)
        if (size) add("? = ANY(string_to_array(REPLACE(COALESCE(p.sizes, ''), ' ', ''), ','))", size)

        const minPrice = Number(req.query.min_price)
        if (req.query.min_price && Number.isFinite(minPrice)) {
            add("COALESCE(NULLIF(p.discount_price, 0), p.price) >= ?", minPrice)
        }
        const maxPrice = Number(req.query.max_price)
        if (req.query.max_price && Number.isFinite(maxPrice)) {
            add("COALESCE(NULLIF(p.discount_price, 0), p.price) <= ?", maxPrice)
        }

        if (typeof req.query.ids === "string") {
            const ids = req.query.ids
                .split(",")
                .map(toPositiveInt)
                .filter((id): id is number => id !== null)
                .slice(0, 200)
            add("p.id = ANY(?::int[])", ids)
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
        const orderBy = SORTS[String(req.query.sort)] || SORTS.new
        const hasPagination = req.query.page != null || req.query.limit != null
        const page = Math.max(1, Number(req.query.page) || 1)
        const limit = hasPagination
            ? Math.min(50, Math.max(1, Number(req.query.limit) || 12))
            : null

        const listParams = [...params]
        let pagination = ""
        if (limit) {
            listParams.push(limit, (page - 1) * limit)
            pagination = `LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`
        }

        const [result, count] = await Promise.all([
            pool.query(`SELECT p.* FROM products p ${where} ORDER BY ${orderBy} ${pagination}`, listParams),
            limit
                ? pool.query(`SELECT COUNT(*)::int AS total FROM products p ${where}`, params)
                : null,
        ])

        return res.status(200).json({
            success: true,
            data: result.rows,
            meta: {
                total: count ? count.rows[0].total : result.rows.length,
                page,
                limit: limit ?? result.rows.length,
            },
        })
    } catch (error) {
        console.error("Erro ao buscar produtos:", error)

        return res.status(500).json({
            success: false,
            message: "Erro interno"
        })
    }
}


export async function getProductsById(req: Request, res: Response) {
    try {
        const id = toPositiveInt(req.params.id)

        const result = id
            ? await pool.query(
                  `SELECT * FROM products WHERE id = $1 ${isAdminRequest(req) ? "" : "AND is_active = TRUE"}`,
                  [id]
              )
            : { rows: [] }

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Produto não encontrado" })
        }

        return res.status(200).json({ success: true, data: result.rows[0] })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao buscar produto" })
    }
}

/** Valida campos numéricos do formulário admin; retorna mensagem de erro ou null. */
function invalidProductNumbers(body: Record<string, unknown>): string | null {
    const price = body.price
    if (price !== undefined && price !== "" && !(Number(price) > 0)) {
        return "Preço inválido"
    }
    const discount = body.discount_price
    if (discount !== undefined && discount !== "" && discount !== null) {
        const d = Number(discount)
        if (!(d >= 0)) return "Preço promocional inválido"
        if (price !== undefined && price !== "" && d >= Number(price)) {
            return "Preço promocional deve ser menor que o preço"
        }
    }
    const stock = body.stock
    if (stock !== undefined && stock !== "" && !(Number.isInteger(Number(stock)) && Number(stock) >= 0)) {
        return "Estoque inválido"
    }
    return null
}


export async function createNewProducts(req: Request, res: Response) {
    try {
        const {
            name,
            description,
            price,
            discount_price,
            category_id,
            categories,
            brand,
            image_url,
            is_active,
            stock,
            sizes
        } = req.body

        if (!name || price == null || price === "") {
            return res.status(400).json({
                success: false,
                message: "Nome e preço são obrigatórios"
            })
        }

        const invalid = invalidProductNumbers(req.body)
        if (invalid) {
            return res.status(400).json({ success: false, message: invalid })
        }

        const resolvedCategoryId = category_id || categories || null

        const files = req.files as Express.Multer.File[] | undefined
        const images = uploadedUrls(files)
        const resolvedImageUrl = images[0] || image_url || null
        const finalImages =
            images.length > 0
                ? images
                : resolvedImageUrl
                  ? [resolvedImageUrl]
                  : []

        const active =
            is_active === undefined || is_active === "" || is_active === "true" || is_active === true

        const result = await pool.query(
            `INSERT INTO products 
            (name, description, price, discount_price, category_id, brand, image_url, images, is_active, stock, sizes)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *`,
            [
                name,
                description || null,
                price,
                discount_price || null,
                resolvedCategoryId,
                brand || null,
                resolvedImageUrl,
                JSON.stringify(finalImages),
                active,
                Number(stock) || 0,
                sizes || "P,M,G,GG"
            ]
        )

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        })

    } catch (error) {
        console.error("Erro ao criar produto:", error)

        return res.status(500).json({
            success: false,
            message: "Erro ao criar produto"
        })
    }
}

export async function DeleteProducts(req: Request, res: Response) {
    try {
        const { id } = req.params

        const result = await pool.query(
            "DELETE FROM products WHERE id = $1 RETURNING *",
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Produto não encontrado"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Produto deletado com sucesso"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            success: false,
            message: "Erro ao deletar produto"
        })
    }
}

export async function EditProducts(req: Request, res: Response) {
    try {
        const { id } = req.params

        const existing = await pool.query(
            "SELECT * FROM products WHERE id = $1",
            [id]
        )

        if (existing.rows.length === 0) {
            return res.status(404).json({
                message: "Produto não encontrado"
            })
        }

        const invalid = invalidProductNumbers(req.body)
        if (invalid) {
            return res.status(400).json({ success: false, message: invalid })
        }

        const current = existing.rows[0]
        const effectivePrice = req.body.price ? Number(req.body.price) : Number(current.price)
        const effectiveDiscount =
            req.body.discount_price === undefined
                ? current.discount_price
                : req.body.discount_price || null
        if (effectiveDiscount != null && Number(effectiveDiscount) >= effectivePrice) {
            return res.status(400).json({
                success: false,
                message: "Preço promocional deve ser menor que o preço"
            })
        }

        const {
            name,
            description,
            price,
            discount_price,
            category_id,
            brand,
            is_active,
            stock,
            sizes,
            existing_images
        } = req.body

        const files = req.files as Express.Multer.File[] | undefined
        let images = productImages(current)

        if (existing_images !== undefined) {
            images = parseImages(existing_images)
        }

        if (files && files.length > 0) {
            images = [...images, ...uploadedUrls(files)]
        }

        const resolvedImageUrl = images[0] || null

        const active =
            is_active === undefined || is_active === ""
                ? current.is_active
                : is_active === "true" || is_active === true

        const result = await pool.query(
            `UPDATE products SET
                name = $1,
                description = $2,
                price = $3,
                discount_price = $4,
                category_id = $5,
                brand = $6,
                image_url = $7,
                images = $8,
                is_active = $9,
                stock = $10,
                sizes = $11,
                updated_at = NOW()
             WHERE id = $12
             RETURNING *`,
            [
                name ?? current.name,
                description ?? current.description,
                price ?? current.price,
                discount_price === undefined
                    ? current.discount_price
                    : discount_price === "" || discount_price == null
                      ? null
                      : discount_price,
                category_id ?? current.category_id,
                brand ?? current.brand,
                resolvedImageUrl,
                JSON.stringify(images),
                active,
                stock === undefined || stock === ""
                    ? current.stock
                    : Number(stock),
                sizes ?? current.sizes ?? "P,M,G,GG",
                id
            ]
        )

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            success: false,
            message: "Erro ao atualizar produto"
        })
    }
}



export async function getProductsByCategory(req: Request, res: Response) {
    try {
        const category = req.params.category || req.query.category

        if (!category) {
            return res.status(400).json({ message: "Categoria é obrigatória" })
        }

        const result = await pool.query(
            `SELECT p.*, c.name AS category
             FROM products p
             JOIN categories c ON p.category_id = c.id
             WHERE c.name = $1 AND p.is_active = TRUE`,
            [category]
        )

        return res.json({
            success: true,
            data: result.rows
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao filtrar" })
    }
}



export async function getCategoria(_req: Request, res: Response) {
    try {
        const result = await pool.query("SELECT * FROM categories")
        return res.status(200).json({
            success: true,
            data: result.rows
        })
    } catch (error) {
        console.error("Erro ao buscar categorias:", error)

        return res.status(500).json({
            success: false,
            message: "Erro interno"
        })
    }
}

export async function createCategoria(req: Request, res: Response) {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Nome é obrigatório"
            });
        }

        const result = await pool.query(
            "INSERT INTO categories (name) VALUES ($1) RETURNING *",
            [name]
        );

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Erro ao criar categoria:", error);

        return res.status(500).json({
            success: false,
            message: "Erro interno"
        });
    }
}

export async function deleteCategoriaById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID é obrigatório"
            });
        }

        const result = await pool.query(
            `DELETE FROM categories
             WHERE id = $1
               AND NOT EXISTS (SELECT 1 FROM products WHERE category_id = $1)
             RETURNING id`,
            [id]
        );

        if (result.rowCount === 0) {
            const inUse = await pool.query(
                "SELECT COUNT(*)::int AS total FROM products WHERE category_id = $1",
                [id]
            );
            const total = inUse.rows[0]?.total ?? 0;
            if (total > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Categoria em uso por ${total} produto(s). Mova os produtos antes de excluir.`
                });
            }
            return res.status(404).json({
                success: false,
                message: "Categoria não encontrada"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Categoria deletada com sucesso"
        });

    } catch (error) {
        console.error("Erro ao deletar categoria:", error);

        return res.status(500).json({
            success: false,
            message: "Erro interno"
        });
    }
}

export async function updateCategoria(req: Request, res: Response) {
    try {
        const { id } = req.params
        const { name } = req.body

        if (!id || !name) {
            return res.status(400).json({
                success: false,
                message: "ID e nome são obrigatórios"
            })
        }

        const result = await pool.query(
            "UPDATE categories SET name = $1 WHERE id = $2 RETURNING *",
            [name, id]
        )

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Categoria não encontrada"
            })
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        })
    } catch (error) {
        console.error("Erro ao atualizar categoria:", error)
        return res.status(500).json({
            success: false,
            message: "Erro interno"
        })
    }
}
