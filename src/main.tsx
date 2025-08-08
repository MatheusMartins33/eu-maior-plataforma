import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import '@/styles/utilities.css'
import '@/styles/cosmic-scrollbar.css'
import '@/styles/enhanced-cosmic.css'

createRoot(document.getElementById("root")!).render(<App />);
