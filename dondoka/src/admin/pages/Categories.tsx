import { useEffect, useState, type FormEvent } from "react";
import api, { apiErrorMessage, type ApiResponse } from "../../services/api";
import Modal from "../../components/Modal";
import "./Categories.css";

interface Category {
    id: string;
    name: string;
}

type Editing = { id: string | null; name: string };

export default function Categories() {
    const [categoria, setCategoria] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState<Editing | null>(null);
    const [deleting, setDeleting] = useState<Category | null>(null);
    const [formError, setFormError] = useState("");
    const [pageError, setPageError] = useState("");
    const [saving, setSaving] = useState(false);

    const [version, setVersion] = useState(0);
    const getCategoria = () => setVersion((v) => v + 1);

    useEffect(() => {
        const controller = new AbortController();
        api.get<ApiResponse<Category[]>>("/admin/categories", { signal: controller.signal })
            .then((response) => setCategoria(response.data.data || []))
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setPageError(apiErrorMessage(error, "Erro ao carregar categorias."));
                }
            });
        return () => controller.abort();
    }, [version]);

    function openForm(category?: Category) {
        setFormError("");
        setEditing(category ? { id: category.id, name: category.name } : { id: null, name: "" });
    }

    async function saveCategory(e: FormEvent) {
        e.preventDefault();
        if (!editing) return;
        const name = editing.name.trim();
        if (!name) {
            setFormError("Informe o nome da categoria.");
            return;
        }

        setSaving(true);
        try {
            if (editing.id) {
                await api.put(`/admin/categories/edit/${editing.id}`, { name });
            } else {
                await api.post("/admin/categories/add", { name });
            }
            setEditing(null);
            getCategoria();
        } catch (error) {
            setFormError(apiErrorMessage(error, "Erro ao salvar categoria."));
        } finally {
            setSaving(false);
        }
    }

    async function confirmDelete() {
        if (!deleting) return;
        try {
            await api.delete(`/admin/categories/delete/${deleting.id}`);
            getCategoria();
        } catch (error) {
            setPageError(apiErrorMessage(error, "Erro ao remover categoria."));
        } finally {
            setDeleting(null);
        }
    }

    const filteredCategorias = categoria.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="categories-page">
            <div className="categories-page-title">
                <h1>Categorias</h1>
                <p>Organize a loja por tipo de peça</p>
            </div>

            <div className="categories-header">
                <label htmlFor="category-search" className="sr-only">
                    Buscar categoria
                </label>
                <input
                    id="category-search"
                    type="search"
                    placeholder="Buscar categoria..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <button type="button" onClick={() => openForm()}>
                    Nova categoria
                </button>
            </div>

            {pageError && (
                <p className="categories-error" role="alert">
                    {pageError}
                </p>
            )}

            <ul className="categories-list">
                {filteredCategorias.map((item) => (
                    <li key={item.id} className="category-card">
                        <span>{item.name}</span>

                        <div className="category-actions">
                            <button
                                type="button"
                                onClick={() => openForm(item)}
                                aria-label={`Editar categoria ${item.name}`}
                            >
                                Editar
                            </button>
                            <button
                                type="button"
                                className="danger"
                                onClick={() => setDeleting(item)}
                                aria-label={`Deletar categoria ${item.name}`}
                            >
                                Deletar
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            <Modal
                open={editing != null}
                onClose={() => setEditing(null)}
                title={editing?.id ? "Editar categoria" : "Nova categoria"}
                overlayClassName="modal-overlay"
                panelClassName="modal-content"
                headClassName="modal-head"
            >
                <form onSubmit={saveCategory}>
                    <label htmlFor="category-name" className="sr-only">
                        Nome da categoria
                    </label>
                    <input
                        id="category-name"
                        type="text"
                        placeholder="Nome da categoria"
                        value={editing?.name ?? ""}
                        onChange={(e) => setEditing((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                        maxLength={80}
                        aria-invalid={!!formError}
                        aria-describedby={formError ? "category-error" : undefined}
                    />
                    {formError && (
                        <p id="category-error" className="categories-error" role="alert">
                            {formError}
                        </p>
                    )}
                    <div className="modal-actions">
                        <button type="button" onClick={() => setEditing(null)}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}>
                            {saving ? "Salvando..." : "Salvar"}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={deleting != null}
                onClose={() => setDeleting(null)}
                title="Tem certeza?"
                overlayClassName="modal-overlay"
                panelClassName="modal-content delete"
                headClassName="modal-head"
            >
                <p>A categoria “{deleting?.name}” será removida. Essa ação não pode ser desfeita.</p>
                <div className="modal-actions">
                    <button type="button" onClick={() => setDeleting(null)}>
                        Cancelar
                    </button>
                    <button type="button" onClick={confirmDelete}>
                        Sim, deletar
                    </button>
                </div>
            </Modal>
        </div>
    );
}
