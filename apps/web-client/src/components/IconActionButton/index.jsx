import React from 'react';
import './index.css';

const IconActionButton = ({ icon, ariaLabel, onClick }) => (
  <button
    className="icon-action-btn"
    aria-label={ariaLabel}
    onClick={onClick}
    type="button"
  >
    {React.isValidElement(icon)
      ? React.cloneElement(icon, { 'aria-hidden': true, focusable: false })
      : icon}
  </button>
);

export default IconActionButton;
