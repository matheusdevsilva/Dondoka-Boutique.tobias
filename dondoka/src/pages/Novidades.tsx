import ShopCatalog from "../components/ShopCatalog";
import Seo from "../components/Seo";

export default function Novidades() {
    return (
        <>
            <Seo title="Novidades" description="As últimas peças que chegaram na Dondoka Boutique." />
            <ShopCatalog
                title="Novidades"
                subtitle="As últimas peças que chegaram na boutique"
                mode="new"
            />
        </>
    );
}
