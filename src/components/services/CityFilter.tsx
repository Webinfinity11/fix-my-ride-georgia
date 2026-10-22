import { useQuery } from "@tanstack/react-query";
import { publicServiceCityCountsOptions } from "@/lib/serviceMetadata";
import HorizontalFilterChoices from "@/components/services/HorizontalFilterChoices";

export default function CityFilter({ cities, selectedCity, onChange, getHref, availableCities }: { cities: string[]; selectedCity: string | null; onChange: (city: string | null) => void; getHref?: (city: string) => string | undefined; availableCities?: string[] }) {
  const { data } = useQuery(publicServiceCityCountsOptions);
  const ranked = [...new Set([...(data || []).map(row => row.city), ...cities, ...(selectedCity ? [selectedCity] : [])])].filter(city => !availableCities || availableCities.includes(city) || city === selectedCity);
  return <HorizontalFilterChoices getHref={getHref} items={ranked} selected={selectedCity ? [selectedCity] : []} onToggle={city => onChange(selectedCity === city ? null : city)} label="ქალაქის არჩევა" previousLabel="წინა ქალაქები" nextLabel="შემდეგი ქალაქები" />;
}
