import ShopCatalog from "../components/ShopCatalog";
import Seo from "../components/Seo";

export default function Promocoes() {
    return (
        <>
            <Seo title="Promoções" description="Peças selecionadas com condições especiais." />
            <ShopCatalog
                title="Promoções"
                subtitle="Peças selecionadas com condições especiais"
                mode="promo"
            />
        </>
    );
}
