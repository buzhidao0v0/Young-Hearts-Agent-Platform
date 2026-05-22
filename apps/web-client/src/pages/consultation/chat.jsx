import React, { useState, useEffect } from 'react';
import Toast from '../../components/Toast';
import MessageList from './MessageList';
import InputBar from './InputBar';
import { useNavigate, useParams } from 'react-router-dom';
import SubLayout from '../../layouts/SubLayout';
import IconActionButton from '../../components/IconActionButton';
import { UserOutline } from 'antd-mobile-icons';
import { getSessionMessages, chatSSE, getSessions } from '../../api/consult';
import { useConsultSession } from '../../store/consultSession';


// Chat 页面主组件
// session_id 通过 useParams() 获取，id 即为 session_id
const ConsultationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // id 即 session_id

  // 弹窗状态
  const [toast, setToast] = useState({ visible: false, message: '' });
  // 消息流状态
  const [messages, setMessages] = useState([]);

  // 副标题状态
  const [subtitle, setSubtitle] = useState('新对话');
  // 是否副标题加载失败
  const [subtitleError, setSubtitleError] = useState(false);

  const { setSessionTitle } = useConsultSession();

  // 头部右侧操作区（仅保留转人工）
  const rightActions = (
    <IconActionButton
      icon={<UserOutline />}
      ariaLabel="转人工"
      onClick={() => navigate('/my/tickets/create')}
    />
  );

  // 拉取历史消息
  useEffect(() => {
    if (!id) return;
    getSessionMessages(id)
      .then(res => {
        let list = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (res && Array.isArray(res.messages)) {
          list = res.messages;
        }

        // 若返回数组长度>1，尝试按时间字段判断并确保为时间正序（早->晚）
        // 期望：list[0] 是最早的消息
        if (list.length > 1) {
          const firstItem = list[0];
          const lastItem = list[list.length - 1];
          const firstTime = firstItem.created_at || firstItem.timestamp || firstItem.time;
          const lastTime = lastItem.created_at || lastItem.timestamp || lastItem.time;
          
          try {
            if (firstTime && lastTime && (new Date(firstTime) > new Date(lastTime))) {
              // 此时第一条时间晚于最后一条，说明是倒序（最新在前），翻转为正序
              list = list.slice().reverse(); 
            }
          } catch (e) {
            console.warn('无法解析历史消息时间戳以确定顺序', { firstTime, lastTime });
          }
        }

        // 尝试解析 sources 字段
        list = list.map(msg => {
          if (typeof msg.sources === 'string') {
            try {
              msg.sources = JSON.parse(msg.sources);
            } catch (e) {
              console.warn('解析历史消息 sources 失败', msg.sources);
            }
          }
          return msg;
        });

        setMessages(list);
      })
      .catch(err => {
        // 可选：错误处理
        console.error('加载历史消息失败', err);
      });
  }, [id]);

  // 拉取会话 topic 作为副标题
  useEffect(() => {
    let ignore = false;
    if (!id) {
      setSubtitle('新对话');
      setSubtitleError(false);
      return;
    }
    setSubtitle('新对话');
    setSubtitleError(false);
    getSessions()
      .then(res => {
        if (ignore) return;
        
        let sessionList = [];
        
        // 兼容两种返回格式：
        // 1. 直接返回数组 (当前后端行为): [...]
        // 2. 包装在 sessions 字段中 (原预期): { sessions: [...] }
        if (Array.isArray(res)) {
          sessionList = res;
        } else if (res && Array.isArray(res.sessions)) {
          sessionList = res.sessions;
        } else {
          console.error('getSessions: 非预期响应格式', res);
          // 若无法解析列表，则不更新副标题（保持“新对话”或上一次状态）
          setSubtitleError(true);
          return;
        }
        
        // 在 sessionList 中查找
        const session = sessionList.find(s => String(s.id) === String(id));
        
        if (session) {
            // 优先使用 title，没有则用 topic，再没有显示默认
            const displayTitle = session.title || session.topic || '历史对话';
            setSubtitle(displayTitle);
            setSubtitleError(false);
        }
      })
      .catch((err) => {
        if (ignore) return;
        console.error('getSessions 拉取副标题失败', err);
        setSubtitle('加载失败');
        setSubtitleError(true);
      });
    return () => { ignore = true; };
  }, [id]);


  // AI 回复流式追加
  const [loading, setLoading] = useState(false);
  // requestAnimationFrame 节流流式渲染
  const rafRef = React.useRef();
  const aiMsgRef = React.useRef(null);
  const [pendingDelta, setPendingDelta] = useState("");

  const flushAIMsg = React.useCallback(() => {
    setMessages(prev => {
      const copy = [...prev];
      if (aiMsgRef.current && copy.length > 0) {
        copy[copy.length - 1] = { ...aiMsgRef.current };
      }
      return copy;
    });
    rafRef.current = null;
  }, []);

  useEffect(() => {
    if (pendingDelta) {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          flushAIMsg();
          setPendingDelta("");
        });
      }
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [pendingDelta, flushAIMsg]);

  // ...existing code...
  // 发送消息时调用 chatSSE，需确保参数中包含 session_id
  // session_id 由 useParams() 获取的 id 传递
  const handleSend = async (content) => {
    if (!content) return;
    setLoading(true);
    const now = new Date();
    const userMsg = { role: 'user', content, time: now.toLocaleTimeString().slice(0,5) };
    setMessages(prev => [...prev, userMsg]);
    let aiMsg = { role: 'ai', content: '', time: now.toLocaleTimeString().slice(0,5) };
    aiMsgRef.current = aiMsg;
    setMessages(prev => [...prev, aiMsg]);
    try {
      /**
       * @type {import('../../types/ChatRequest').ChatRequest}
       */
      const chatParams = {
        session_id: id, // session_id 必须传递，来源于 useParams()
        query: content,
        role: 'counselor',
        reasoning_effort: null
      };
      // 调试用，确保请求体字段齐全
      console.log('chatSSE params:', chatParams);
      await chatSSE(
        chatParams,
        {
          onMessage: (delta, meta) => {
            if (meta && meta.isTopic) {
              const newTitle = delta && delta.trim() ? delta : '新对话';
              setSessionTitle(id, newTitle);
              setSubtitle(newTitle);
            } else if (meta && meta.isSources) {
              aiMsgRef.current = { ...aiMsgRef.current, sources: delta };
              flushAIMsg();
            } else if (meta && meta.isError) {
              setToast({ visible: true, message: delta });
            } else {
              aiMsgRef.current = { ...aiMsgRef.current, content: (aiMsgRef.current?.content || "") + (delta || "") };
              setPendingDelta(delta || " ");
            }
          },
          onError: (err) => {
            setLoading(false);
            setToast({ visible: true, message: err?.message || 'AI回复失败，请重试' });
          },
          onComplete: () => {
            setLoading(false);
            flushAIMsg();
          },
        }
      );
    } catch (e) {
      setLoading(false);
      setToast({ visible: true, message: e?.message || 'AI回复失败，请重试' });
    }
  };
// session_id 获取与传递链路说明：
// 1. 通过 useParams() 获取 id，作为 session_id
// 2. 发送消息等操作时，chatSSE 参数中必须包含 session_id
// 3. 若 session_id 缺失，后续 Phase 会做兜底处理

  return (
    <>
      <SubLayout
        title="智能体咨询"
        subtitle={
          subtitleError ? (
            <span style={{ color: 'red' }}>{subtitle}</span>
          ) : subtitle
        }
        showBack={true}
        onBack={() => navigate(-1)}
        rightActions={rightActions}
        headerStyle={{ position: 'fixed', top: 0, width: '100%', zIndex: 10 }}
        children={
          <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', background: '#f7f8fa' }}>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* 消息流渲染 */}
              <MessageList 
                messages={messages} 
                onQuickAction={(value) => {
                  // 默认填充到输入框或触发发送
                  handleSend(value);
                }} 
              />
            </div>
            <InputBar onSend={handleSend} disabled={loading} />
          </div>
        }
      />
      <Toast
        visible={toast.visible}
        message={toast.message}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </>
  );
};

export default ConsultationPage;
