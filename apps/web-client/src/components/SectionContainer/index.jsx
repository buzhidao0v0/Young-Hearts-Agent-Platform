import React from "react";
import PropTypes from "prop-types";
import "./index.css";

/**
 * SectionContainer 分区容器组件
 * @param {string} title - 分区标题（可选）
 * @param {string} description - 分区描述（可选）
 * @param {React.ReactNode} children - 分区内容
 * @param {string} className - 自定义类名（可选）
 */
const SectionContainer = ({ title, description, children, className = "" }) => {
  return (
    <section className={`section-container${className ? " " + className : ""}`}>
      {(title || description) && (
        <div className="section-header">
          {title && <h2 className="section-title">{title}</h2>}
          {description && <div className="section-description">{description}</div>}
        </div>
      )}
      <div className="section-content">{children}</div>
    </section>
  );
};

SectionContainer.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default SectionContainer;
