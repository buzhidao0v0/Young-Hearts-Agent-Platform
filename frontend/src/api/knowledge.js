import { API_BASE_URL } from '../config/apiConfig';

const API_BASE = `${API_BASE_URL}/api/knowledge`;

/**
 * 知识库 API 封装
 */
export const knowledgeApi = {
  /**
   * 获取知识列表
   * @param {Object} params - 查询参数 (如 { status: 'published', category: '心理' })
   * @returns {Promise<Object>}
   */
  getItems: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_BASE}/items?${queryString}` : `${API_BASE}/items`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || '获取知识列表失败');
    }
    return await res.json();
  },

  /**
   * 获取知识详情
   * @param {string|number} id - 知识条目 ID
   * @returns {Promise<Object>}
   */
  getItemById: async (id) => {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || '获取知识详情失败');
    }
    return await res.json();
  },

  /**
   * 获取个人知识贡献列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>}
   */
  getMyItems: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_BASE}/my-items?${queryString}` : `${API_BASE}/my-items`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || '获取个人知识列表失败');
    }
    return await res.json();
  },

  /**
   * 更新知识条目
   * @param {string|number} id - 知识条目 ID
   * @param {Object} data - 知识条目数据
   * @returns {Promise<Object>}
   */
  updateItem: async (id, data) => {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || '更新知识条目失败');
    }
    return await res.json();
  },

  /**
   * 删除知识条目
   * @param {string|number} id - 知识条目 ID
   * @returns {Promise<Object>}
   */
  deleteItem: async (id) => {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || '删除知识条目失败');
    }
    return await res.json();
  },

  /**
   * 获取待审核列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>}
   */
  getAuditList: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_BASE}/audit-list?${queryString}` : `${API_BASE}/audit-list`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || '获取待审核列表失败');
    }
    return await res.json();
  },

  /**
   * 审核知识条目
   * @param {string|number} id - 知识条目 ID
   * @param {Object} data - 审核数据 (如 { action: 'pass' | 'reject', reason: '...' })
   * @returns {Promise<Object>}
   */
  auditItem: async (id, data) => {
    const res = await fetch(`${API_BASE}/${id}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || '审核操作失败');
    }
    return await res.json();
  },

  /**
   * 上传文件
   * @param {FormData} formData - 包含文件的 FormData 对象
   * @returns {Promise<Object>}
   */
  uploadFile: async (formData) => {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      // 注意：使用 FormData 时，不要手动设置 Content-Type，浏览器会自动设置并加上 boundary
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || '文件上传失败');
    }
    return await res.json();
  },
};
