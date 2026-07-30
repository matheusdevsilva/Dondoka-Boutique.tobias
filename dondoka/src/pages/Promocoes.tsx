import Header from "../components/Header";
import Footer from "../components/Footer";
import ShopCatalog from "../components/ShopCatalog";

export default function Promocoes() {
    return (
        <>
            <Header />
            <ShopCatalog
                title="Promoções"
                subtitle="Peças selecionadas com condições especiais"
                mode="promo"
            />
            <Footer />
        </>
    );
}
