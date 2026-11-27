import { useNavigate } from "react-router-dom";
import CityFilter from "@/components/services/CityFilter";
import HorizontalFilterChoices from "@/components/services/HorizontalFilterChoices";
import { CAR_BRAND_LOGOS } from "@/data/carBrandLogos";
import { BRAND_PAGES } from "@/utils/carBrands";
import { cataloguePath } from "@/utils/catalogueNavigation";
import { commonCarBrands } from "@/utils/commonCarBrands";
import { getCityByName } from "@/utils/locationCatalogue";

const brandPath = (name: string) => {
  const brand = BRAND_PAGES.find((item) => item.name === name);
  return brand ? `/brand/${brand.slug}` : undefined;
};

const cityPath = (name: string) => {
  const city = getCityByName(name);
  return city ? cataloguePath({ citySlug: city.slug }) : undefined;
};

/** The city and car-brand rows of the services page, as links from the home page. */
export default function HomeQuickFilters() {
  const navigate = useNavigate();
  return (
    <div className="min-w-0 space-y-1">
      <CityFilter cities={[]} selectedCity={null} getHref={cityPath}
        onChange={(city) => city && navigate(`/services?city=${encodeURIComponent(city)}`)} />
      <HorizontalFilterChoices
        items={commonCarBrands} selected={[]} getHref={brandPath} onToggle={() => {}}
        renderItem={(brand) => CAR_BRAND_LOGOS[brand]
          ? <img src={CAR_BRAND_LOGOS[brand]} alt="" aria-hidden="true" width={56} height={36} loading="lazy" className="h-9 w-14 max-w-none object-contain" />
          : <span className="text-xs">{brand}</span>}
        label="მანქანის მარკის არჩევა" previousLabel="წინა მარკები" nextLabel="შემდეგი მარკები" />
    </div>
  );
}
