import React from 'react';
import { SwipeAction, Checkbox } from 'antd-mobile';
import { MessageOutline, RightOutline } from 'antd-mobile-icons';
import './index.css';

/**
 * 会话列表组件
 * @param {Object} props
 * @param {Array} props.sessions 会话数组
 * @param {boolean} props.loading 加载中
 * @param {any} props.error 错误信息
 * @param {Function} props.onSessionClick 点击会话回调
 * @param {boolean} props.isBatchMode 是否处于批量编辑模式
 * @param {Array} props.selectedIds 选中的会话ID数组
 * @param {Function} props.onSelect 选中/取消选中回调
 * @param {Function} props.onDelete 单个删除回调
 */
function SessionList({ 
  sessions, 
  loading, 
  error, 
  onSessionClick,
  isBatchMode = false,
  selectedIds = [],
  onSelect,
  onDelete
}) {
  if (loading) {
    return <div className="session-list__loading">加载中...</div>;
  }
  if (error) {
    const msg = typeof error === 'string' ? error : '加载失败';
    return <div className="session-list__error">{msg}</div>;
  }
  if (!sessions || sessions.length === 0) {
    return <div className="session-list__empty">暂无历史会话，快去创建吧！</div>;
  }
  // 仅使用后端标准字段并限制最多展示 20 条
  const list = sessions.slice(0, 20);

  const renderItemContent = (s) => (
    <div
      className="session-list__item-content"
      onClick={() => {
        if (isBatchMode) {
          onSelect && onSelect(s.id);
        } else {
          onSessionClick && onSessionClick(s.id);
        }
      }}
      onContextMenu={(e) => {
        if (!isBatchMode) {
          e.preventDefault();
          if (window.confirm('确定要删除该会话吗？')) {
            onDelete && onDelete(s.id);
          }
        }
      }}
    >
      {isBatchMode && (
        <div className="session-list__checkbox">
          <Checkbox 
            checked={selectedIds.includes(s.id)} 
            onChange={() => onSelect && onSelect(s.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="session-list__info">
        <div className="session-list__header">
          <div className="session-list__title-wrapper">
            <MessageOutline className="session-list__icon" />
            <div className="session-list__title">{s.topic || '新对话'}</div>
          </div>
          <span className="session-list__date">
            {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}
          </span>
        </div>
        {s.lastMessage && (
          <div className="session-list__meta">
            <span className="session-list__last-message">{s.lastMessage}</span>
            {!isBatchMode && <RightOutline className="session-list__arrow" />}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ul className="session-list">
      {list.map((s) => (
        <li className="session-list__item" key={s.id}>
          {isBatchMode ? (
            renderItemContent(s)
          ) : (
            <SwipeAction
              rightActions={[
                {
                  key: 'delete',
                  text: '删除',
                  color: 'danger',
                  onClick: () => onDelete && onDelete(s.id),
                },
              ]}
            >
              {renderItemContent(s)}
            </SwipeAction>
          )}
        </li>
      ))}
    </ul>
  );
}

export default React.memo(SessionList);
