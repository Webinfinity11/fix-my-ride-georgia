import type { Database } from "@/integrations/supabase/types";

type Laundry = Database["public"]["Tables"]["laundries"]["Row"];

// Function to create laundry marker HTML
export const createLaundryMarkerHTML = (laundry: Laundry, isSelected: boolean = false) => {
  const size = isSelected ? 32 : 28;
  const iconSize = isSelected ? 16 : 14;
  const borderWidth = isSelected ? 4 : 3;
  const backgroundColor = isSelected ? '#10B981' : '#0EA5E9'; // Green when selected, cyan otherwise
  
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
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      </svg>
    </div>
  `;
};

// Function to create laundry popup HTML
export const createLaundryPopupHTML = (laundry: Laundry) => {
  return `
    <div style="max-width: 280px; min-width: 250px;">
      <h3 style="margin: 0 0 12px 0; font-weight: 600; font-size: 16px; color: #1a1a1a;">${laundry.name}</h3>
      
      ${laundry.photos && laundry.photos.length > 0 ? 
        `<img src="${laundry.photos[0]}" 
              alt="${laundry.name}" 
              style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 12px;" />` : 
        `<div style="width: 100%; height: 120px; background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); border-radius: 6px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center;">
          <div style="font-size: 24px;">🧼</div>
        </div>`
      }
      
      <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">
        ${laundry.description || 'პროფესიონალური ავტოსამრეცხაო სერვისი'}
      </p>
      
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
        ${laundry.water_price ? `<span style="background: #e0f2fe; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap;">წყალი: ${laundry.water_price}₾</span>` : ''}
        ${laundry.foam_price ? `<span style="background: #e0f2fe; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap;">ქაფი: ${laundry.foam_price}₾</span>` : ''}
        ${laundry.wax_price ? `<span style="background: #e0f2fe; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap;">ცვილი: ${laundry.wax_price}₾</span>` : ''}
      </div>
      
      ${laundry.box_count ? `<p style="margin: 0 0 12px 0; color: #666; font-size: 13px;">📦 ბოქსების რაოდენობა: ${laundry.box_count}</p>` : ''}
      
      ${laundry.contact_number ? `<button onclick="window.location.href='tel:${laundry.contact_number}'" 
              style="width: 100%; background-color: #0EA5E9; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;">
        📞 დარეკვა
      </button>` : ''}
    </div>
  `;
};
