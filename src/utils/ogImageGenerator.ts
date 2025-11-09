/**
 * Dynamic Open Graph Image URL Generator
 * 
 * Generates optimized OG image URLs for services and mechanics
 * Can be extended to use external OG image generation services
 */

export type OGImageType = 'service' | 'mechanic' | 'category';

interface OGImageData {
  title: string;
  subtitle?: string;
  rating?: number;
  reviewCount?: number;
  city?: string;
  price?: string;
  image?: string;
  badge?: 'VIP' | 'SUPER_VIP' | 'VERIFIED';
}

/**
 * Generate OG image URL for dynamic content
 * Currently returns fallback image, but can be extended to use services like:
 * - Vercel OG Image Generation
 * - Cloudinary Dynamic Images
 * - Custom image generation API
 */
export const generateOGImageUrl = (
  type: OGImageType,
  data: OGImageData
): string => {
  const baseUrl = 'https://fixup.ge';
  const defaultImage = `${baseUrl}/fixup-og-image.jpg`;

  // If service/mechanic has a photo, use it as OG image
  if (data.image) {
    return data.image;
  }

  // TODO: Implement dynamic OG image generation
  // Example integration with Vercel OG or similar service:
  // const params = new URLSearchParams({
  //   type,
  //   title: data.title,
  //   subtitle: data.subtitle || '',
  //   rating: data.rating?.toString() || '',
  //   city: data.city || '',
  //   badge: data.badge || ''
  // });
  // return `${baseUrl}/api/og?${params.toString()}`;

  // For now, return default image
  return defaultImage;
};

/**
 * Generate OG image for service
 */
export const generateServiceOGImage = (service: {
  name: string;
  city?: string;
  rating?: number;
  review_count?: number;
  price_from?: number;
  photos?: string[];
  is_vip_active?: boolean;
  vip_status?: string;
}): string => {
  return generateOGImageUrl('service', {
    title: service.name,
    subtitle: service.city,
    rating: service.rating || undefined,
    reviewCount: service.review_count || undefined,
    price: service.price_from ? `${service.price_from}₾-დან` : undefined,
    image: service.photos?.[0],
    badge: service.is_vip_active 
      ? (service.vip_status === 'super_vip' ? 'SUPER_VIP' : 'VIP')
      : undefined
  });
};

/**
 * Generate OG image for mechanic
 */
export const generateMechanicOGImage = (mechanic: {
  first_name: string;
  last_name: string;
  city?: string;
  rating?: number;
  review_count?: number;
  specialization?: string;
  is_verified?: boolean;
  avatar_url?: string;
}): string => {
  return generateOGImageUrl('mechanic', {
    title: `${mechanic.first_name} ${mechanic.last_name}`,
    subtitle: mechanic.specialization || 'ავტოხელოსანი',
    rating: mechanic.rating || undefined,
    reviewCount: mechanic.review_count || undefined,
    city: mechanic.city,
    image: mechanic.avatar_url,
    badge: mechanic.is_verified ? 'VERIFIED' : undefined
  });
};

/**
 * Generate OG image for category
 */
export const generateCategoryOGImage = (category: {
  name: string;
  description?: string;
  serviceCount?: number;
}): string => {
  return generateOGImageUrl('category', {
    title: category.name,
    subtitle: category.description || `${category.serviceCount || 0} სერვისი`
  });
};
