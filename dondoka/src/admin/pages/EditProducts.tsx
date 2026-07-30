import { useParams } from "react-router-dom";
import ProductForm from "../components/ProductForm";

export default function EditProducts() {
    const { id } = useParams();
    return <ProductForm mode="edit" productId={id} />;
}
