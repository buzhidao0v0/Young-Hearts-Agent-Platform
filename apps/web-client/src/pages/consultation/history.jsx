import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddOutline, DeleteOutline, CheckOutline } from 'antd-mobile-icons';
import { Dialog, Toast } from 'antd-mobile';
import SubLayout from '../../layouts/SubLayout';
import IconActionButton from '../../components/IconActionButton';
import SessionList from './SessionList';
import { useConsultSession } from '../../store/consultSession.jsx';
import { UserContext } from '../../store/UserContext';
import useNewSession from '../../hooks/useNewSession';

const HistoryPage = () => {
  const { isAuthenticated, loading: userLoading } = useContext(UserContext) || {};
  const { sessions, loading, error, loadSessions, removeSession, removeSessions } = useConsultSession();
  const [localError, setLocalError] = useState(null);
  const navigate = useNavigate();
  const { createSession, goToSession } = useNewSession();

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (userLoading) return;
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    loadSessions();
    // eslint-disable-next-line
  }, [isAuthenticated, userLoading]);

  // 新建会话后仅跳转 session 的 id，无需兼容旧结构
  const handleNewSession = async () => {
    try {
      const session = await createSession();
      if (session && session.id) {
        goToSession(session.id);
      }
    } catch {
      setLocalError('新建会话失败');
    }
  };

  // 会话详情仅通过 id 跳转
  const handleSessionClick = (id) => {
    goToSession(id);
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSingle = async (id) => {
    try {
      await removeSession(id);
      Toast.show({ icon: 'success', content: '删除成功' });
    } catch {
      Toast.show({ icon: 'fail', content: '删除失败' });
    }
  };

  const handleDeleteBatch = async () => {
    if (selectedIds.length === 0) return;
    const result = await Dialog.confirm({
      content: `确定要删除选中的 ${selectedIds.length} 个会话吗？`,
    });
    if (result) {
      try {
        await removeSessions(selectedIds);
        Toast.show({ icon: 'success', content: '删除成功' });
        setIsBatchMode(false);
        setSelectedIds([]);
      } catch {
        Toast.show({ icon: 'fail', content: '删除失败' });
      }
    }
  };

  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    setSelectedIds([]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === sessions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sessions.map(s => s.id));
    }
  };

  const rightActions = isBatchMode ? (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
      <span onClick={handleSelectAll} style={{ fontSize: '15px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
        {selectedIds.length === sessions.length ? '取消全选' : '全选'}
      </span>
      <span onClick={toggleBatchMode} style={{ fontSize: '15px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
        取消
      </span>
    </div>
  ) : (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
      <span onClick={toggleBatchMode} style={{ fontSize: '15px', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
        管理
      </span>
      <IconActionButton icon={<AddOutline />} onClick={handleNewSession} title="新对话" />
    </div>
  );

  return (
    <SubLayout
      title="历史会话"
      subtitle={null}
      rightActions={rightActions}
      onBack={isBatchMode ? toggleBatchMode : undefined}
      showBack={true}
    >
      <div style={{ 
        paddingBottom: isBatchMode ? '60px' : '0',
        minHeight: 'calc(100vh - 56px)',
        backgroundColor: '#f5f7fa',
        boxSizing: 'border-box'
      }}>
        <SessionList
          sessions={sessions}
          loading={loading}
          error={error || localError}
          onSessionClick={handleSessionClick}
          isBatchMode={isBatchMode}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onDelete={handleDeleteSingle}
        />
      </div>
      {isBatchMode && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#fff',
          borderTop: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
          zIndex: 100
        }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            已选 {selectedIds.length} 项
          </span>
          <button
            onClick={handleDeleteBatch}
            disabled={selectedIds.length === 0}
            style={{
              backgroundColor: selectedIds.length > 0 ? '#ff4d4f' : '#ffccc7',
              color: '#fff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '14px',
              cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <DeleteOutline /> 删除
          </button>
        </div>
      )}
    </SubLayout>
  );
}

export default HistoryPage;
