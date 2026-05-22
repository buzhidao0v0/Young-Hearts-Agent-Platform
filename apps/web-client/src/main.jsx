
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { unstableSetRender } from 'antd-mobile';
import './index.css';
import App from './App.jsx';

// React 19 兼容 antd-mobile v5
unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
