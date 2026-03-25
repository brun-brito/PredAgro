import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import App from './App';
import { AuthProvider } from './hooks/AuthProvider';
import { ToastProvider } from './hooks/ToastProvider';
import { configureLeafletIcons } from './utils/leafletConfig';
import './styles/tokens.css';
import './styles/global.css';

configureLeafletIcons();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
