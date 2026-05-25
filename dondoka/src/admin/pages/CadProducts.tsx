import { useEffect, useState } from "react";
import api from "../../services/api";
import "./CadProducts.css"

import {
    Package,
    Ruler,
    Palette,
    Tag,
    Users,
    Boxes
} from "lucide-react";


export default function CadProducts() {

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("")
    const [categoria, setCategoria] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState("");
    const [stock, setStock] = useState<number>(0);
    const [color, setColor] = useState("");
    const [size, setSize] = useState("");
    const [gender, setGender] = useState("");
    const [status, setStatus] = useState("")


    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [current, setCurrent] = useState(0);


    interface Category {
        id: string;
        name: string;
    }


    function handlePrice(e: React.ChangeEvent<HTMLInputElement>) {
        let value = e.target.value;

        value = value.replace(/\D/g, "");

        const number = Number(value) / 100;

        setPrice(number.toString());
    }
    function formatBRL(value: number | string) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(Number(value));
    }

    async function getCategoria() {
        try {
            const token = localStorage.getItem("token");

            const response = await api.get("/admin/categories", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCategoria(response.data.data)

        } catch (error) {

        }
    }



    function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files) return;

        const array = Array.from(e.target.files);

        const newPreviews = array.map(file =>
            URL.createObjectURL(file)
        );

        setFiles(array);
        setPreviews(newPreviews);
        setCurrent(0);
    }


    function removeImage(index: number) {

        const newFiles = files.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);

        setFiles(newFiles);
        setPreviews(newPreviews);

        if (current >= newPreviews.length) {
            setCurrent(Math.max(0, newPreviews.length - 1));
        }
    }


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const formData = new FormData();

        formData.append("name", name);
        formData.append("price", String(price));
        formData.append("stock", String(stock));
        formData.append("size", String(size));
        formData.append("categories", String(categoryId));
        formData.append("gender", gender);
        formData.append("color", color);
        formData.append("description", description);

        files.forEach(file => {
            formData.append("images", file);
        });

        await api.post("/admin/products/add/", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
            
        });

        alert("Produto cadastrado!");
    }

    useEffect(() => {
        getCategoria()
    }, [])

    return (
        <div className="product-layout">


            <div className="container-preview">
                <h3>Prévia do Produto</h3>

                {/* 🖼️ CARROSSEL */}
                {previews.length > 0 ? (
                    <>
                        <div className="carousel">
                            <img src={previews[current]} />

                            <div className="carousel-controls">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrent((c) => Math.max(c - 1, 0))
                                    }
                                >
                                    ◀
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrent((c) =>
                                            Math.min(c + 1, previews.length - 1)
                                        )
                                    }
                                >
                                    ▶
                                </button>
                            </div>
                        </div>

                        <div className="thumbnails">
                            {previews.map((img, index) => (
                                <div
                                    key={index}
                                    className={`thumb ${current === index ? "active" : ""
                                        }`}
                                >
                                    <img
                                        src={img}
                                        onClick={() => setCurrent(index)}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="preview-empty">
                        Nenhuma imagem selecionada
                    </div>
                )}

                {/* 📦 INFO DO PRODUTO */}
                <div className="preview-info">
                    <h4>{name || "Nome do produto"}</h4>

                    <span className="price">
                        {formatBRL(price || 0)}
                    </span>

                    <p>{description || "Sem descrição"}</p>

                    <div className="preview-grid">

                        <div className="preview-item">
                            <Boxes size={16} />
                            <div>
                                <span>Estoque</span>
                                <strong>{stock || 0}</strong>
                            </div>
                        </div>

                        <div className="preview-item">
                            <Palette size={16} />
                            <div>
                                <span>Cor</span>
                                <strong>{color || "-"}</strong>
                            </div>
                        </div>

                        <div className="preview-item">
                            <Ruler size={16} />
                            <div>
                                <span>Tamanho</span>
                                <strong>{size || "-"}</strong>
                            </div>
                        </div>

                        <div className="preview-item">
                            <Users size={16} />
                            <div>
                                <span>Gênero</span>
                                <strong>{gender || "-"}</strong>
                            </div>
                        </div>

                        <div className="preview-item">
                            <Tag size={16} />
                            <div>
                                <span>Categoria</span>
                                <strong>
                                    {categoria.find(c => c.id === categoryId)?.name || "-"}
                                </strong>
                            </div>
                        </div>

                        <div className="preview-item">
                            <Package size={16} />
                            <div>
                                <span>Status</span>
                                <strong>{status}</strong>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <form className="container-forms-products" onSubmit={handleSubmit}>

                <div className="container-input-products">
                    <label>Nome</label>

                    <input
                        value={name}
                        className="input-products"
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>


                <div className="container-grid-products">

                    {/* PREÇO */}
                    <div className="container-input-products">
                        <label>Preço</label>

                        <input
                            type="text"
                            className="input-products"
                            value={formatBRL(price || 0)}
                            onChange={handlePrice}
                        />
                    </div>

                    {/* ESTOQUE */}
                    <div className="container-input-products">
                        <label>Quantidade em Estoque</label>

                        <input
                            type="number"
                            className="input-products"
                            placeholder="0" onChange={(e) => setStock(Number(e.target.value))}
                        />
                    </div>

                </div>


                <div className="container-grid-products">


                    <div className="container-input-products">
                        <label>Categoria</label>

                        <select
                            className="input-products"
                            value={categoryId}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                setCategoryId(e.target.value)
                            }
                        >
                            <option value="">
                                Selecione
                            </option>

                            {categoria.map((value: Category) => (
                                <option
                                    key={value.id}
                                    value={value.id}
                                >
                                    {value.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* GÊNERO */}
                    <div className="container-input-products">
                        <label>Gênero</label>

                        <select className="input-products" onChange={(e) => setGender(e.target.value)}>
                            <option>Selecione</option>
                            <option>Masculino</option>
                            <option>Feminino</option>
                            <option>Unissex</option>
                        </select>
                    </div>

                </div>


                <div className="container-grid-products">

                    {/* COR */}
                    <div className="container-input-products">
                        <label>Cor</label>

                        <input
                            type="text"
                            className="input-products"
                            placeholder="Ex: Preto" onChange={(e) => setColor(e.target.value)}
                        />
                    </div>

                    {/* TAMANHO */}
                    <div className="container-input-products">
                        <label>Tamanho</label>

                        <select className="input-products" onChange={(e) => setSize(e.target.value)}>
                            <option>Selecione</option>
                            <option>P</option>
                            <option>M</option>
                            <option>G</option>
                            <option>GG</option>
                        </select>
                    </div>

                </div>

                {/* 📄 DESCRIÇÃO */}
                <div className="container-input-products">
                    <label>Descrição</label>
                    <textarea
                        className="input-description-products"
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ resize: "none" }}
                    />
                </div>

                {/* 📸 IMAGENS */}
                <div className="container-input-products">
                    <label>Imagens</label>

                    <input
                        type="file"
                        multiple
                        onChange={handleFiles}
                    />
                </div>
                <div className="container-input-products">
                    <label>Status</label>
                    <select className="input-products" onChange={(e) => setStatus(e.target.value)}>
                        <option>Selecione</option>
                        <option>Ativo</option>
                        <option>Inativo</option>
                        <option>Rascunho</option>
                    </select>
                </div>



                {/* 🚀 BOTÃO */}
                <button className="bnt-cad-product">
                    Cadastrar
                </button>

            </form>

        </div>
    );
}