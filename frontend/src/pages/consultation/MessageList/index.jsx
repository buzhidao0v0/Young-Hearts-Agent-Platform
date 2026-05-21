import React, { useEffect, useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReferenceCard from '../ReferenceCard';
import QuickActions from '../QuickActions';
import './index.css';

// 消息气泡组件
function MessageBubble({ message, onQuickAction }) {
  const isUser = message.role === 'user';
  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'ai'}`}>
      <div className={`message-bubble ${isUser ? 'user' : 'ai'}`}>
        <div className="bubble-content markdown-body">
          {isUser ? (
            message.content
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <div className="bubble-meta">{message.time}</div>
      </div>
      
      {/* AI 消息含 sources 字段时渲染引用卡 */}
      {!isUser && Array.isArray(message.sources) && message.sources.length > 0 && (
        <ReferenceCard sources={message.sources} />
      )}
      
      {/* AI 消息含 quickActions 字段时渲染快捷操作条 */}
      {!isUser && Array.isArray(message.quickActions) && message.quickActions.length > 0 && (
        <QuickActions actions={message.quickActions.map(action => ({
          ...action,
          onClick: () => {
            if (typeof action.onClick === 'function') {
              action.onClick();
            } else if (action.value && onQuickAction) {
              onQuickAction(action.value);
            }
          }
        }))} />
      )}
    </div>
  );
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.string,
    content: PropTypes.string,
    time: PropTypes.string,
    sources: PropTypes.array,
    quickActions: PropTypes.array,
  }).isRequired,
  onQuickAction: PropTypes.func,
};

// 消息流组件
export default function MessageList({ messages, onQuickAction }) {
  const listRef = useRef(null);
  // 使用 useLayoutEffect 保证流式渲染时滚动条及时跟随
  useLayoutEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);
  // 兼容性检查：确保 messages 为数组
  const safeMessages = Array.isArray(messages) ? messages : [];
  return (
    <div className="message-list" ref={listRef}>
      {safeMessages.length > 0 ? (
        safeMessages.map((msg, idx) => (
          <MessageBubble key={msg.id || idx} message={msg} onQuickAction={onQuickAction} />
        ))
      ) : (
        <div className="message-empty">暂无消息</div>
      )}
    </div>
  );
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      role: PropTypes.string,
      content: PropTypes.string,
      time: PropTypes.string,
      sources: PropTypes.array,
      quickActions: PropTypes.array,
    })
  ).isRequired,
  onQuickAction: PropTypes.func,
};
