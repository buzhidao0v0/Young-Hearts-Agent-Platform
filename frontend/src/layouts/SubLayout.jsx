import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import '../styles/variables.css';

/**
 * 次级页面布局组件
 * 顶部为 Header（带返回），无底部导航，主内容区为 children
 */

const SubLayout = ({
  title,
  subtitle,
  rightActions,
  children,
  onBack,
  headerStyle,
  showBack = true,
  headerClassName
}) => {
  const navigate = useNavigate();
  // 若未传递 onBack，则默认返回上一页
  const handleBack = onBack || (() => navigate(-1));
  return (
    <div className="yh-sub-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        rightActions={rightActions}
        onBack={handleBack}
        style={headerStyle}
        className={headerClassName}
      />
      <main style={{ flex: 1, width: '100%',  paddingTop: 56 }}>{children}</main>
    </div>
  );
};

SubLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  rightActions: PropTypes.node,
  children: PropTypes.node,
  onBack: PropTypes.func,
  headerStyle: PropTypes.object,
  showBack: PropTypes.bool,
  headerClassName: PropTypes.string,
};

export default SubLayout;
