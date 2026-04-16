import React from 'react';
import ReactDOM from 'react-dom/client';

import PublicApp from './pages/PublicApp';
import './styles/reset.css';
import './styles/theme.css';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PublicApp />
  </React.StrictMode>,
);
