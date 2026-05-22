已在 代码库 中搜索 "AI 对话 SSE 输出"、22 结果

## 功能名称
AI 对话 SSE 输出

---

## 技术栈

- **后端框架**：FastAPI
- **异步流式输出**：StreamingResponse（SSE，Server-Sent Events）
- **大模型调用**：LangChain + OpenAI/ARK Chat API
- **数据库**：SQLAlchemy（ConsultationSession、ConsultationMessage）
- **鉴权**：依赖 FastAPI 的 Depends（如 get_current_user）
- **依赖管理**：requirements.txt/pyproject.toml

---

## 主要接口

### 1. AI对话流式输出接口

- **路径**：`POST /api/consult/chat`
- **协议**：SSE（text/event-stream）
- **请求体**（JSON）：
  - `session_id`：int，会话ID
  - `query`：str，用户输入内容
  - `role`：str，AI角色（如 counselor, friend）
  - `reasoning_effort`：str，可选，推理强度
- **鉴权**：需要（依赖 current_user）
- **响应**：流式输出AI回复文本，最后一包带上 topic 信息
- **流式尾包格式**：
  ```
  [TOPIC]{"topic": "<会话主题>"}
  ```
- **异常处理**：流中如遇异常，输出 `[ERROR]<错误信息>`

#### 示例请求
```json
POST /api/consult/chat
{
  "session_id": 123,
  "query": "你好，请帮我分析一下最近的情绪变化。",
  "role": "counselor",
  "reasoning_effort": "高"
}
```

#### 前端调用示例
```js
const response = await fetch('/api/consult/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ session_id, query, role, reasoning_effort })
});
const reader = response.body.getReader();
let aiMsg = '';
while(true) {
  const { done, value } = await reader.read();
  if (done) break;
  aiMsg += decode(value);
  setAiMessage(aiMsg); // 逐步渲染
}
```

---

## 相关数据模型

- **ConsultationSession**
  - id: int
  - topic: str
  - ...
- **ConsultationMessage**
  - id: int
  - session_id: int
  - role: str（"user"/"ai"）
  - content: str
  - sources: 可选，RAG 源
  - created_at: datetime

---

## 关键业务逻辑说明

- **流式输出**：AI回复通过 async_chat_with_rag 异步生成，逐步 yield 给前端。
- **消息持久化**：AI回复内容在流式输出全部完成后，一次性写入 ConsultationMessage（含重试机制）。
- **会话主题生成**：首次AI回复后，自动调用大模型生成 topic，写入 ConsultationSession.topic，并在流式尾包返回。
- **异常兜底**：AI回复持久化失败时重试2次，异常信息通过流式输出返回前端。

---

## 其他注意事项

- SSE流式输出需前端逐包解析，尾包需特殊处理 topic 信息。
- sources 字段为预留，当前为 None，后续可对接知识库。
- 需保证 session_id 合法性，否则接口返回 404。
- 角色（role）需与后端 prompt 配置一致（如 counselor, friend）。
- 需配置好大模型 API Key 环境变量。

---

如需详细参数/响应结构，请查阅 consult.py、consultation_service.py、service.py 及相关 schema/model 文件。