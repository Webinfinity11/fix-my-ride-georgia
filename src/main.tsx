import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Load debug utilities
import { debugSlugs } from './utils/debugSlugUtils';

// Auto-run slug debugging on app start
setTimeout(() => {
  console.log('🚀 Starting automatic slug duplicate check...');
  debugSlugs.checkDuplicates().then((duplicates) => {
    if (duplicates.length > 0) {
      console.log('🔧 Found duplicates, running auto-fix...');
      debugSlugs.fixDuplicates();
    } else {
      console.log('✅ No duplicate slugs found in database');
    }
  });
}, 2000);

createRoot(document.getElementById("root")!).render(<App />);
