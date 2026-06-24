import BannerCallCTA from "./BannerCallCTA";

const MapStationsBanner = () => {
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] hidden md:block"
    >
      <div
        className="relative bg-primary rounded-xl shadow-lg overflow-hidden"
        style={{ width: '730px', height: '90px' }}
      >
        <BannerCallCTA />
      </div>
    </div>
  );
};

export default MapStationsBanner;
