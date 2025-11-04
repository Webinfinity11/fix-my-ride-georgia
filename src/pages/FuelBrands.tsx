import Layout from "@/components/layout/Layout";
import { FuelBrandVoting } from "@/components/fuel/FuelBrandVoting";
import SEOHead from "@/components/seo/SEOHead";

const FuelBrands = () => {
  return (
    <Layout>
      <SEOHead
        title="საწვავის ბრენდები - ფიქსაპ"
        description="აირჩიეთ თქვენთვის სასურველი საწვავის კომპანია და მისცით ხმა"
        keywords="საწვავი, ბრენდები, Gulf, Socar, Wissol, Lukoil, Connect, რეიტინგი"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <FuelBrandVoting />
      </div>
    </Layout>
  );
};

export default FuelBrands;
