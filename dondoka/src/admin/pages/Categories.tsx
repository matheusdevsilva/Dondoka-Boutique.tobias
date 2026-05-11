import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Categories.css";

interface Category {
    id: string;
    name: string;
}

export default function Categories() {

    const [nameCategoria, setNameCategoria] = useState<string>("");
    const [categoria, setCategoria] = useState<Category[]>([]);
    const [search, setSearch] = useState<string>("");

    const [openModal, setOpenModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);

    const [selectedId, setSelectedId] = useState<string | null>(null);

    // 📦 GET CATEGORIAS
    async function getCategoria() {
        try {
            const response = await api.get("/admin/categories");
            setCategoria(response.data.data);
        } catch (error) {
            console.error(error);
        }
    }
 
 
   // ➕ CREATE
    async function createCategoria() {
        try {
            if (!nameCategoria) return;

            await api.post("/admin/categories/add", {
                name: nameCategoria
            });

            setNameCategoria("");
            setOpenModal(false);
            getCategoria();

        } catch (error) {
            console.error(error);
        }
    }

    // 🗑️ DELETE CONFIRMADO
    async function confirmDelete() {
        if (!selectedId) return;

        try {
            await api.delete(`/admin/categories/delete/${selectedId}`);

            setOpenDeleteModal(false);
            setSelectedId(null);
            getCategoria();

        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        getCategoria();
    }, []);

    // 🔎 FILTRO BUSCA
    const filteredCategorias = categoria.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="categories-page">

            {/* HEADER */}
            <div className="categories-header">

                <input
                    type="text"
                    placeholder="Buscar categoria..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <button onClick={() => setOpenModal(true)}>
                    Criar Categoria
                </button>

            </div>

            {/* LISTA */}
            <div className="categories-list">

                {filteredCategorias.map((item) => (
                    <div key={item.id} className="category-card">

                        <span>{item.name}</span>

                        <button
                            onClick={() => {
                                setSelectedId(item.id);
                                setOpenDeleteModal(true);
                            }}
                        >
                            Deletar
                        </button>

                    </div>
                ))}

            </div>

            {/* 🟣 MODAL CRIAR */}
            {openModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setOpenModal(false)}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Nova Categoria</h3>

                        <input
                            type="text"
                            placeholder="Nome da categoria"
                            value={nameCategoria}
                            onChange={(e) => setNameCategoria(e.target.value)}
                        />

                        <div className="modal-actions">

                            <button onClick={() => setOpenModal(false)}>
                                Cancelar
                            </button>

                            <button onClick={createCategoria}>
                                Salvar
                            </button>

                        </div>
                    </div>
                </div>
            )}

          
            {openDeleteModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setOpenDeleteModal(false)}
                >
                    <div
                        className="modal-content delete"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Tem certeza?</h3>

                        <p>Essa ação não pode ser desfeita.</p>

                        <div className="modal-actions">

                            <button onClick={() => setOpenDeleteModal(false)}>
                                Cancelar
                            </button>

                            <button onClick={confirmDelete}>
                                Sim, deletar
                            </button>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}