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
}

export const LocalBusinessSchema = ({
  name,
  address,
  telephone,
  url,
  priceRange = "$$",
  rating
}: LocalBusinessSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
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
        price: offers.price || "Price on request",
        priceCurrency: offers.priceCurrency || "GEL",
        availability: offers.availability || "InStock"
      }
    }),
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