import React from 'react';
import { Helmet } from 'react-helmet-async';

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone?: string;
    email?: string;
    contactType?: string;
  };
}

export const OrganizationSchema = ({
  name = "ავტოხელოსანი",
  url = "https://fixup.ge",
  logo = "https://fixup.ge/fixup-og-image.jpg",
  description = "საქართველოს უდიდესი ავტოსერვისების პლატფორმა",
  contactPoint = { contactType: "customer service" }
}: OrganizationSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
    contactPoint: {
      "@type": "ContactPoint",
      ...contactPoint,
      availableLanguage: "Georgian"
    },
    sameAs: [],
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface LocalBusinessSchemaProps {
  name: string;
  address: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  telephone?: string;
  url?: string;
  priceRange?: string;
  rating?: {
    ratingValue: number;
    reviewCount: number;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
}

export const LocalBusinessSchema = ({
  name,
  address,
  telephone,
  url,
  priceRange = "$$",
  rating,
  geo,
  openingHours
}: LocalBusinessSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AutomotiveRepairShop",
    "@id": url,
    name,
    address: {
      "@type": "PostalAddress",
      ...address,
      addressCountry: address.addressCountry || "GE"
    },
    telephone,
    url,
    priceRange,
    ...(geo && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: geo.latitude,
        longitude: geo.longitude
      }
    }),
    ...(openingHours && { openingHours }),
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating.ratingValue,
        reviewCount: rating.reviewCount,
        bestRating: 5,
        worstRating: 1
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface ServiceSchemaProps {
  name: string;
  description: string;
  provider: {
    name: string;
    telephone?: string;
    address?: any;
  };
  areaServed?: string;
  offers?: {
    price?: string | number;
    priceCurrency?: string;
    availability?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export const ServiceSchema = ({
  name,
  description,
  provider,
  areaServed,
  offers,
  aggregateRating
}: ServiceSchemaProps) => {
  // Validate price for Service schema
  const hasValidPrice = offers?.price && 
    typeof offers.price === 'number' && 
    offers.price > 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: {
      "@type": "Person",
      ...provider
    },
    ...(areaServed && {
      areaServed: {
        "@type": "City",
        name: areaServed
      }
    }),
    ...(offers && {
      offers: {
        "@type": "Offer",
        // Only include price if valid
        ...(hasValidPrice && {
          price: offers.price,
          priceCurrency: offers.priceCurrency || "GEL"
        }),
        availability: hasValidPrice 
          ? `https://schema.org/${offers.availability || "InStock"}`
          : "https://schema.org/PreOrder"
      }
    }),
    ...(aggregateRating && aggregateRating.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount,
        bestRating: 5,
        worstRating: 1
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// NEW: Product Schema for Services
interface ProductSchemaProps {
  name: string;
  description: string;
  image?: string[];
  brand?: string;
  offers: {
    price: string | number;
    priceCurrency?: string;
    availability?: string;
    seller?: {
      name: string;
      telephone?: string;
      address?: any;
    };
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  category?: string;
}

export const ProductSchema = ({
  name,
  description,
  image,
  brand = "ავტოხელოსანი",
  offers,
  aggregateRating,
  category
}: ProductSchemaProps) => {
  // Validate price - must be a valid number for Google
  const hasValidPrice = offers.price && 
    typeof offers.price === 'number' && 
    offers.price > 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    ...(image && image.length > 0 && { image }),
    brand: {
      "@type": "Brand",
      name: brand
    },
    ...(category && { category }),
    offers: {
      "@type": "Offer",
      // Only include price if it's a valid number
      ...(hasValidPrice && {
        price: offers.price,
        priceCurrency: offers.priceCurrency || "GEL"
      }),
      // Set proper availability based on price
      availability: hasValidPrice 
        ? `https://schema.org/${offers.availability || "InStock"}`
        : "https://schema.org/PreOrder",
      ...(offers.seller && {
        seller: {
          "@type": "Person",
          ...offers.seller
        }
      })
    },
    ...(aggregateRating && aggregateRating.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount,
        bestRating: 5,
        worstRating: 1
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// NEW: Review Schema
interface ReviewSchemaProps {
  reviews: Array<{
    author: string;
    rating: number;
    reviewBody: string;
    datePublished: string;
  }>;
}

export const ReviewSchema = ({ reviews }: ReviewSchemaProps) => {
  const schemas = reviews.map(review => ({
    "@context": "https://schema.org",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: review.author
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished
  }));

  return (
    <Helmet>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

// NEW: FAQ Schema
interface FAQSchemaProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export const FAQSchema = ({ faqs }: FAQSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// NEW: Person Schema
interface PersonSchemaProps {
  name: string;
  jobTitle?: string;
  url?: string;
  image?: string;
  telephone?: string;
  address?: {
    addressLocality: string;
    addressRegion?: string;
    addressCountry?: string;
  };
  worksFor?: {
    name: string;
    url: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export const PersonSchema = ({
  name,
  jobTitle = "ავტოხელოსანი",
  url,
  image,
  telephone,
  address,
  worksFor = { name: "ავტოხელოსანი", url: "https://fixup.ge" },
  aggregateRating
}: PersonSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle,
    ...(url && { url }),
    ...(image && { image }),
    ...(telephone && { telephone }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        ...address,
        addressCountry: address.addressCountry || "GE"
      }
    }),
    worksFor: {
      "@type": "Organization",
      ...worksFor
    },
    ...(aggregateRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount,
        bestRating: 5,
        worstRating: 1
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// NEW: CollectionPage Schema
interface CollectionPageSchemaProps {
  name: string;
  description: string;
  numberOfItems: number;
  itemList: Array<{
    name: string;
    url: string;
    image?: string;
    price?: number;
  }>;
}

export const CollectionPageSchema = ({
  name,
  description,
  numberOfItems,
  itemList
}: CollectionPageSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    numberOfItems,
    hasPart: itemList.map((item, index) => ({
      "@type": "Product",
      position: index + 1,
      name: item.name,
      url: item.url,
      ...(item.image && { image: item.image }),
      ...(item.price && {
        offers: {
          "@type": "Offer",
          price: item.price,
          priceCurrency: "GEL"
        }
      })
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
