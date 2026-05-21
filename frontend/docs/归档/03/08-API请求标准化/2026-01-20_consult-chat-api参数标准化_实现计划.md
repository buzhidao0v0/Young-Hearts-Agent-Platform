# consult/chat API 请求参数标准化实现计划

## 版本记录

| 日期 | 版本 | 修改内容 | 修改原因 |
|---|---|---|---|
| 2026-01-20 | v1.0 | 初始计划 | 基于 2026-01-19 研究报告 |

## 关联研究
[docs/tasks/罗问然/08-API请求标准化/2026-01-19_根据openapi标准构造consult-chat-api请求_研究报告.md](docs/tasks/罗问然/08-API请求标准化/2026-01-19_根据openapi标准构造consult-chat-api请求_研究报告.md)

## 功能概述
前端 consult/chat API 请求参数需严格对齐 openapi.json，补全 role（固定为 'user'）、reasoning_effort（允许为 null，无需 UI 采集）字段，并通过 TypeScript 类型定义固化参数结构，确保接口一致性和可维护性。

---

## Phase 1: chatSSE 请求参数补全

### 目标
确保 chatSSE 请求参数始终包含 query、role、session_id、reasoning_effort 字段，role 固定为 'user'，reasoning_effort 允许为 null。

### 修改文件清单
|文件路径|修改类型|说明|
|---|---|---|
|src/pages/consultation/chat.jsx|更新|chatSSE 调用参数补全 role、reasoning_effort|

### 具体变更
- 在 chatSSE 调用处，组装参数时补全 role: 'user'，reasoning_effort: null 字段。
- 保证即使 reasoning_effort 为 null 也随请求体发送。

### 成功标准
- 自动验证：抓包/console.log 请求体，字段齐全。
- 手动验证：AI 对话功能正常，后端无参数缺失报错。

---

## Phase 2: 参数类型定义与校验

### 目标
为 chatSSE 请求参数定义 TypeScript 类型（ChatRequest），并在 API 封装与调用处引用，提升类型安全。

### 修改文件清单
|文件路径|修改类型|说明|
|---|---|---|
|src/types/ChatRequest.d.ts|新增|定义 ChatRequest 类型|
|src/api/consult.js|更新|JSDoc 注释补充类型说明，chatSSE params 参数类型引用|
|src/pages/consultation/chat.jsx|更新|chatSSE 调用参数类型校验|

### 具体变更
- 新增 ChatRequest 类型定义，字段与 openapi.json 对齐。
- chatSSE JSDoc 注释 params 参数类型补充为 ChatRequest。
- chatSSE 调用处参数类型校验（如为 JS 项目则用 JSDoc 注释）。

### 成功标准
- 自动验证：IDE/tsc 类型检查无误。
- 手动验证：开发时类型提示准确。

---

## Phase 3: 联调与验证

### 目标
确保请求体与 openapi.json 完全一致，SSE 流式响应正常，异常包处理无误。

### 修改文件清单
|文件路径|修改类型|说明|
|---|---|---|
|src/pages/consultation/chat.jsx|验证|联调与异常处理测试|

### 具体变更
- 联调后端，抓包确认请求体字段齐全。
- 验证 [TOPIC]、[ERROR] 包解析与 UI 展示。

### 成功标准
- 自动验证：无参数缺失相关后端报错。
- 手动验证：AI 对话流畅，异常包正确提示。

---

## Commit message 模板

```
feat: consult/chat API 请求参数标准化
- chatSSE 参数补全 role、reasoning_effort 字段
- 新增 ChatRequest 类型定义，完善类型校验
- 联调验证接口一致性
```

## PR 描述要点
- 对齐 openapi.json，chatSSE 请求参数补全 role、reasoning_effort 字段
- 新增/完善 ChatRequest 类型定义，提升类型安全
- 联调验证，确保接口参数与后端一致，SSE 流式响应正常
