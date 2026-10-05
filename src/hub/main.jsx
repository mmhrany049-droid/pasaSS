import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/700.css';
import '@fontsource/vazirmatn/900.css';
import '../index.css';
import HubApp from './HubApp.jsx';

createRoot(document.getElementById('root')).render(<React.StrictMode><HubApp /></React.StrictMode>);
