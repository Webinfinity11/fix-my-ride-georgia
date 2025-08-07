import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Load debug utilities
import './utils/debugSlugUtils';

createRoot(document.getElementById("root")!).render(<App />);
