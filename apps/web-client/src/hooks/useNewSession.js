import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../store/UserContext';
import { useConsultSession } from '../store/consultSession';

export default function useNewSession() {
  const { user } = useContext(UserContext) || {};
  const navigate = useNavigate();
  const { newSession } = useConsultSession();

  // 复用 Context 的 newSession 方法
  const createSession = async (...args) => {
    if (!user) {
      navigate('/auth/login');
      throw new Error('未登录');
    }
    const session = await newSession(...args);
    console.log('✅ 新建会话：', session);
    return session;
  };

  const goToSession = (sessionId) => {
    if (!sessionId) return;
    navigate(`/consultation/chat/${sessionId}`);
    console.log('➡️ 跳转至会话：', sessionId);
  };

  return { createSession, goToSession };
}
