import React from 'react';
import PropTypes from 'prop-types';
import { TabBar } from 'antd-mobile';
import { AppOutline, UserOutline } from 'antd-mobile-icons';
import './index.css';

/**
 * 通用底部导航栏组件
 * @param {string} activeKey - 当前激活 tab 的 key
 * @param {function} onTabChange - tab 切换回调
 * @param {boolean} safeArea - 是否适配安全区
 */
const tabs = [
  {
    key: 'home',
    title: '首页',
    icon: <AppOutline />,
    route: '/home',
  },
  {
    key: 'my',
    title: '我的',
    icon: <UserOutline />,
    route: '/my',
  },
];

const BottomNav = ({ activeKey, onTabChange, safeArea = true }) => {
  return (
    <nav className="yh-bottomnav">
      <TabBar
        activeKey={activeKey}
        onChange={onTabChange}
        safeArea={safeArea}
        style={{
          background: 'var(--yh-bottomnav-bg)',
          borderRadius: 'var(--yh-radius)',
          fontFamily: 'var(--yh-font-family)',
        }}
      >
        {tabs.map(tab => (
          <TabBar.Item
            key={tab.key}
            icon={tab.icon}
            title={tab.title}
          />
        ))}
      </TabBar>
    </nav>
  );
};

BottomNav.propTypes = {
  activeKey: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  safeArea: PropTypes.bool,
};

export default BottomNav;
