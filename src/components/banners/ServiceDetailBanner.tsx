import BannerCallCTA from "./BannerCallCTA";

const ServiceDetailBanner = () => {
  return (
    <div className="w-full">
      <div
        className="relative bg-primary rounded-xl shadow-lg overflow-hidden mx-auto"
        style={{ maxWidth: '730px', height: '90px' }}
      >
        <BannerCallCTA />
      </div>
    </div>
  );
};

export default ServiceDetailBanner;
