import React, { useState } from 'react';
import './LogoutButton.css';
import { useUser } from '../../store/useUser';
import { useNavigate } from 'react-router-dom';

import Toast from '../../components/Toast';

const LogoutButton = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const [toast, setToast] = useState({ visible: false, message: '' });

  if (!user) return null;

  const handleLogout = async () => {
    const confirmed = window.confirm('确定要退出登录吗？');
    if (!confirmed) return;
    try {
      await logout();
      navigate('/auth/login');
    } catch (err) {
      setToast({ visible: true, message: err?.message || '登出失败，请重试' });
    }
  };

  return (
    <>
      <div className="logout-btn-placeholder">
        <button className="logout-btn logout-btn--active" onClick={handleLogout}>退出登录</button>
      </div>
      <Toast
        visible={toast.visible}
        message={toast.message}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </>
  );
};

export default LogoutButton;
