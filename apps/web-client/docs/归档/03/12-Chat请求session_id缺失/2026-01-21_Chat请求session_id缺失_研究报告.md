# Chat请求session_id缺失 研究报告

## 版本记录

| 日期 | 版本 | 修改内容 | 修改原因 |
|---|---|---|---|
| 2026-01-21 | v1.0 | 初始设计 | 无 |

## 研究问题

chat 页面发送的 chat 请求没有 session_id 参数，导致后端响应 {"detail":"session_id 和 query 不能为空"}。

## 发现摘要

- chat 页面发送的请求负载缺少 session_id 字段，后端校验未通过。
- 需要定位 chat 请求的发起点，分析 session_id 的生成与传递逻辑。
- 相关 session 信息可能在前端 store、context 或页面 state 中维护。
- 需梳理 session_id 的来源、丢失原因及修复建议。

## 相关文件清单

|文件路径|作用说明|关键行号|
|---|---|---|

|src/pages/consultation/chat.jsx|chat 页面主逻辑|L17, L128-L155|
|src/store/consultSession.jsx|会话相关状态管理|L1-L80|
|src/api/consult.js|chat 请求 API 实现|L1-L140|

## 当前实现分析

### 核心流程

1. 用户在 chat 页面输入消息，点击发送。
2. 前端收集输入内容，调用 chat API。
3. 请求负载未包含 session_id，导致后端校验失败。

补充：
4. chatSSE 请求参数由 chat.jsx L141-L145 构造，session_id 来源于 useParams() 的 id（L17）。
5. chatSSE 实现于 consult.js L38-L140，参数结构需包含 session_id、query、role、reasoning_effort。
6. session_id 由路由参数传递，未能获取时会导致请求体缺失。

### 关键代码片段


- chat 页面获取 session_id：

	```jsx
	// src/pages/consultation/chat.jsx L17
	const { id } = useParams(); // 会话唯一标识
	```

- chat API 调用及参数构造：

	```jsx
	// src/pages/consultation/chat.jsx L128-L145
	const handleSend = async (content) => {
		// ...
		const chatParams = {
			session_id: id,
			query: content,
			role: 'counselor',
			reasoning_effort: null
		};
		await chatSSE(chatParams, ...);
	}
	```

- chatSSE API 实现：

	```js
	// src/api/consult.js L38-L140
	export async function chatSSE(params, { onMessage, onError, onComplete } = {}) {
		// ...
		body: JSON.stringify(params),
		// ...
	}
	```

- 会话状态管理（session 列表、创建、标题更新）：

	```jsx
	// src/store/consultSession.jsx L1-L80
	export function ConsultSessionProvider({ children }) {
		const [sessions, setSessions] = useState([]);
		// ...
		const loadSessions = async () => { ... };
		const newSession = async () => { ... };
		const setSessionTitle = (sessionId, title) => { ... };
		// ...
	}
	```

## 架构洞察

* chat 页面 session_id 依赖路由参数（useParams），若路由未正确传递 id，或页面未初始化 session，则会缺失。
* session_id 的生成由 createSession（src/api/consult.js L128-L140）负责，通常在新会话或页面初始化时调用。
* 会话状态通过 ConsultSessionProvider 统一管理，建议 chat 页面在无 id 时自动新建会话并跳转，或增加兜底校验。

- session_id 可能应由页面 state/store 提供，需确保在 chat API 调用时注入。
- 需排查 session_id 生成、保存、传递链路。

## 潜在风险和边缘情况

- session_id 丢失可能导致历史消息、上下文丢失。
- 多 tab/多会话场景下 session_id 管理需一致。

## 开放问题

- session_id 应由谁生成、何时生成？
- chat 页面如何感知当前 session_id？
- 是否有兜底机制防止 session_id 缺失？

## 参考资料

- docs/“心青年”智能体平台-数据模型与 API 设计.md
- src/api/consult.js

