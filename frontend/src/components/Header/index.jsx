import React from 'react';
import PropTypes from 'prop-types';
import { NavBar } from 'antd-mobile';
import './index.css';

/**
 * 通用头部组件
 * @param {string} title - 主标题
 * @param {string} subtitle - 副标题
 * @param {boolean} showBack - 是否显示返回按钮
 * @param {React.ReactNode[]} rightActions - 右侧操作区
 * @param {React.ReactNode} children - 额外内容
 */
const Header = ({ title, subtitle, showBack = false, rightActions, children, onBack }) => {
  return (
    <header className="yh-header">
      <NavBar
        back={showBack ? true : null}
        right={rightActions}
        onBack={onBack}
        style={{
        //   background: 'var(--header-bg)',
        //   color: 'var(--header-color)',
        //   borderRadius: 'var(--radius-lg)',
        //   fontFamily: 'var(--font-family)',
          width: '100vw',
        }}
      >
        <div className="yh-header-title">
          {title}
          {subtitle && <span className="yh-header-subtitle">{subtitle}</span>}
        </div>
        {children}
      </NavBar>
    </header>
  );
};

Header.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  showBack: PropTypes.bool,
  rightActions: PropTypes.node,
  children: PropTypes.node,
  onBack: PropTypes.func,
};

export default Header;
