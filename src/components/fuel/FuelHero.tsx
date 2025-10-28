import { useFuelPageSettings } from "@/hooks/useFuelImporters";

const FuelHero = () => {
  const { data: pageSettings } = useFuelPageSettings();
  
  // თუ banner არ არის - არაფერი არ გამოჩნდეს
  if (!pageSettings?.banner_url) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-[1400px] mx-auto">
        <img 
          src={pageSettings.banner_url} 
          alt="საწვავის იმპორტიორები - სარეკლამო ბანერი"
          className="w-full h-auto rounded-lg shadow-md"
          loading="eager"
          style={{ minHeight: '200px', backgroundColor: '#f3f4f6' }}
        />
      </div>
    </div>
  );
};

export default FuelHero;
