/// <reference types="vite/client" />

declare module "virtual:map-layer-counts" {
  const counts: { stations: number; chargers: number };
  export default counts;
}
