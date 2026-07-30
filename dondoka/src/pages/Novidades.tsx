import Header from "../components/Header";
import Footer from "../components/Footer";
import ShopCatalog from "../components/ShopCatalog";

export default function Novidades() {
    return (
        <>
            <Header />
            <ShopCatalog
                title="Novidades"
                subtitle="As últimas peças que chegaram na boutique"
                mode="new"
            />
            <Footer />
        </>
    );
}
