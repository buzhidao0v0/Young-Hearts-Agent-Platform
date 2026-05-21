

import React from 'react';
import { getRoleDisplayName } from '../../utils/roleMapping';
import userAvatar from '../../assets/user.png';
import { useUser } from '../../store/useUser';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../../layouts/HomeLayout';
import SectionContainer from '../../components/SectionContainer';
import ListMenu from '../../components/ListMenu';
import LogoutButton from './LogoutButton';
import { ClockCircleOutline, StarOutline, SetOutline } from 'antd-mobile-icons';

const MyPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  // 顶部个人信息卡实现，支持点击跳转个人信息详情页
  const infoCard = (
    <SectionContainer className="my-info-card">
      <div
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => {
          if (user) {
            navigate('/my/personal-info');
          } else {
            navigate('/auth/login');
          }
        }}
      >
        {/* 头像 */}
        <img
          src={user?.avatar || userAvatar}
          alt="头像"
          style={{ width: 64, height: 64, borderRadius: '50%', marginRight: 16, objectFit: 'cover', background: '#f5f5f5' }}
        />
        {/* 昵称、性别与标签 */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>
            {user ? user.nickname : '未登录'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {user?.roles.map((role, idx) => (
              <span
                key={role + idx}
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: 12,
                  background: '#e6f4ff',
                  color: '#1677ff',
                  fontSize: 13,
                  marginBottom: 4,
                  wordBreak: 'keep-all',
                }}
              >
                {getRoleDisplayName(role)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SectionContainer>
  );

  // 功能列表分组配置
  const menuItems = [
    [
      {
        icon: <ClockCircleOutline style={{ fontSize: 22 }} />, title: '历史记录', desc: '浏览与操作历史', onClick: () => {} },
      {
        icon: <StarOutline style={{ fontSize: 22 }} />, title: '收藏知识库条目', desc: '我的收藏', onClick: () => {} },
    ],
    [
      {
        icon: <SetOutline style={{ fontSize: 22 }} />, title: '设置', desc: '账号与偏好设置', onClick: () => {} },
    ],
  ];

  // 中间功能列表
  const functionList = (
    <SectionContainer className="my-function-list">
      <ListMenu items={menuItems} align="left" />
    </SectionContainer>
  );

  // 底部登出按钮
  const logoutBtn = <LogoutButton />;

  return (
    <HomeLayout
      title="个人中心"
      activeKey="my"
      onTabChange={key => {
        if (key === 'home') navigate('/home');
      }}
    >
      <div className="my-page-root">
        {infoCard}
        {functionList}
        {logoutBtn}
      </div>
    </HomeLayout>
  );
};

export default MyPage;
