
import React, { useState } from 'react';
import { useUser } from '../../store/useUser';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../../layouts/HomeLayout';
import appIcon from '../../assets/app_icon.png';
import Card from '../../components/Card';
import SectionContainer from '../../components/SectionContainer';
import { MessageOutline, BillOutline, TeamOutline } from 'antd-mobile-icons';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useUser();

  // 键盘可达处理
  const handleKeyDown = (e, path) => {
    if (e.key === 'Enter' || e.key === ' ') {
      navigate(path);
    }
  };

  // Phase 5: 示例状态（实际可用 props/context/请求结果等替换）
  // 这里只做结构与注释预留
  const [loading] = useState(false); // 示例：实际可用请求状态
  const [error] = useState(false);
  const [empty] = useState(false);

  // 统一服务中心分区角色控制：仅已登录且身份只包括 family 的用户不可见
  const isOnlyFamily = user && Array.isArray(user.roles) && user.roles.length === 1 && user.roles[0] === 'family';
  // 卡片角色配置
  const serviceCenterCards = [
    {
      block: '知识管理',
      cards: [
        {
          icon: <BillOutline />,
          title: '知识贡献',
          subtitle: '分享你的专业经验，助力知识库建设',
          allowedRoles: ['volunteer', 'expert', 'admin', 'maintainer'],
          onClick: () => navigate('/workspace/contribute'),
        },
        {
          icon: <MessageOutline />,
          title: '知识审核列表',
          subtitle: '待审核条目，快速处理',
          allowedRoles: ['expert', 'admin', 'maintainer'],
          onClick: () => navigate('/workspace/review'),
        },
      ],
    },
    {
      block: '任务与工单',
      cards: [
        {
          icon: <TeamOutline />,
          title: '任务大厅',
          subtitle: '浏览与认领任务',
          allowedRoles: ['volunteer', 'expert', 'admin', 'maintainer'],
          onClick: () => navigate('/tasks'),
        },
        {
          icon: <BillOutline />,
          title: '工单处理',
          subtitle: '快速处理工单，优先级标记',
          allowedRoles: ['admin', 'maintainer'],
          onClick: () => navigate('/workspace/tickets'),
        },
      ],
    },
    {
      block: '排班与活动管理',
      cards: [
        {
          icon: <MessageOutline />,
          title: '排班管理',
          subtitle: '查看与报名班次，活动日历',
          allowedRoles: ['volunteer', 'expert', 'admin', 'maintainer'],
          onClick: () => navigate('/schedule'),
        },
      ],
    },
    {
      block: '服务记录',
      cards: [
        {
          icon: <BillOutline />,
          title: '服务记录',
          subtitle: '统计与历史工单，服务时长',
          allowedRoles: ['volunteer', 'expert', 'admin', 'maintainer'],
          onClick: () => navigate('/logs'),
        },
      ],
    },
    {
      block: '系统管理',
      cards: [
        {
          icon: <TeamOutline />,
          title: '人员管理',
          subtitle: '管理平台用户与权限',
          allowedRoles: ['admin', 'maintainer'],
          onClick: () => navigate('/admin/users'),
        },
        {
          icon: <BillOutline />,
          title: '运维监控',
          subtitle: '查看系统日志与告警',
          allowedRoles: ['maintainer'],
          onClick: () => navigate('/admin/monitor'),
        },
      ],
    },
  ];


  return (
    <HomeLayout
      title="首页"
      activeKey="home"
      onTabChange={key => {
        if (key === 'home') navigate('/home');
        if (key === 'my') navigate('/my');
      }}
    >
      <div className="home-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        {/* Phase 5: 占位区结构预留，实际可根据业务条件渲染 */}
        {/* 加载态占位区 */}
        {loading && (
          <div className="loading-placeholder" aria-busy="true" aria-live="polite">
            {/* 可替换为实际 Spinner 组件 */}
            <span className="spinner" aria-hidden="true" /> 加载中...
          </div>
        )}
        {/* 错误态占位区 */}
        {error && (
          <div className="error-placeholder" role="alert">
            出错了，请重试
          </div>
        )}
        {/* 空态占位区 */}
        {empty && (
          <div className="empty-state-placeholder" aria-live="polite">
            暂无内容
          </div>
        )}

        {/* 上半部分：logo区+主副标题，仅在内容区居中展示 */}
        <div className="home-logo-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 48, marginBottom: 32 }}>
          <img src={appIcon} alt="logo" className="home-logo-img" style={{ width: 72, height: 72, marginBottom: 16, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }} />
          <div className="home-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--color-primary)' }}>心青年智能体平台</div>
          <div className="home-subtitle" style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>陪伴·成长·互助</div>
        </div>
        {/* 下半部分：主副入口卡片区（SectionContainer 包裹 Card 组件组合） */}
        <SectionContainer title="暖心服务站" className="home-card-section" >
          <div style={{ width: '100%', maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card
              type="main"
              icon={<MessageOutline />}
              title="智能体咨询"
              subtitle="与AI智能体对话，获得陪伴与建议"
              aria-label="智能体咨询"
              tabIndex={0}
              onClick={() => { navigate('/consultation/history'); }}
              onKeyDown={e => handleKeyDown(e, '/consultation/history')}
            />
            <div className="sub-entry-cards" style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Card
                  type="sub"
                  icon={<BillOutline />}
                  title="查资料"
                  subtitle="专业知识库"
                  aria-label="查资料"
                  tabIndex={0}
                  onClick={() => navigate('/knowledge')}
                  onKeyDown={e => handleKeyDown(e, '/knowledge')}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Card
                  type="sub"
                  icon={<TeamOutline />}
                  title="找帮手"
                  subtitle="互助社区"
                  aria-label="找帮手"
                  tabIndex={0}
                  onClick={() => navigate('/community')}
                  onKeyDown={e => handleKeyDown(e, '/community')}
                />
              </div>
            </div>
          </div>
        </SectionContainer>
        {/* 统一服务中心分区：仅已登录且身份不为仅 family 可见 */}
        {user && !isOnlyFamily && (
          <SectionContainer title="统一服务中心" className="service-center-section">
            {serviceCenterCards.map(block => {
              // 过滤出当前 block 可见的卡片
              const visibleCards = block.cards.filter(card => {
                if (!card.allowedRoles || !user?.roles) return false;
                return card.allowedRoles.some(role => user.roles.includes(role));
              });
              // 若无可见卡片，则不渲染该 block
              if (visibleCards.length === 0) return null;
              return (
                <div className="service-block" style={{ marginBottom: 24 }} key={block.block}>
                  <div className="service-block-title" style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>{block.block}</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {visibleCards.map(card => (
                      <Card
                        key={card.title}
                        type="sub"
                        icon={card.icon}
                        title={card.title}
                        subtitle={card.subtitle}
                        aria-label={card.title}
                        tabIndex={0}
                        onClick={card.onClick}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </SectionContainer>
        )}
      </div>
    </HomeLayout>
  )
    
}
