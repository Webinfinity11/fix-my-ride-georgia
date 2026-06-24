import BannerCallCTA from "./BannerCallCTA";

const ServicesGridBanner = () => {
  return (
    <div className="col-span-full flex justify-center py-2">
      <div
        className="relative bg-primary rounded-xl shadow-lg overflow-hidden w-full"
        style={{ maxWidth: '730px', height: '90px' }}
      >
        <BannerCallCTA />
      </div>
    </div>
  );
};

export default ServicesGridBanner;