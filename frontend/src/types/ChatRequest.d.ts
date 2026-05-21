// ChatRequest 类型定义，对齐 openapi.json
/**
 * chatSSE 请求参数类型
 * @typedef {Object} ChatRequest
 * @property {string} query - 用户输入内容
 * @property {string} role - 固定为 'user'
 * @property {string} session_id - 会话ID
 * @property {null|number} reasoning_effort - 推理强度，可为 null
 */

type ChatRequest = {
  query: string;
  role: 'user';
  session_id: string;
  reasoning_effort: number | null;
};

export type { ChatRequest };
