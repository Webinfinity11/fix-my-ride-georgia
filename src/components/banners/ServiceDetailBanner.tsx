const ServiceDetailBanner = () => {
  return (
    <div className="w-full">
      <div 
        className="relative bg-primary rounded-xl shadow-lg overflow-hidden mx-auto"
        style={{ maxWidth: '730px', height: '90px' }}
      >
        {/* Content */}
        <div className="flex items-center justify-center h-full px-6">
          <div className="text-center text-primary-foreground">
            <p className="text-lg font-bold">სარეკლამო ადგილი</p>
            <p className="text-sm opacity-90">730 x 90 px</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailBanner;
