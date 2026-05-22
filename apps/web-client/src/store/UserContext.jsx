
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '../api/auth';
import userAvatar from '../assets/user.png'; // 默认头像路径，已存在
/**
 * @typedef {import('../types/User').User} User
*/



// 如需判断角色激活状态，请从 src/store/roleUtils.js 导入 isRoleInactive

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  /** @type {[User|null, Function]} */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  // 兜底处理函数
  function normalizeUser(rawUser) {
    if (!rawUser || !Array.isArray(rawUser.roles) || rawUser.roles.length === 0) return null;
    return {
      ...rawUser,
      avatar: rawUser.avatar || userAvatar,
      nickname: rawUser.nickname || rawUser.username,
    };
  }

  // 拉取当前用户信息
  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCurrentUser();
      /** @type {User|null} */
      const userData = res || null;
      const normalized = normalizeUser(userData);
      setUser(normalized);
      console.log('当前用户信息：', normalized);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 登录
  const login = async (credentials) => {
    try {
      await apiLogin(credentials);
      await fetchUser();
      return true;
    } catch (err) {
      // 可选：可在此处 setUser(null)
      return err?.message || '登录失败';
    }
  };

  // 登出
  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  // 权限校验
  const checkPermission = (requiredRole) => {
    if (!user || !user.roles) return false;
    if (!requiredRole) return true;
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => user.roles.includes(role));
    }
    return user.roles.includes(requiredRole);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        checkPermission,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserContext };
