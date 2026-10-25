import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/fonts';
import './design/tokens.css';
import './design/global.css';
import { App } from './app/App';


const root = document.getElementById('root');
if (!root) throw new Error('#root fehlt in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
