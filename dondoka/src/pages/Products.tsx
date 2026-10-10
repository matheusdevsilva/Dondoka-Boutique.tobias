import ShopCatalog from "../components/ShopCatalog";
import Seo from "../components/Seo";

export default function Products() {
    return (
        <>
            <Seo title="Coleção" description="Todas as peças da Dondoka Boutique." />
            <ShopCatalog
                title="Coleção"
                subtitle="Todas as peças da Dondoka Boutique"
                mode="all"
            />
        </>
    );
}
