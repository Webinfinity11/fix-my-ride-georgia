import { useState, useEffect, useRef } from "react";
import { useLaundries } from "@/hooks/useLaundries";
import LaundryCard from "@/components/laundry/LaundryCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, MapPin } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
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

// Function to create uniform marker HTML for laundries
const createCustomMarkerHTML = (laundry: any, isSelected: boolean = false) => {
  const size = isSelected ? 32 : 28;
  const iconSize = isSelected ? 14 : 12;
  const borderWidth = isSelected ? 4 : 3;
  const backgroundColor = isSelected ? '#DC2626' : '#0891B2'; // Red when selected, cyan for laundries
  
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
      <div style="color: white; font-size: ${iconSize}px;">🚿</div>
    </div>
  `;
};

const Laundries = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLaundry, setSelectedLaundry] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapBounds, setMapBounds] = useState<any>(null);
  
  const { data: laundries = [], isLoading } = useLaundries();

  // Apply search filters
  const baseFilteredLaundries = laundries.filter((laundry) => {
    const matchesSearch = searchQuery === "" || 
      laundry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      laundry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      laundry.address?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Apply viewport filter only to sidebar laundries (and only show laundries with coordinates)
  const filteredLaundries = baseFilteredLaundries.filter((laundry) => {
    // Only show laundries that have coordinates (that have pins on map)
    const hasCoordinates = laundry.latitude && laundry.longitude;
    
    // Map bounds filter - only show laundries visible on current map view
    const isInMapBounds = !mapBounds || !hasCoordinates || 
      mapBounds.contains([laundry.latitude, laundry.longitude]);

    return hasCoordinates && isInMapBounds;
  });

  // Sort laundries to show selected laundry first
  const sortedFilteredLaundries = [...filteredLaundries].sort((a, b) => {
    if (selectedLaundry?.id === a.id) return -1;
    if (selectedLaundry?.id === b.id) return 1;
    return 0;
  });

  // Filter laundries that have location data for map
  const laundriesWithLocation = baseFilteredLaundries.filter(
    (laundry) => laundry.latitude && laundry.longitude
  );

  // Default map center (Tbilisi, Georgia)
  const defaultCenter: [number, number] = [41.7151, 44.8271];

  const handleMapFocus = (laundry: any) => {
    setSelectedLaundry(laundry);
    if (map && laundry.latitude && laundry.longitude) {
      map.setView([laundry.latitude, laundry.longitude], 15);
      
      // Find and open the popup for this laundry
      setTimeout(() => {
        map.eachLayer((layer: any) => {
          if (layer.options && layer.options.pane === 'markerPane') {
            // Check if this marker belongs to the selected laundry
            if (layer.getLatLng && layer.getLatLng().lat === laundry.latitude && layer.getLatLng().lng === laundry.longitude) {
              layer.openPopup();
            }
          }
        });
      }, 100);
    }
  };

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

  // Update markers when map or filtered laundries change
  useEffect(() => {
    if (!map || !laundriesWithLocation) return;

    const updateMarkers = async () => {
      try {
        // Clear existing markers
        map.eachLayer((layer: any) => {
          if (layer.options && layer.options.pane === 'markerPane') {
            map.removeLayer(layer);
          }
        });

        // Only proceed if we have laundries
        if (laundriesWithLocation.length === 0) return;

        // Add markers for laundries with location
        const L = await import('leaflet');
        laundriesWithLocation.forEach((laundry) => {
          if (!laundry.latitude || !laundry.longitude) return;
          
          // Check if this laundry is selected
          const isSelected = selectedLaundry?.id === laundry.id;
          const size = isSelected ? 32 : 28;
          
          // Create custom icon without shadow
          const customIcon = L.divIcon({
            html: createCustomMarkerHTML(laundry, isSelected),
            className: 'custom-div-icon',
            iconSize: [size, size],
            iconAnchor: [size/2, size/2],
            popupAnchor: [0, -size/2]
          });
          
          const marker = L.marker([laundry.latitude, laundry.longitude], {
            icon: customIcon
          })
            .addTo(map)
            .bindPopup(`
              <div style="max-width: 280px; min-width: 250px;">
                <!-- Laundry Name -->
                <h3 style="margin: 0 0 12px 0; font-weight: 600; font-size: 16px; color: #1a1a1a; line-height: 1.2;">${laundry.name}</h3>
                
                <!-- Laundry Photo -->
                ${laundry.photos && laundry.photos.length > 0 ? 
                  `<img src="${laundry.photos[0]}" 
                        alt="${laundry.name}" 
                        style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 12px;" />` : 
                  `<div style="width: 100%; height: 120px; background: linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%); border-radius: 6px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; color: #0891B2; font-size: 14px; text-align: center;">
                    <div>
                      <div style="font-size: 24px; margin-bottom: 4px;">🚿</div>
                      <div>სამრეცხაო</div>
                    </div>
                  </div>`
                }
                
                <!-- Description -->
                ${laundry.description ? 
                  `<p style="margin: 0 0 12px 0; color: #666; font-size: 14px; line-height: 1.4;">${laundry.description.substring(0, 120)}${laundry.description.length > 120 ? '...' : ''}</p>` : 
                  ''
                }
                
                <!-- Address -->
                ${laundry.address ? 
                  `<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; color: #666; font-size: 13px;">
                    📍 ${laundry.address}
                  </div>` : 
                  ''
                }
                
                <!-- Pricing -->
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                  ${laundry.water_price ? `<span style="background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">წყალი: ${laundry.water_price}₾</span>` : ''}
                  ${laundry.foam_price ? `<span style="background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">ქაფი: ${laundry.foam_price}₾</span>` : ''}
                  ${laundry.wax_price ? `<span style="background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">ცვილი: ${laundry.wax_price}₾</span>` : ''}
                </div>
                
                <!-- Box Count -->
                ${laundry.box_count ? 
                  `<div style="color: #666; font-size: 13px; margin-bottom: 12px;">
                    📦 ${laundry.box_count} ბოქსი
                  </div>` : 
                  ''
                }
                
                <!-- Contact -->
                ${laundry.contact_number ? 
                  `<div style="margin-top: 12px;">
                    <button 
                      onclick="window.open('tel:${laundry.contact_number}', '_self')" 
                      style="background: #0891B2; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; width: 100%; transition: background-color 0.2s;"
                      onmouseover="this.style.background='#0e7490'"
                      onmouseout="this.style.background='#0891B2'"
                    >
                      📞 ${laundry.contact_number}
                    </button>
                  </div>` : 
                  ''
                }
              </div>
            `);
            
          // Add click event to marker
          marker.on('click', () => {
            setSelectedLaundry(laundry);
          });
        });
      } catch (error) {
        console.error('Error updating markers:', error);
      }
    };

    updateMarkers();
  }, [map, laundriesWithLocation, selectedLaundry]);

  return (
    <Layout>
      <SEOHead
        title="სამრეცხაოები - FixUp"
        description="იპოვეთ ახლომდებარე სამრეცხაოები. ავტომობილის რეცხვის სერვისები საუკეთესო ფასებით თბილისში."
        keywords="სამრეცხაო, ავტომობილის რეცხვა, car wash, თბილისი"
      />

      <div className="h-screen flex flex-col">
        {/* Search Header */}
        <div className="bg-background border-b p-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="მოძებნეთ სამრეცხაო..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4 mr-2" />
                  გასუფთავება
                </Button>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">სამრეცხაოები რუკაზე</h1>
              <Badge variant="secondary">
                ნაპოვნია {filteredLaundries.length} სამრეცხაო
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r bg-background overflow-y-auto">
            <div className="p-4 space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">იტვირთება სამრეცხაოები...</p>
                </div>
              ) : sortedFilteredLaundries.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">სამრეცხაო არ მოიძებნა</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery 
                      ? "სცადეთ სხვა საძიებო ტერმინი" 
                      : "ამ მხარეში სამრეცხაოები არ არის დარეგისტრირებული"
                    }
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSearchQuery("")}
                    >
                      ყველა სამრეცხაოს ნაჩვენები
                    </Button>
                  )}
                </div>
              ) : (
                sortedFilteredLaundries.map((laundry) => (
                  <div 
                    key={laundry.id}
                    className={`cursor-pointer transition-all ${
                      selectedLaundry?.id === laundry.id 
                        ? 'ring-2 ring-primary rounded-lg' 
                        : ''
                    }`}
                    onClick={() => handleMapFocus(laundry)}
                  >
                    <LaundryCard 
                      laundry={laundry}
                      onViewDetails={() => handleMapFocus(laundry)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <div ref={mapRef} className="h-full w-full" />
            
            {laundriesWithLocation.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center">
                  <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">სამრეცხაოები რუკაზე არ არის</h3>
                  <p className="text-muted-foreground">
                    ჯერ არ არის დამატებული სამრეცხაოები მდებარეობის ინფორმაციით
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Laundries;