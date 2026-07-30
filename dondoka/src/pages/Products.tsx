import Header from "../components/Header";
import Footer from "../components/Footer";
import ShopCatalog from "../components/ShopCatalog";

export default function Products() {
    return (
        <>
            <Header />
            <ShopCatalog
                title="Coleção"
                subtitle="Todas as peças da Dondoka Boutique"
                mode="all"
            />
            <Footer />
        </>
    );
}
