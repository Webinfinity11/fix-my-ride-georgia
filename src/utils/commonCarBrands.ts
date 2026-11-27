import { BRAND_PAGES } from "@/utils/carBrands";

/** Brands offered as quick filters, in display order; only those with a brand page. */
export const commonCarBrands = [
  "BMW", "Mercedes-Benz", "Audi", "Toyota", "Honda", "Nissan",
  "Hyundai", "Kia", "Volkswagen", "Ford", "Chevrolet", "Mazda",
  "Subaru", "Lexus", "Infiniti", "Acura", "Jeep", "Land Rover",
  "Porsche", "Mitsubishi", "Opel", "Peugeot", "Renault", "Citroen",
  "Fiat", "Volvo", "Saab", "Skoda", "Seat", "Alfa Romeo", "Tesla", "სხვა",
].filter(name => BRAND_PAGES.some(brand => brand.name === name));
