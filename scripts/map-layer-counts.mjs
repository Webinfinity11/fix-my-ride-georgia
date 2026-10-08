import { readFileSync } from 'node:fs';
import path from 'node:path';

export function countMapPoints(geojson) {
  return geojson.features.filter(feature =>
    feature.geometry?.type === 'Point' && feature.geometry?.coordinates
  ).length;
}

// Counts are compiled from the same public datasets as the client hooks.
export function mapLayerCountsPlugin(root) {
  const moduleId = 'virtual:map-layer-counts';
  return {
    name: 'map-layer-counts',
    resolveId(id) { if (id === moduleId) return '\0' + moduleId; },
    load(id) {
      if (id !== '\0' + moduleId) return;
      const counts = {};
      for (const [key, filename] of [['stations', 'fuel-stations.geojson'], ['chargers', 'chargers.geojson']]) {
        const file = path.join(root, 'public/data', filename);
        this.addWatchFile(file);
        counts[key] = countMapPoints(JSON.parse(readFileSync(file, 'utf8')));
      }
      return `export default ${JSON.stringify(counts)};`;
    },
  };
}
