import { API_BASE_URL } from '../config/apiConfig';

const API_BASE = `${API_BASE_URL}/api/auth`;

// 预留邮箱验证接口（Phase 3 邮箱字段编辑弹窗用）
// 用法示例：await sendEmailVerification(email)
// export async function sendEmailVerification(email) {
//   // TODO: 实现邮箱验证API调用
//   // return await fetch('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ email }) })
//   return Promise.resolve(); // 占位
// }
// 用户信息更新接口（Phase 3）
/**
 * 更新当前用户信息（对齐 OpenAPI UserUpdate schema）
 * @param {Object} data - 用户更新信息，字段严格对齐 openapi.json UserUpdate
 * 例如：{
 *   nickname?: string,
 *   avatar?: string,
 *   gender?: string,
 *   email?: string,
 *   volunteer_profile?: object|null,
 *   expert_profile?: object|null
 * }
 * @returns {Promise<Object>} 后端响应
 */
export async function updateUserProfile(data) {
  // 路径与方法严格对齐 OpenAPI
  const res = await fetch(`${API_BASE}/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || '更新失败');
  }
  return await res.json();
}
// 鉴权相关 API 封装，所有请求自动携带 Cookie


// ===============================
// MOCK 用户，仅开发环境使用，勿提交生产！
// ===============================
// MOCK 用户对象定义
// 后续可切换为独立 mock 文件或通过环境变量配置
export const MOCK_USER = {
  id: 0,
  username: 'dev-user',
  email: 'devuser@younghearts.com',
  gender: 'male',
  nickname: '心青年开发者',
  avatar: '/src/assets/user.png',
  roles: ['volunteer', 'expert'],
  status: 'active',
  is_active: true, // OpenAPI 字段
  is_superuser: false, // OpenAPI 字段
  // 前端独有字段（文档缺失）
  created_at: '2026-01-01T00:00:00Z', // 前端独有/文档缺失
  volunteer_profile: {
    user_id: 0,
    full_name: '张志愿',
    phone: '13800000000',
    public_email: 'volunteer@younghearts.com',
    is_public_visible: true,
    skills: ['心理陪伴', '活动组织'],
    service_hours: 120, // 前端独有/文档缺失
    status: 'approved',
    work_status: 'online', // 前端独有/文档缺失
    bio: '热心志愿者', // 前端独有/文档缺失
  },
  expert_profile: {
    user_id: 0,
    full_name: '李专家',
    phone: '13900000000',
    public_email: 'expert@younghearts.com',
    title: '心理咨询师',
    org: '心青年研究院',
    skills: ['青少年心理', '危机干预'],
    status: 'approved',
    // 前端独有字段
    qualifications: ['https://cert.example.com/abc.pdf'], // 前端独有/文档缺失
    specialties: ['青少年心理', '危机干预'], // 前端独有/文档缺失
    bio: '专注心理健康研究', // 前端独有/文档缺失
  },
};




/**
 * 注册新用户
 * @param {Object} data - 注册信息，字段严格对齐 openapi.json UserRegisterRequest
 * @returns {Promise<Object>} 后端响应
 *
 * data = {
 *   username: string,
 *   password: string,
 *   email?: string,
 *   gender?: string,
 *   nickname?: string,
 *   avatar?: string,
 *   roles: string[],
 *   volunteer_info?: object|null,
 *   expert_info?: object|null
 * }
 */
export async function register(data) {
  // 真实 API
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || '注册失败');
    }
    return await res.json();
  } catch (err) {
    throw new Error(err.message || '网络错误');
  }
}


export async function getCurrentUser() {
  // ===============================
  // MOCK 用户，仅开发环境使用，勿提交生产！
  // ===============================
  if (import.meta.env.VITE_MODE === 'development') {
    // 直接返回 MOCK_USER，结构与 User 类型一致
    return MOCK_USER;
  }
  const res = await fetch(`${API_BASE}/me`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('未登录');
  return await res.json();
}

export async function login({ username, password }) {
  // 真实 API
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || '登录失败');
    }
    return await res.json();
  } catch (err) {
    throw new Error(err.message || '网络错误');
  }
}

export async function logout() {
  if (import.meta.env.VITE_MODE === 'development') {
    // mock 登出，返回成功
    return { success: true };
  }
  const res = await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('登出失败');
  return await res.json();
}
