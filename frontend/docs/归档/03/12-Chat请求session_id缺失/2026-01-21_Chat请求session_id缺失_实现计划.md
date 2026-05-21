# Chat请求session_id缺失 实现计划

## 版本记录

| 日期 | 版本 | 修改内容 | 修改原因 |
|---|---|---|---|
| 2026-01-21 | v1.0 | 初始计划 | 基于 2026-01-21 研究报告 |

## 关联研究
[docs/tasks/罗问然/12-Chat请求session_id缺失/2026-01-21_Chat请求session_id缺失_研究报告.md](docs/tasks/罗问然/12-Chat请求session_id缺失/2026-01-21_Chat请求session_id缺失_研究报告.md)

## 功能概述
修复 chat 页面请求缺失 session_id 的问题。若 session_id 缺失，Toast 提示用户“会话不存在或已失效”，并自动跳转回历史会话页。无需自动新建会话，session_id 只需唯一，无需多 tab/多会话特殊处理。

---

## Phase 1: session_id 获取与注入链路梳理

### 目标
确保 chat 页面能正确获取 session_id，并在 chatSSE 请求参数中注入。

### 修改文件清单
|文件路径|修改类型|说明|
|---|---|---|
|src/pages/consultation/chat.jsx|更新|确认 session_id 获取逻辑，补充注释|
|src/api/consult.js|查阅/补充注释|确认 chatSSE 参数结构|

### 具体变更
- 检查 chat.jsx 是否始终通过 useParams() 获取 id，并在 chatSSE 参数中传递 session_id。
- 补充注释，理清 session_id 传递链路。

### 成功标准
- 自动验证：无 session_id 时 chatSSE 不被调用。
- 手动验证：正常进入 chat 页面时，网络请求 payload 含 session_id。

---

## Phase 2: chat 页面 session_id 缺失兜底机制

### 目标
chat 页面在 session_id 缺失时，Toast 提示“会话不存在或已失效”，并自动跳转回历史会话页。

### 修改文件清单
|文件路径|修改类型|说明|
|---|---|---|
|src/pages/consultation/chat.jsx|更新|增加 session_id 缺失兜底逻辑，集成 Toast 与跳转|
|src/components/Toast/index.jsx|复用|如需自定义 Toast，可补充|

### 具体变更
- 进入 chat 页面时，若 id 不存在：
  - Toast.error('会话不存在或已失效')
  - 跳转到历史会话页（如 /consultation/history 或实际路由）
- 禁止自动新建会话。

### 成功标准
- 自动验证：无 id 时自动跳转，无异常报错。
- 手动验证：直接访问 /consultation/chat（无 id）时，Toast 提示并跳转。

---

## Phase 3: API 层参数校验与类型约束

### 目标
chatSSE、createSession 等 API 层参数校验，防止 session_id 缺失传递。

### 修改文件清单
|文件路径|修改类型|说明|
|---|---|---|
|src/api/consult.js|更新|chatSSE 参数校验，必要时抛出异常或警告|

### 具体变更
- chatSSE 内部增加参数校验，session_id 缺失时抛出错误或警告（可选）。

### 成功标准
- 自动验证：调用 chatSSE 时 session_id 必须存在。
- 手动验证：开发环境下缺失参数有警告。

---

## Phase 4: 手动与自动化验证

### 目标
补充/修正测试用例，手动验证多场景 session_id 传递与 chat 功能。

### 修改文件清单
|文件路径|修改类型|说明|
|---|---|---|
|src/pages/consultation/chat.jsx|手动/自动测试|补充用例或手动测试脚本|

### 具体变更
- 手动测试：
  - 正常进入 chat 页面，发送消息，后端无报错。
  - 直接访问无 id 的 chat 页面，Toast 提示并跳转。
- 自动化测试（如有）：补充 session_id 相关用例。

### 成功标准
- 自动验证：所有相关用例通过。
- 手动验证：所有场景下 session_id 传递正确，用户体验符合预期。

---

## Commit message 模板

fix(chat): 修复 chat 页面 session_id 缺失导致请求失败的问题

- 进入 chat 页面时若无 session_id，Toast 提示并跳转回历史会话
- chatSSE API 增加参数校验，防止缺失 session_id

---

## PR 描述要点
- 修复 chat 页面 session_id 缺失导致后端校验失败问题
- 增加 Toast 提示与自动跳转兜底逻辑
- 优化 chatSSE API 参数校验
- 补充手动/自动化测试用例
