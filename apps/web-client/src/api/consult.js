// src/api/consult.js
// 历史会话相关 API 封装

import { API_BASE_URL } from '../config/apiConfig';

const API_BASE = `${API_BASE_URL}/api/consult`;

/**
 * 获取指定会话的历史消息
 * @param {number|string} id - 会话唯一标识（后端 id 字段）
 * @returns {Promise<Array>} 消息数组，结构与 openapi.json ConsultationMessage 一致
 */
export async function getSessionMessages(id) {
  if (!id) throw new Error('会话 id 不能为空');
  const url = `${API_BASE}/sessions/${id}`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('获取历史消息失败');
  }
  return await res.json();
}


/**
 * chatSSE - 基于 fetch+ReadableStream 的 AI 对话流式接口（POST SSE，对齐 openapi）
 * @param {import('../types/ChatRequest').ChatRequest} params - 请求参数，结构需与 openapi 对齐（session_id, query, role, reasoning_effort）
 *   - session_id: string，必须，当前会话唯一标识，前端 chat 页面通过 useParams() 获取
 *   - query: string，用户输入内容
 *   - role, reasoning_effort: 其他参数
 * @param {function} onMessage - 每段消息回调 (data, {isTopic, isError, isDone})
 * @param {function} onError - 错误回调 (error)
 * @param {function} onComplete - 完成回调 ()
 * @returns {Promise<function>} 返回关闭流的函数
 *
 * 用法：
 * chatSSE({ session_id, query, role, reasoning_effort }, { onMessage, onError, onComplete })
 */
// session_id 必须由前端页面通过 useParams() 获取并传递
export async function chatSSE(params, { onMessage, onError, onComplete } = {}) {
  const url = `${API_BASE}/chat`;
  let controller = new AbortController();
  let completed = false;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      credentials: 'include',
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error('SSE 连接失败');
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      let parts = buffer.split('\n\n'); // SSE 消息以双换行分隔
      buffer = parts.pop(); // 保留最后一个不完整的部分
      
      for (const part of parts) {
        if (!part.trim()) continue;
        
        let eventType = 'message';
        let data = '';
        
        // 解析行
        const lines = part.split('\n');
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            data += line.substring(5).trim() + '\n'; // 拼接多行data
          }
        }
        data = data.trim(); // 移除末尾换行
        
        // 分发处理
        if (eventType === 'message') {
          if (!data) continue;
          try {
            const obj = JSON.parse(data);
            if (typeof obj.content === 'string') {
              onMessage(obj.content);
            } else {
              console.warn('[SSE] message data.content 非字符串', data);
            }
          } catch (e) {
            console.warn('[SSE] message data 解析失败', data, e);
          }
        } else if (eventType === 'topic') {
          if (!data) continue;
          try {
            const obj = JSON.parse(data);
            if (typeof obj.topic === 'string') {
              onMessage(obj.topic, { isTopic: true });
            } else {
              console.warn('[SSE] topic data.topic 非字符串', data);
            }
          } catch (e) {
            console.warn('[SSE] topic data 解析失败', data, e);
          }
        } else if (eventType === 'sources' || eventType === 'source') {
          if (!data) continue;
          try {
            const obj = JSON.parse(data);
            if (Array.isArray(obj)) {
              onMessage(obj, { isSources: true });
            } else {
              console.warn('[SSE] sources data 非数组', data);
            }
          } catch (e) {
            console.warn('[SSE] sources data 解析失败', data, e);
          }
        } else if (eventType === 'error') {
          if (!data) continue;
          try {
            const obj = JSON.parse(data);
            if (typeof obj.detail === 'string') {
              onMessage(obj.detail, { isError: true });
              if (onError) onError(obj.detail);
            } else {
              console.warn('[SSE] error data.detail 非字符串', data);
            }
          } catch (e) {
            console.warn('[SSE] error data 解析失败', data, e);
          }
        } else if (eventType === 'done') {
          completed = true;
          if (onComplete) onComplete();
          controller.abort();
          return () => controller.abort();
        }
      }
    }
    // 处理流结束后buffer中残留内容
    if (buffer && !completed) {
      // 处理残留，但SSE通常不残留
    }
    if (!completed && onComplete) onComplete();
  } catch (err) {
    if (!completed && onError) onError(err);
    if (!completed && onComplete) onComplete();
  }
  return () => controller.abort();
}

/**
 * 删除会话
 * @param {number|string} id - 会话唯一标识
 * @returns {Promise<void>}
 */
export async function deleteSession(id) {
  if (!id) throw new Error('会话 id 不能为空');
  const res = await fetch(`${API_BASE}/sessions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('删除会话失败');
  }
}

/**
 * 获取历史会话列表（标准结构：{ sessions: [...] }）
 * @returns {Promise<{ sessions: Array<{ sessionId: string, title: string, createdAt: string, lastMessage: string }> }>}
 */
export async function getSessions() {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('获取会话列表失败');
  }
  return await res.json();
}

/**
 * 创建新会话
 * @param {Object} [payload] - 可选参数，如 title
 * @returns {Promise<{ sessionId: string, title: string, createdAt: string, lastMessage: string }>}
 */
export async function createSession(payload = {}) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('新建会话失败');
  }
  return await res.json();
}
