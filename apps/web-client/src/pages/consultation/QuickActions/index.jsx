import React from 'react';
import './index.css';

/**
 * 快捷操作条组件
 * @param {Object} props
 * @param {Array} props.actions - 快捷操作项数组，每项包含 label、onClick、icon（可选）
 */
const QuickActions = ({ actions = [] }) => {
  if (!actions.length) return null;
  return (
    <div className="quick-actions-bar">
      <div className="quick-actions-scroll">
        {actions.map((action, idx) => (
          <button
            key={idx}
            className="quick-action-btn"
            onClick={action.onClick}
            title={action.label}
          >
            {action.icon && <span className="quick-action-icon">{action.icon}</span>}
            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
