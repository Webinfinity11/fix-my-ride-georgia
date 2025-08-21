import { useState, useEffect, useRef } from "react";
import { useServices } from "@/hooks/useServices";
import ServiceCard from "@/components/services/ServiceCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Star, Car, CreditCard, MapPin, Wrench, Fuel, Zap, Settings, Paintbrush, Shield } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { Link, useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

// Add custom styles for markers
const customMarkerStyles = `
  .custom-div-icon {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
  }
  
  .leaflet-div-icon .leaflet-div-icon {
    background: none;
    border: none;
  }

  .custom-div-icon img {
    max-width: 12px !important;
    max-height: 12px !important;
    width: 12px !important;
    height: 12px !important;
  }

  /* Ensure Leaflet doesn't override z-index */
  .leaflet-container,
  .leaflet-pane,
  .leaflet-tile-pane,
  .leaflet-shadow-pane,
  .leaflet-marker-pane,
  .leaflet-popup-pane {
    z-index: 1 !important;
  }
`;

// Function to get icon based on service category
const getServiceIcon = (categoryName: string | null) => {
  if (!categoryName) return Wrench;
  
  const category = categoryName.toLowerCase();
  
  if (category.includes('ზღვარი') || category.includes('მოვლა')) return Settings;
  if (category.includes('ცვლილება') || category.includes('შეკეთება')) return Wrench;
  if (category.includes('საწვავი') || category.includes('ბენზი')) return Fuel;
  if (category.includes('ელექტრო') || category.includes('ბატარეა')) return Zap;
  if (category.includes('ღებავა') || category.includes('ფერი')) return Paintbrush;
  if (category.includes('დაცვა') || category.includes('უსაფრთხოება')) return Shield;
  if (category.includes('სერვისი') || category.includes('მობილური')) return Car;
  
  return Wrench; // Default icon
};

// Function to get color based on automotive service category
const getServiceColor = (categoryName: string | null) => {
  if (!categoryName) return '#0F4C81';
  
  const category = categoryName.toLowerCase();
  
  // Engine/Oil service - Green (eco-friendly)
  if (category.includes('ზეთი') || category.includes('ძრავა') || category.includes('ზღვარი')) return '#10B981';
  
  // Tire service - Dark blue (rubber/road)
  if (category.includes('ღუშა') || category.includes('ბორბალი') || category.includes('ტაშა')) return '#1E40AF';
  
  // Brake service - Red (safety/warning)
  if (category.includes('მუხრუჭი') || category.includes('ბრეკი')) return '#DC2626';
  
  // General repair - Blue (trust/professional)
  if (category.includes('შეკეთება') || category.includes('რემონტი') || category.includes('სერვისი')) return '#2563EB';
  
  // Gas/Fuel - Orange (energy/fuel)
  if (category.includes('ბენზი') || category.includes('საწვავი') || category.includes('გაზი')) return '#EA580C';
  
  // Electrical/Battery - Purple (electrical)
  if (category.includes('ბატარეა') || category.includes('ელექტრო') || category.includes('გენერატორი')) return '#7C3AED';
  
  // Body work/Painting - Pink (creativity/aesthetics)
  if (category.includes('ღებავა') || category.includes('კაროსერია') || category.includes('ფერი')) return '#DB2777';
  
  // Air conditioning - Cyan (cool/air)
  if (category.includes('კონდიციონერი') || category.includes('კლიმატი')) return '#0891B2';
  
  // Mobile service - Teal (mobility/movement)
  if (category.includes('მობილური') || category.includes('ადგილზე')) return '#0D9488';
  
  return '#0F4C81'; // Default automotive blue
};

