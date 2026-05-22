import React from "react";
import { useUser } from '../../store/useUser';
import PropTypes from "prop-types";
import "./index.css";


/**
 * 通用 Card 组件
 * @param {object} props
 * @param {string|string[]} [props.requiredRole] 需要的权限角色
 */
const Card = ({
  type = "main",
  title,
  subtitle,
  icon,
  buttonText,
  onClick,
  disabled = false,
  hidden = false,
  requiredRole,
  children,
  ...rest
}) => {
  const { checkPermission } = useUser?.() || {};
  if (hidden) return null;
  if (requiredRole && typeof checkPermission === 'function' && !checkPermission(requiredRole)) {
    return null;
  }

  const cardClass = [
    "yh-card",
    `yh-card--${type}`,
    disabled ? "yh-card--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClass}
      tabIndex={disabled ? -1 : 0}
      role="region"
      aria-disabled={disabled}
      aria-label={title ? String(title) : undefined}
      onClick={disabled ? undefined : onClick}
      {...rest}
    >
      {icon && <div className="yh-card__icon" aria-hidden="true">{icon}</div>}
      <div className="yh-card__content">
        {title && <div className="yh-card__title">{title}</div>}
        {subtitle && <div className="yh-card__subtitle">{subtitle}</div>}
        {children}
      </div>
      {buttonText && (
        <button
          className="yh-card__button"
          onClick={onClick}
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          aria-label={buttonText}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

Card.propTypes = {
  type: PropTypes.oneOf(["main", "sub", "category", "expert"]),
  title: PropTypes.node,
  subtitle: PropTypes.node,
  icon: PropTypes.node,
  buttonText: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  hidden: PropTypes.bool,
  requiredRole: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  children: PropTypes.node,
};

export default Card;
