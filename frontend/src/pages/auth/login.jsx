import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../store/useUser';
import '../../styles/variables.css';
import './login.css';
import SubLayout from '../../layouts/SubLayout';

const Login = () => {
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const { login, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Keep existing navigate initialization
  const location = useLocation();

  // 键盘无障碍：Enter 提交
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const username = usernameRef.current.value.trim();
    const password = passwordRef.current.value;
    if (!username || !password) {
      setError('请输入用户名和密码');
      setLoading(false);
      return;
    }
    const result = await login({ username, password });
    if (result !== true) {
      setError(result || '登录失败');
      setLoading(false);
      return;
    }
    // 登录成功后的跳转逻辑
    setLoading(false);
    // 来源页优先，支持 history.state、location.state、query（如有）
    let from = null;
    // 1. location.state?.from
    if (location.state && location.state.from) {
      from = location.state.from;
    }
    // 2. history.state?.from (部分浏览器支持)
    else if (window.history && window.history.state && window.history.state.from) {
      from = window.history.state.from;
    }
    // 3. URL query: ?from=/xxx
    else {
      const params = new URLSearchParams(window.location.search);
      if (params.get('from')) {
        from = params.get('from');
      }
    }
    if (from) {
      navigate(from, { replace: true });
    } else {
      navigate('/my', { replace: true });
    }
  };

  return (
    <SubLayout title="登录" subtitle="欢迎加入心青年平台">
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title">登录“心青年”平台</h2>
          <label htmlFor="username" className="login-label">用户名</label>
          <input
            id="username"
            name="username"
            type="text"
            className="login-input"
            ref={usernameRef}
            tabIndex={1}
            autoFocus
            autoComplete="username"
            onKeyDown={handleKeyDown}
            disabled={loading || userLoading}
          />
          <label htmlFor="password" className="login-label">密码</label>
          <input
            id="password"
            name="password"
            type="password"
            className="login-input"
            ref={passwordRef}
            tabIndex={2}
            autoComplete="current-password"
            onKeyDown={handleKeyDown}
            disabled={loading || userLoading}
          />
          {error && <div className="login-error" style={{ color: 'var(--danger-color, #e74c3c)', fontSize: '0.95rem', marginTop: '-0.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>{error}</div>}
          <button
            type="submit"
            className="login-button"
            tabIndex={3}
            disabled={loading || userLoading}
          >
            {loading || userLoading ? '登录中…' : '登录'}
          </button>
          {/* 登录表单下方注册入口（优化移动端适配与可点击性） */}
          <div className="register-entry-container">
            <button
              className="register-entry-btn"
              type="button"
              onClick={() => navigate('/auth/register')}
            >
              没有账户？<span className="register-entry-link">注册新账户</span>
            </button>
          </div>
        </form>
      </div>
    </SubLayout>
  );
};

export default Login;
