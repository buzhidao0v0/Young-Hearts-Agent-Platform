
import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import '../styles/variables.css';

/**
 * 一级页面布局组件
 * 顶部为 Header，底部为 BottomNav，主内容区为 children
 */

const HomeLayout = ({ title, subtitle, rightActions, children, activeKey, onTabChange }) => {
  return (
    <div className="yh-home-layout-fixed">
      <Header title={title} subtitle={subtitle} rightActions={rightActions} />
      <main className="yh-home-main-scrollable">{children}</main>
      <BottomNav activeKey={activeKey} onTabChange={onTabChange} />
    </div>
  );
};

HomeLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  rightActions: PropTypes.node,
  children: PropTypes.node,
  activeKey: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
};

export default HomeLayout;
