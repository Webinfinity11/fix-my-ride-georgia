

# Google Search Console Product Snippets - Fix Plan

## Problem
Google Search Console reports 475 invalid Product snippets with 2 critical issues:
1. **"Either 'offers', 'review', or 'aggregateRating' should be specified"** (292 items) — `CollectionPageSchema` outputs `Product` type items in `hasPart` without required fields
2. **"Either 'price' or 'priceSpecification.price' should be specified"** (183 items) — services without `price_from` still emit `offers` block without a price

Plus warnings: missing `aggregateRating`, `review`, `priceCurrency`, `availability`, `priceValidUntil`.

## Root Causes

1. **`CollectionPageSchema`** (`StructuredData.tsx`) — `hasPart` items use `@type: "Product"` but only include `name`, `url`, optional `image` and `price`. Products without price have no `offers` at all, violating Google's requirement.

2. **`ProductSchema`** (`StructuredData.tsx`) — when `price_from` is `undefined`, it still outputs an `offers` block without `price`, and missing `priceCurrency`/`availability` for the no-price case.

3. **`ServiceDetail.tsx`** passes `price: service.price_from || undefined` — so ~292 services with null price get schemas without required fields.

## Solution

### File: `src/components/seo/StructuredData.tsx`

**1. Fix `CollectionPageSchema`**: Change `hasPart` items from `Product` to `ListItem` type (part of `ItemList`), or switch the whole schema to `ItemList` which doesn't require offers/rating. This eliminates the 292-item error entirely.

```
@type: "ItemList" with itemListElement of @type: "ListItem"
```

**2. Fix `ProductSchema`**: 
- Always include `priceCurrency: "GEL"` when price exists
- Add `priceValidUntil` (set to end of current year + 1)
- When no valid price: don't output `ProductSchema` at all (return null)

**3. Fix `ServiceSchema`**:
- Same price validation — only include offers block when price is valid

### File: `src/pages/ServiceDetail.tsx`

**4. Conditionally render `ProductSchema`**: Only render when service has valid `price_from > 0` OR valid `aggregateRating`. This satisfies Google's "either offers, review, or aggregateRating" requirement.

### File: `src/pages/ServiceCategory.tsx`

**5. No changes needed** — once `CollectionPageSchema` switches to `ItemList`, category pages are fixed.

## Expected Result
- 292 "missing offers/review/aggregateRating" errors → eliminated (ItemList doesn't require them)
- 183 "missing price in offers" errors → eliminated (no offers without valid price)
- Warnings for priceCurrency, availability, priceValidUntil → fixed with proper fields

