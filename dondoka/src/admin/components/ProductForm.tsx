import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiErrorMessage, resolveImageUrl, type ApiResponse } from "../../services/api";
import { productImages, type ProductType } from "../../types/product";
import { Package, Tag, BadgePercent, X } from "lucide-react";
import "../pages/CadProducts.css";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface Category {
    id: string | number;
    name: string;
}

interface ProductFormProps {
    mode: "create" | "edit";
    productId?: string;
}

export default function ProductForm({ mode, productId }: ProductFormProps) {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [description, setDescription] = useState("");
    const [brand, setBrand] = useState("Dondoka");
    const [categoria, setCategoria] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [stock, setStock] = useState("20");
    const [sizes, setSizes] = useState("P,M,G,GG");
    const [currentImages, setCurrentImages] = useState<string[]>([]);

    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [activePreview, setActivePreview] = useState(0);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    function handleMoney(
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (v: string) => void
    ) {
        const digits = e.target.value.replace(/\D/g, "");
        setter((Number(digits) / 100).toString());
    }

    function formatBRL(value: number | string) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(Number(value) || 0);
    }

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        api.get<ApiResponse<Category[]>>("/admin/categories", { signal })
            .then((response) => setCategoria(response.data.data || []))
            .catch((error) => {
                if (!signal.aborted) console.error(error);
            });

        if (mode === "edit" && productId) {
            api.get<ApiResponse<ProductType>>(`/admin/product/${productId}`, { signal })
                .then((response) => {
                    const p = response.data.data;
                    setName(p.name || "");
                    setPrice(String(p.price ?? ""));
                    setDiscountPrice(p.discount_price ? String(p.discount_price) : "");
                    setDescription(p.description || "");
                    setBrand(p.brand || "Dondoka");
                    setCategoryId(p.category_id ? String(p.category_id) : "");
                    setIsActive(p.is_active !== false);
                    setStock(String(p.stock ?? 0));
                    setSizes(Array.isArray(p.sizes) ? p.sizes.join(",") : p.sizes || "P,M,G,GG");
                    setCurrentImages(productImages(p));
                    setActivePreview(0);
                })
                .catch(() => {
                    if (!signal.aborted) setMessage("Não foi possível carregar o produto.");
                });
        }

        return () => controller.abort();
    }, [mode, productId]);

    function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files) return;
        const selected = Array.from(e.target.files);
        const array = selected
            .filter((file) => IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_BYTES)
            .slice(0, 10);
        setMessage(
            array.length < selected.length
                ? "Algumas imagens foram ignoradas: use JPG, PNG ou WebP de até 5 MB (máximo 10)."
                : ""
        );
        previews.forEach((url) => URL.revokeObjectURL(url));
        setFiles(array);
        setPreviews(array.map((file) => URL.createObjectURL(file)));
        setActivePreview(0);
    }

    function removeCurrentImage(index: number) {
        setCurrentImages((prev) => prev.filter((_, i) => i !== index));
        setActivePreview(0);
    }

    function removeNewFile(index: number) {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
        setActivePreview(0);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setMessage("");

        if (!name.trim() || !Number(price) || !categoryId) {
            setMessage("Preencha nome, preço e categoria.");
            return;
        }

        if (discountPrice && Number(discountPrice) >= Number(price)) {
            setMessage("O preço promocional precisa ser menor que o preço.");
            return;
        }

        if (mode === "create" && files.length === 0) {
            setMessage("Adicione pelo menos uma imagem.");
            return;
        }

        if (mode === "edit" && currentImages.length === 0 && files.length === 0) {
            setMessage("O produto precisa de pelo menos uma imagem.");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("price", String(price));
        formData.append("discount_price", discountPrice || "");
        formData.append("category_id", String(categoryId));
        formData.append("brand", brand);
        formData.append("description", description);
        formData.append("is_active", String(isActive));
        formData.append("stock", stock || "0");
        formData.append("sizes", sizes || "P,M,G,GG");
        formData.append("existing_images", JSON.stringify(currentImages));
        files.forEach((file) => formData.append("images", file));

        try {
            setSaving(true);
            if (mode === "create") {
                await api.post("/admin/products/add/", formData);
                setMessage("Produto cadastrado com sucesso!");
                setTimeout(() => navigate("/admin/produtos"), 800);
            } else {
                await api.put(`/admin/product/edit/${productId}`, formData);
                setMessage("Produto atualizado com sucesso!");
                setTimeout(() => navigate("/admin/produtos"), 800);
            }
        } catch (error) {
            setMessage(apiErrorMessage(error, "Erro ao salvar produto."));
        } finally {
            setSaving(false);
        }
    }

    const allPreviewUrls = [
        ...currentImages.map((url) => resolveImageUrl(url)),
        ...previews,
    ];
    const previewSrc = allPreviewUrls[activePreview] || allPreviewUrls[0] || "";

    return (
        <div className="product-layout">
            <div className="container-preview">
                <h3>Prévia</h3>

                {previewSrc ? (
                    <div className="carousel">
                        <img src={previewSrc} alt={`Prévia de ${name || "produto"}`} />
                    </div>
                ) : (
                    <div className="preview-empty">Nenhuma imagem</div>
                )}

                {allPreviewUrls.length > 1 && (
                    <div className="preview-thumbs">
                        {allPreviewUrls.map((src, index) => (
                            <button
                                key={`${src}-${index}`}
                                type="button"
                                className={
                                    activePreview === index ? "active" : ""
                                }
                                onClick={() => setActivePreview(index)}
                                aria-label={`Ver imagem ${index + 1}`}
                                aria-pressed={activePreview === index}
                            >
                                <img src={src} alt="" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="preview-info">
                    <h4>{name || "Nome do produto"}</h4>
                    <span className="price">
                        {formatBRL(discountPrice || price || 0)}
                    </span>
                    {discountPrice && (
                        <span className="old">{formatBRL(price || 0)}</span>
                    )}
                    <p>{description || "Sem descrição"}</p>

                    <div className="preview-grid">
                        <div className="preview-item">
                            <Tag size={16} />
                            <div>
                                <span>Categoria</span>
                                <strong>
                                    {categoria.find(
                                        (c) => String(c.id) === categoryId
                                    )?.name || "—"}
                                </strong>
                            </div>
                        </div>
                        <div className="preview-item">
                            <Package size={16} />
                            <div>
                                <span>Marca</span>
                                <strong>{brand || "—"}</strong>
                            </div>
                        </div>
                        <div className="preview-item">
                            <BadgePercent size={16} />
                            <div>
                                <span>Status</span>
                                <strong>
                                    {isActive ? "Ativo" : "Inativo"}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <form className="container-forms-products" onSubmit={handleSubmit}>
                <div className="form-title">
                    <h2>
                        {mode === "create" ? "Novo produto" : "Editar produto"}
                    </h2>
                    <p>Campos alinhados com o catálogo da loja</p>
                </div>

                <div className="form-message" role="status" aria-live="polite" hidden={!message}>
                    {message}
                </div>

                <div className="container-input-products">
                    <label htmlFor="product-name">Nome</label>
                    <input
                        id="product-name"
                        value={name}
                        className="input-products"
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Vestido Floral Midi"
                        maxLength={160}
                        required
                    />
                </div>

                <div className="container-grid-products">
                    <div className="container-input-products">
                        <label htmlFor="product-price">Preço</label>
                        <input
                            id="product-price"
                            type="text"
                            className="input-products"
                            inputMode="numeric"
                            value={formatBRL(price || 0)}
                            onChange={(e) => handleMoney(e, setPrice)}
                        />
                    </div>
                    <div className="container-input-products">
                        <label htmlFor="product-discount">Preço promocional</label>
                        <input
                            id="product-discount"
                            type="text"
                            className="input-products"
                            inputMode="numeric"
                            value={
                                discountPrice ? formatBRL(discountPrice) : ""
                            }
                            placeholder="Opcional"
                            onChange={(e) => handleMoney(e, setDiscountPrice)}
                        />
                    </div>
                </div>

                <div className="container-grid-products">
                    <div className="container-input-products">
                        <label htmlFor="product-category">Categoria</label>
                        <select
                            id="product-category"
                            className="input-products"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                        >
                            <option value="">Selecione</option>
                            {categoria.map((value) => (
                                <option key={value.id} value={value.id}>
                                    {value.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="container-input-products">
                        <label htmlFor="product-brand">Marca</label>
                        <input
                            id="product-brand"
                            className="input-products"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                        />
                    </div>
                </div>

                <div className="container-input-products">
                    <label htmlFor="product-description">Descrição</label>
                    <textarea
                        id="product-description"
                        className="input-description-products"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                    />
                </div>

                <div className="container-grid-products">
                    <div className="container-input-products">
                        <label htmlFor="product-stock">Estoque</label>
                        <input
                            id="product-stock"
                            type="number"
                            className="input-products"
                            value={stock}
                            min={0}
                            step={1}
                            onChange={(e) => setStock(e.target.value)}
                        />
                    </div>
                    <div className="container-input-products">
                        <label htmlFor="product-sizes">Tamanhos (separados por vírgula)</label>
                        <input
                            id="product-sizes"
                            className="input-products"
                            value={sizes}
                            onChange={(e) => setSizes(e.target.value)}
                            placeholder="P,M,G,GG"
                        />
                    </div>
                </div>

                <div className="container-input-products">
                    <label htmlFor="product-images">Imagens (até 10)</label>
                    <input
                        id="product-images"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFiles}
                    />
                    <p className="field-hint">
                        A primeira imagem vira a capa na vitrine.
                    </p>
                </div>

                {(currentImages.length > 0 || files.length > 0) && (
                    <div className="image-manager">
                        {currentImages.map((url, index) => (
                            <div key={`cur-${url}-${index}`} className="image-chip">
                                <img src={resolveImageUrl(url)} alt="" />
                                <span>Atual {index + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => removeCurrentImage(index)}
                                    aria-label={`Remover imagem atual ${index + 1}`}
                                >
                                    <X size={14} aria-hidden="true" />
                                </button>
                            </div>
                        ))}
                        {files.map((file, index) => (
                            <div key={`new-${file.name}-${index}`} className="image-chip">
                                <img src={previews[index]} alt="" />
                                <span>Nova {index + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => removeNewFile(index)}
                                    aria-label={`Remover imagem nova ${index + 1}`}
                                >
                                    <X size={14} aria-hidden="true" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="container-input-products">
                    <label htmlFor="product-status">Status</label>
                    <select
                        id="product-status"
                        className="input-products"
                        value={isActive ? "true" : "false"}
                        onChange={(e) => setIsActive(e.target.value === "true")}
                    >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                    </select>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="bnt-secondary"
                        onClick={() => navigate("/admin/produtos")}
                    >
                        Cancelar
                    </button>
                    <button type="submit" className="bnt-cad-product" disabled={saving}>
                        {saving
                            ? "Salvando..."
                            : mode === "create"
                              ? "Cadastrar"
                              : "Salvar alterações"}
                    </button>
                </div>
            </form>
        </div>
    );
}