// Function to create uniform marker HTML like popup
const createCustomMarkerHTML = (service: any, isSelected: boolean = false) => {
  const size = isSelected ? 32 : 28;
  const iconSize = isSelected ? 14 : 12;
  const borderWidth = isSelected ? 4 : 3;
  const backgroundColor = isSelected ? '#DC2626' : '#0F4C81'; // Red when selected, blue otherwise
  
  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${backgroundColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: ${borderWidth}px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: all 0.2s ease;
    ">
      <img src="/icons/service-pin.png" 
           alt="Service" 
           width="${iconSize}" 
           height="${iconSize}" 
           style="filter: brightness(0) invert(1);" />
    </div>
  `;
};

// Function to get SVG path for automotive service icons
const getIconSVG = (categoryName: string | null) => {
  if (!categoryName) return '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91-6.91a6 6 0 0 1 7.94-7.94l3.77 3.77z"/>';
  
  const category = categoryName.toLowerCase();
  
  // Oil change / Engine service (ზეთის შეცვლა / ძრავის სერვისი)
  if (category.includes('ზეთი') || category.includes('ძრავა') || category.includes('ზღვარი')) {
    return '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><path d="M12 6V2m0 4v4m-4-2h8"/>';
  }
  
  // Tire service (ბორბლები / ღუშები)
  if (category.includes('ღუშა') || category.includes('ბორბალი') || category.includes('ტაშა')) {
    return '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4m-10-10h4m12 0h4m-16.24-7.76l2.83 2.83m11.31 0l2.83-2.83m0 11.31l-2.83-2.83m-11.31 0l-2.83 2.83"/>';
  }
  
  // Brake service (მუხრუჭები)
  if (category.includes('მუხრუჭი') || category.includes('ბრეკი')) {
    return '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v2m0 14v2m-9-9h2m14 0h2M7.5 7.5l1.4 1.4m7.1 0l1.4-1.4m0 9.9l-1.4-1.4m-7.1 0l-1.4 1.4"/><rect x="10" y="10" width="4" height="4" rx="1"/>';
  }
  
  // Car repair / Mechanic service (შეკეთება)
  if (category.includes('შეკეთება') || category.includes('რემონტი') || category.includes('სერვისი')) {
    return '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91-6.91a6 6 0 0 1 7.94-7.94l3.77 3.77z"/><path d="M6 6L2 2m0 4l4-4m4 8l8-8m-8 8v6a2 2 0 0 0 2 2h4"/>';
  }
  
  // Gas station (ბენზინი / საწვავი)
  if (category.includes('ბენზი') || category.includes('საწვავი') || category.includes('გაზი')) {
    return '<rect x="2" y="6" width="6" height="14" rx="1"/><path d="M8 11h2v2H8z"/><path d="M10 6L12 4l2 2v14a2 2 0 0 0 2 2h2"/><path d="M18 8h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><circle cx="15" cy="4" r="1"/>';
  }
  
  // Battery / Electrical (ბატარეა / ელექტრო)
  if (category.includes('ბატარეა') || category.includes('ელექტრო') || category.includes('გენერატორი')) {
    return '<rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 12h12M9 9v6m6-6v6"/><rect x="22" y="10" width="2" height="4"/><path d="M6 9V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>';
  }
  
  // Body work / Painting (ღებავა / კაროსერია)
  if (category.includes('ღებავა') || category.includes('კაროსერია') || category.includes('ფერი')) {
    return '<path d="M12 2L8 8h8l-4-6z"/><path d="M8 8v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8"/><circle cx="12" cy="14" r="2"/><path d="M9 18h6"/>';
  }
  
  // Air conditioning (კონდიციონერი)
  if (category.includes('კონდიციონერი') || category.includes('კლიმატი')) {
    return '<path d="M12 2v20M2 12h20M6.34 6.34l11.32 11.32M6.34 17.66L17.66 6.34"/><circle cx="12" cy="12" r="3"/>';
  }
  
  // Mobile service (მობილური სერვისი)
  if (category.includes('მობილური') || category.includes('ადგილზე')) {
    return '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 9.6a2 2 0 0 0-1.6-1.4C16.3 8.2 14.1 8 12 8s-4.3.2-4.8.2c-.6.1-1.2.6-1.6 1.4L3.5 11.2C2.7 11.5 2 12.3 2 13.2V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M12 6V2m4 8l4-4m-8 4L8 6"/>';
  }
  
  // Default automotive wrench icon
  return '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91-6.91a6 6 0 0 1 7.94-7.94l3.77 3.77z"/>';
};

const Map = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState<any>(null);
  
  const {
    services,
    categories,
    cities,
    loading,
    fetchInitialData,
    fetchServices,
  } = useServices();

  // Apply search filters only
  const baseFilteredServices = services.filter((service) => {
    // Search query filter
    const matchesSearch = searchQuery === "" || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.mechanic?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.mechanic?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Apply viewport filter only to sidebar services (and only show services with coordinates)
  const filteredServices = baseFilteredServices.filter((service) => {
    // Only show services that have coordinates (that have pins on map)
    const hasCoordinates = service.latitude && service.longitude;
    
    // Map bounds filter - only show services visible on current map view
    const isInMapBounds = !mapBounds || !hasCoordinates || 
      mapBounds.contains([service.latitude, service.longitude]);

    return hasCoordinates && isInMapBounds;
  });

  // Sort services to show selected service first
  const sortedFilteredServices = [...filteredServices].sort((a, b) => {
    if (selectedService?.id === a.id) return -1;
    if (selectedService?.id === b.id) return 1;
    return 0;
  });

  // Clear filters function
  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedCity(null);
    setSearchQuery("");
  };

  // Count active filters
  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedCity !== null,
    searchQuery !== ""
  ].filter(Boolean).length;

  // Filter services that have location data for map (use base filtered for map markers)
  const servicesWithLocation = baseFilteredServices.filter(
    (service) => service.latitude && service.longitude
  );

  // Default map center (Tbilisi, Georgia)
  // Tbilisi coordinates for initial map view
const defaultCenter: [number, number] = [41.7151, 44.8271];

  const handleMapFocus = (service: any) => {
    setSelectedService(service);
    if (map && service.latitude && service.longitude) {
      map.setView([service.latitude, service.longitude], 15);
      
      // Find and open the popup for this service
      setTimeout(() => {
        map.eachLayer((layer: any) => {
          if (layer.options && layer.options.pane === 'markerPane') {
            // Check if this marker belongs to the selected service
            if (layer.getLatLng && layer.getLatLng().lat === service.latitude && layer.getLatLng().lng === service.longitude) {
              layer.openPopup();
            }
          }
        });
      }, 100);
    }
  };

  // Function to apply filters and fetch services
  const applyFilters = async () => {
    await fetchServices({
      searchTerm: searchQuery,
      selectedCategory,
      selectedCity,
      selectedDistrict: null,
      selectedBrands: [],
      onSiteOnly: false,
      minRating: null,
    });
  };

  // Fetch services on component mount
  useEffect(() => {
    const loadServices = async () => {
      console.log("🗺️ Map component loading services...");
      await fetchInitialData();
      // Fetch all services with current filters
      await applyFilters();
    };

    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  // Apply filters when they change
  useEffect(() => {
    if (categories.length > 0) { // Only apply if data is loaded
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedCity]);

  // Search with delay (debounce)
  useEffect(() => {
    if (categories.length === 0) return; // Don't apply if data not loaded yet
    
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 500); // Apply search after 500ms delay

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    if (!mapRef.current || map) return;
    
    // Inject custom styles
    const styleElement = document.createElement('style');
    styleElement.innerHTML = customMarkerStyles;
    document.head.appendChild(styleElement);

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      const L = await import('leaflet');

      const leafletMap = L.map(mapRef.current!).setView(defaultCenter, 11);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(leafletMap);

      setMap(leafletMap);
      
      // Set initial bounds
      setMapBounds(leafletMap.getBounds());
      
      // Listen to map move events to update bounds
      leafletMap.on('moveend zoomend', () => {
        setMapBounds(leafletMap.getBounds());
      });
    };

    initMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Update markers when map or filtered services change
  useEffect(() => {
    if (!map || !servicesWithLocation) return;

    const updateMarkers = async () => {
      try {
        // Clear existing markers
        map.eachLayer((layer: any) => {
          if (layer.options && layer.options.pane === 'markerPane') {
            map.removeLayer(layer);
          }
        });

        // Only proceed if we have services
        if (servicesWithLocation.length === 0) return;

        // Add markers for services with location
        const L = await import('leaflet');
        servicesWithLocation.forEach((service) => {
          if (!service.latitude || !service.longitude) return;
          
          // Check if this service is selected
          const isSelected = selectedService?.id === service.id;
          const size = isSelected ? 32 : 28;
          
          // Create custom icon without shadow
          const customIcon = L.divIcon({
            html: createCustomMarkerHTML(service, isSelected),
            className: 'custom-div-icon',
            iconSize: [size, size],
            iconAnchor: [size/2, size/2],
            popupAnchor: [0, -size/2]
          });
          
          const marker = L.marker([service.latitude, service.longitude], {
            icon: customIcon
          })
            .addTo(map)
            .bindPopup(`
              <div style="max-width: 280px; min-width: 250px;">
                <!-- Service Name -->
                <h3 style="margin: 0 0 12px 0; font-weight: 600; font-size: 16px; color: #1a1a1a; line-height: 1.2;">${service.name}</h3>
                
                <!-- Service Photo -->
                ${service.photos && service.photos.length > 0 ? 
                  `<img src="${service.photos[0]}" 
                        alt="${service.name}" 
                        style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 12px;" />` : 
                  `<div style="width: 100%; height: 120px; background: linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%); border-radius: 6px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; color: #0F4C81; font-size: 14px; text-align: center;">
                    <div>
                      <div style="font-size: 24px; margin-bottom: 4px;">🔧</div>
                      <div>სერვისის ფოტო</div>
                    </div>
                   </div>`
                }
                
                <!-- Short Description (2-3 lines max) -->
                <p style="margin: 0 0 12px 0; color: #666; font-size: 14px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                  ${service.description || 'მოიცავს მანქანის შეკეთებას და მომსახურებას პროფესიონალური მექანიკოსების მიერ.'}
                </p>
                
                <!-- Address -->
                <div style="margin: 0 0 12px 0; color: #555; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color: #0F4C81;">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>${service.address || (service.city && service.district ? `${service.city}, ${service.district}` : service.city || 'მისამართი მითითებული არ არის')}</span>
                </div>
                
                <!-- View Details Button -->
                <button onclick="window.location.href='/service/${service.id}'" 
                        style="
                          width: 100%; 
                          background-color: #0F4C81; 
                          color: white; 
                          border: none; 
                          padding: 10px 16px; 
                          border-radius: 6px; 
                          font-size: 14px; 
                          font-weight: 500; 
                          cursor: pointer;
                          transition: background-color 0.2s;
                        "
                        onmouseover="this.style.backgroundColor='#0d3f6b'"
                        onmouseout="this.style.backgroundColor='#0F4C81'">
                  დეტალების ნახვა
                </button>
              </div>
            `);

          // Handle marker click - open popup and move service to top of sidebar
          marker.on('click', () => {
            // Set selected service
            setSelectedService(service);
            
            // Move clicked service to top of the list by scrolling to top of sidebar
            requestAnimationFrame(() => {
              const sidebarScrollContainer = document.querySelector('.sidebar-scroll-container');
              if (sidebarScrollContainer) {
                sidebarScrollContainer.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }
            });
          });

          // Auto-open popup for selected service
          if (isSelected) {
            setTimeout(() => {
              marker.openPopup();
            }, 100);
          }
        });
      } catch (error) {
        console.error('Error updating markers:', error);
      }
    };

    updateMarkers();
  }, [map, searchQuery, services, selectedService]); // Depend on search query, services, and selected service

  return (
    <Layout>
      <SEOHead 
        title="Services Map - Fix My Ride Georgia"
        description="Find car repair services near you on our interactive map. Browse mechanics and services by location in Georgia."
      />
      
      <div className="flex h-[calc(100vh-64px)] flex-col md:flex-row">
        {/* Left Sidebar - Services List (20% width on desktop, hidden on mobile) */}
        <div className="hidden md:flex md:w-1/5 bg-white border-r border-gray-200 overflow-hidden flex-col h-full">
          <div className="p-2 md:p-4 border-b border-gray-200 space-y-2 md:space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="სერვისების ძიება..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

          </div>
          
          <div className="flex-1 overflow-y-auto sidebar-scroll-container">
            {/* Results Header */}
            {!loading && (
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-600">
                  <strong>{sortedFilteredServices.length}</strong> სერვისი ნაპოვნია
                  {servicesWithLocation.length !== sortedFilteredServices.length && (
                    <span className="ml-2 text-xs">
                      ({servicesWithLocation.length} რუკაზე)
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="p-2 md:p-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-600">სერვისები იტვირთება...</p>
                </div>
              ) : sortedFilteredServices.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <Search className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 mb-2">სერვისები ვერ მოიძებნა</p>
                  <p className="text-gray-400 text-sm">სცადეთ ფილტრების შეცვლა</p>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-4">
                  {sortedFilteredServices.map((service) => (
                    <div
                      key={service.id}
                      data-service-id={service.id}
                      className={`transition-all duration-200 touch-manipulation ${
                        selectedService?.id === service.id 
                          ? "ring-2 ring-primary rounded-lg" 
                          : ""
                      }`}
                    >
                      <ServiceCard 
                        service={service} 
                        onMapFocus={() => {
                          setSelectedService(service);
                          if (map && service.latitude && service.longitude) {
                            map.setView([service.latitude, service.longitude], 15);
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Map (80% width on desktop, full height on mobile) */}
        <div className="w-full md:w-4/5 h-full flex flex-col">
          {/* Top Filters Bar */}
          <div className="bg-white border-b border-gray-200 flex-shrink-0 relative z-[100]">
            <div className="p-2 md:p-3 overflow-x-auto">
              <div className="flex gap-2 md:gap-3 items-center" style={{minWidth: "fit-content"}}>
                {/* Category Filter */}
                <div className="flex-1 min-w-[150px] md:min-w-[200px]">
                  <Select value={selectedCategory.toString()} onValueChange={(value) => setSelectedCategory(value === "all" ? "all" : parseInt(value))}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="კატეგორია" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="all">ყველა კატეგორია</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City Filter */}
                <div className="flex-1 min-w-[120px] md:min-w-[150px]">
                  <Select value={selectedCity || "all_cities"} onValueChange={(value) => setSelectedCity(value === "all_cities" ? null : value)}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="ქალაქი" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="all_cities">ყველა ქალაქი</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>



                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    size="sm"
                    className="h-8 flex-shrink-0 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    გასუფთავება
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative z-0">
            <div ref={mapRef} className="h-full w-full z-0" />
            
            {/* Map Info Overlay */}
            <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg">
              <div className="text-xs text-gray-600">
                <strong>{servicesWithLocation.length}</strong> სერვისი
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Map;