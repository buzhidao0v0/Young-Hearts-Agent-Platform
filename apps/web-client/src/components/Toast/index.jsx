import React, { useEffect } from 'react';
import './index.css';

const Toast = ({ message, visible, duration = 2000, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;
  return (
    <div className="toast-container">
      {message}
    </div>
  );
};

export default Toast;
