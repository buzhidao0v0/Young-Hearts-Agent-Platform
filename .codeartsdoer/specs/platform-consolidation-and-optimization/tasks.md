# 平台整合与优化 — 编码任务清单

> 基于设计文档 v1.0 生成 | 总预计工时：11.5h | 已完成项标注 `[completed]`

---

## 1. Monorepo工作区配置补齐（需求5.1）

### 1.1 补齐根package.json脚本联动
- [ ] 修改 `package.json` 的 `dev` 脚本，从 `concurrently` 切换为调用 `scripts/start.py`
- [ ] 新增 `dev:all` 脚本：`python scripts/start.py --services api,worker,web`
- [ ] 保留 `dev:api` / `dev:web` / `dev:worker` 直接启动脚本作为降级路径
- [ ] 确认 `install:all` 脚本包含 `pnpm install && uv sync --all-packages`

**涉及文件**: `package.json`
**依赖任务**: 无
**优先级**: P0 | 预估: 0.5h
**验收标准**: `npm run dev` 可调用start.py启动api+web；`npm run dev:all` 启动全部服务；`dev:api`/`dev:web`/`dev:worker` 作为降级仍可独立运行

### 1.2 创建ts-config占位包
- [ ] 创建 `packages/ts-config/package.json`，声明 `name: "@young-hearts/ts-config"`，版本占位
- [ ] 创建 `packages/ts-config/index.js`，空导出 `module.exports = {}`
- [ ] 创建 `packages/ts-config/README.md`，说明职责为"前端 TS / ESLint / Vite 共享配置占位"
- [ ] 确认 `pnpm-workspace.yaml` 的 glob 已包含 `packages/ts-*`

**涉及文件**: `packages/ts-config/package.json`, `packages/ts-config/index.js`, `packages/ts-config/README.md`
**依赖任务**: 无
**优先级**: P0 | 预估: 0.3h
**验收标准**: `pnpm install` 成功解析 ts-config 包；`packages/ts-config/` 包含 package.json + index.js + README.md

### 1.3 验证工作区完整性
- [ ] 执行 `uv sync --all-packages`，确认 Python workspace 解析无误
- [ ] 执行 `pnpm install`，确认 pnpm workspace 解析无误
- [ ] 执行 `python tests/workspace/test_workspace_imports.py`，确认共享包导入正常

**涉及文件**: 无（验证步骤）
**依赖任务**: 1.1, 1.2
**优先级**: P0 | 预估: 0.2h
**验收标准**: 三条命令均执行成功，无报错

---

## 2. Python共享包缺失模块补齐（需求5.2）

### 2.1 py-auth补齐缺失模块
- [ ] 新增 `packages/py-auth/py_auth/password.py`：实现 `hash_password(plain) → str` 和 `verify_password(plain, hashed) → bool`，使用 bcrypt
- [ ] 新增 `packages/py-auth/py_auth/rbac.py`：实现 `has_role(user, role) → bool` 和 `require_role(*roles) → Callable` 装饰器/依赖
- [ ] 新增 `packages/py-auth/py_auth/middleware.py`：实现 `TenantIsolationMiddleware` 和 `require_auth` FastAPI 依赖
- [ ] 更新 `packages/py-auth/py_auth/__init__.py`：导出 `jwt_handler`, `password`, `rbac`, `middleware`

**涉及文件**: `packages/py-auth/py_auth/password.py`, `packages/py-auth/py_auth/rbac.py`, `packages/py-auth/py_auth/middleware.py`, `packages/py-auth/py_auth/__init__.py`
**依赖任务**: 无
**优先级**: P0 | 预估: 1h
**验收标准**: `from py_auth import password, rbac, middleware` 均可成功导入；`hash_password`/`verify_password` 功能正确；`has_role`/`require_role` 返回正确布尔值/可调用对象

### 2.2 py-db补齐models定义
- [ ] 新增 `packages/py-db/py_db/models/user.py`：迁移 User, TenantUserRole 等 ORM 模型
- [ ] 新增 `packages/py-db/py_db/models/tenant.py`：迁移 Tenant 模型
- [ ] 新增 `packages/py-db/py_db/models/notice.py`：迁移 Notice 相关模型
- [ ] 新增 `packages/py-db/py_db/models/student.py`：迁移 Student 模型
- [ ] 更新 `packages/py-db/py_db/models/__init__.py`：聚合导出所有模型类
- [ ] 更新 `packages/py-db/py_db/__init__.py`：导出 `session`, `models`

**涉及文件**: `packages/py-db/py_db/models/user.py`, `packages/py-db/py_db/models/tenant.py`, `packages/py-db/py_db/models/notice.py`, `packages/py-db/py_db/models/student.py`, `packages/py-db/py_db/models/__init__.py`, `packages/py-db/py_db/__init__.py`
**依赖任务**: 无
**优先级**: P0 | 预估: 1h
**验收标准**: `from py_db.models import User, Tenant, Notice, Student` 成功导入；ORM 模型与 api-server 现有定义一致；`from py_db import models, session` 可用

### 2.3 py-schemas补齐DTO定义
- [ ] 新增 `packages/py-schemas/py_schemas/auth.py`：定义 LoginRequest, TokenResponse, UserInfo 等 DTO
- [ ] 新增 `packages/py-schemas/py_schemas/notice.py`：定义 NoticeCreate, NoticeResponse 等 DTO
- [ ] 新增 `packages/py-schemas/py_schemas/tenant.py`：定义 TenantCreate, TenantResponse 等 DTO
- [ ] 更新 `packages/py-schemas/py_schemas/__init__.py`：聚合导出 `base`, `auth`, `notice`, `tenant`

**涉及文件**: `packages/py-schemas/py_schemas/auth.py`, `packages/py-schemas/py_schemas/notice.py`, `packages/py-schemas/py_schemas/tenant.py`, `packages/py-schemas/py_schemas/__init__.py`
**依赖任务**: 无
**优先级**: P0 | 预估: 0.5h
**验收标准**: `from py_schemas import auth, notice, tenant` 成功导入；`python -c "from py_schemas import base"` 无循环引用错误

### 2.4 py-ai-engine补齐parsers.py
- [ ] 新增 `packages/py-ai-engine/py_ai_engine/parsers.py`：实现 `parse_llm_response(raw) → dict` 和 `extract_json_from_text(text) → dict`
- [ ] 更新 `packages/py-ai-engine/py_ai_engine/__init__.py`：增加 `parsers` 导出

**涉及文件**: `packages/py-ai-engine/py_ai_engine/parsers.py`, `packages/py-ai-engine/py_ai_engine/__init__.py`
**依赖任务**: 无
**优先级**: P0 | 预估: 0.5h
**验收标准**: `from py_ai_engine import parsers` 成功导入；`parse_llm_response` 可解析 LLM 原始响应为 dict

### 2.5 py-messaging补齐napcat.py
- [ ] 新增 `packages/py-messaging/py_messaging/napcat.py`：实现 `NapCatClient` 类，含 `send_group_message(group_id, message) → dict`
- [ ] 更新 `packages/py-messaging/py_messaging/__init__.py`：导出 `wxpusher`, `napcat`

**涉及文件**: `packages/py-messaging/py_messaging/napcat.py`, `packages/py-messaging/py_messaging/__init__.py`
**依赖任务**: 无
**优先级**: P0 | 预估: 0.5h
**验收标准**: `from py_messaging import napcat` 成功导入；`NapCatClient` 类可实例化并调用 `send_group_message`

### 2.6 api-server兼容层re-export（消除import路径断裂）
- [ ] 保留 `apps/api-server/app/models/` 作为 re-export 兼容层，指向 `py_db.models`
- [ ] 更新 api-server 中新代码的 import 优先使用 `py_db.models` / `py_schemas` / `py_auth`
- [ ] 验证循环引用消除：`python -c "from py_schemas import base"` 和 `python -c "from py_schemas import auth, notice, tenant"` 无 ImportError

**涉及文件**: `apps/api-server/app/models/__init__.py`（兼容层）
**依赖任务**: 2.2, 2.3
**优先级**: P0 | 预估: 0.5h
**验收标准**: api-server 现有 import 不报 ModuleNotFoundError；新代码优先使用 py_xxx 包路径；py_schemas 无循环引用

---

## 3. 前后端API对接补齐（需求5.3）

### 3.1 创建consultSSE流式响应客户端
- [ ] 新增 `apps/web-client/src/shared/api/consultSSE.js`：
  - 使用 fetch API + ReadableStream 解析 SSE
  - 实现 `consultSSE(url, payload, callbacks) → AbortController`
  - 支持 callbacks：`onMessage`, `onTopic`, `onSources`, `onError`, `onDone`
  - 处理所有 SSE 事件类型：message/topic/sources/source/error/done
  - 断连检测：ReadableStream 提前结束且 completed=false 时触发 onError
  - AbortController 支持用户主动中断

**涉及文件**: `apps/web-client/src/shared/api/consultSSE.js`
**依赖任务**: 无（独立于共享包修复）
**优先级**: P0 | 预估: 0.5h
**验收标准**: consultSSE 可建立 SSE 连接并逐事件回调；AbortController.abort() 可中断连接；断连触发 onError 回调

### 3.2 Vite代理配置增强（SSE长连接支持）
- [ ] 修改 `apps/web-client/vite.config.js` 的 proxy 配置：增加 `timeout: 300000`（SSE长连接超时5分钟）
- [ ] 确认 SSE 连接不被 Vite 代理缓冲（必要时增加 `configure` 回调禁用代理缓冲）

**涉及文件**: `apps/web-client/vite.config.js`
**依赖任务**: 无
**优先级**: P0 | 预估: 0.3h
**验收标准**: SSE 流式响应在 Vite 代理下实时传输，不被缓冲；长连接5分钟内不超时

### 3.3 CORS配置完善与验证
- [ ] 确认 `apps/api-server/app/main.py` CORS 配置不含通配符 `*` 与 `allow_credentials=True` 的组合
- [ ] 确认 `.env.example` 中已声明 `CORS_ORIGINS` 变量，默认包含 `http://localhost:5173`
- [ ] 验证 `CORS_ORIGINS` 支持逗号分隔多源地址解析

**涉及文件**: `apps/api-server/app/main.py`, `.env.example`
**依赖任务**: 无
**优先级**: P0 | 预估: 0.3h
**验收标准**: CORS 配置为具体源列表而非通配符；多源地址可正确解析并生效

### 3.4 API路径映射审计
- [ ] 对比前端 `src/api/` 模块与后端 `app/api/v1/routes/` 的路由注册，记录对齐状态
- [ ] 标记待创建的后端路由（如 consult/knowledge），确认前端请求路径对应关系

**涉及文件**: 无（审计文档输出）
**依赖任务**: 2.3（py-schemas DTO需先就位）
**优先级**: P1 | 预估: 0.3h
**验收标准**: 输出前后端API路径对照表，所有已实现路由标记为✅对齐，待实现路由标记为❌需补

### 3.5 adminClient 401拦截器去重验证
- [ ] 确认 `apps/web-client/src/shared/api/adminClient.js` 中 `isRefreshing` 标志位在跳转后正确重置为 false
- [ ] 确认 `pendingRequests` 队列在跳转后正确清空
- [ ] 验证并发 401 响应仅触发一次登录页跳转

**涉及文件**: `apps/web-client/src/shared/api/adminClient.js`
**依赖任务**: 无
**优先级**: P1 | 预估: 0.2h
**验收标准**: 多个并发 401 响应仅跳转一次登录页，无闪烁

---

## 4. 统一启动脚本重写（需求5.4）

### 4.1 创建scripts/utils/process_utils.py（跨平台进程管理）
- [ ] 实现 `launch_process(command, env, service_name) → subprocess.Popen`：Linux/macOS 用 os.setsid 创建新进程组，Windows 用 CREATE_NEW_PROCESS_GROUP
- [ ] 实现 `graceful_terminate(proc, timeout=10) → None`：Linux/macOS 用 os.killpg 发送 SIGTERM，Windows 用 taskkill /F /T /PID 递归终止
- [ ] 实现 `force_terminate(proc) → None`：终极手段 proc.kill()
- [ ] 实现 `is_process_alive(proc) → bool`：检查进程存活状态
- [ ] 所有平台差异封装在此模块，禁止业务脚本包含 sys.platform 判断

**涉及文件**: `scripts/utils/process_utils.py`
**依赖任务**: 无
**优先级**: P1 | 预估: 1h
**验收标准**: launch_process 在 Windows/Linux 均可创建子进程；graceful_terminate 可优雅终止进程组；Ctrl+C 安全终止所有子进程及孙进程，无僵尸进程

### 4.2 创建scripts/utils/log_utils.py（控制台日志输出）
- [ ] 实现 `print_colored(text, color) → None`：检测 `sys.stdout.isatty()`，不支持颜色时降级纯文本；颜色语义：green=成功, yellow=警告, red=错误, cyan=信息
- [ ] 实现 `print_stage_header(title) → None`：输出三阶段分隔标题
- [ ] 实现 `print_check_result(name, passed, detail="") → None`：逐项输出前置检查结果（✔/✘ + 对齐 + 失败原因）
- [ ] 实现 `print_service_log(service_name, message) → None`：固定宽度服务名前缀对齐输出
- [ ] ANSI 颜色码严禁硬编码，统一通过此模块输出

**涉及文件**: `scripts/utils/log_utils.py`
**依赖任务**: 无
**优先级**: P1 | 预估: 0.5h
**验收标准**: TTY 环境输出带颜色，非 TTY（CI）输出纯文本；三阶段标题格式清晰；检查结果 ✔/✘ 对齐

### 4.3 重写scripts/utils/check_utils.py（扩展前置检查）
- [ ] 实现 `check_env_file() → (bool, str)`：检查 .env 文件存在性
- [ ] 实现 `check_python_env() → (bool, str)`：检查 Python/uv 可执行性
- [ ] 实现 `check_node_env() → (bool, str)`：检查 Node/pnpm 可执行性
- [ ] 增强 `check_port(port, host) → (bool, str)`：端口占用检查，增强返回消息
- [ ] 实现 `check_mysql() → (bool, str)`：MySQL 连通性 Ping（弱依赖，失败警告不中止）
- [ ] 实现 `check_redis() → (bool, str)`：Redis 连通性 Ping（强依赖，失败中止）
- [ ] 实现 `run_preflight_checks(services) → bool`：执行全量前置检查，强依赖失败立即中止

**涉及文件**: `scripts/utils/check_utils.py`, `scripts/utils/__init__.py`
**依赖任务**: 无
**优先级**: P1 | 预估: 0.5h
**验收标准**: 缺 .env 文件时中止启动；MySQL/Redis 不可达时正确报告；前置检查逐项实时打印 ✔/✘ 结果

### 4.4 重写scripts/start.py（三阶段+argparse+交互菜单）
- [ ] 实现 argparse 参数解析：`--services`（逗号分隔服务组合）、`--env-file`（环境文件路径，默认.env）
- [ ] 实现交互式菜单：无参数时展示选项 `[1] API Server [2] AI Worker [3] Web Client [4] All [q] Quit`
- [ ] 实现阶段一：前置检查（逐项实时打印，强依赖失败立即中止）
- [ ] 实现阶段二：服务启动（逐个拉起子进程，打印 PID）
- [ ] 实现阶段三：运行中（子进程 stdout/stderr 重定向 + 前缀着色输出）
- [ ] 实现信号处理：Ctrl+C → 优雅终止所有子进程 → 退出阶段输出
- [ ] CI 环境检测：`sys.stdin.isatty()` 为 False 时要求 --services 参数

**涉及文件**: `scripts/start.py`
**依赖任务**: 4.1, 4.2, 4.3
**优先级**: P1 | 预估: 1h
**验收标准**: `python scripts/start.py --services api,web` 启动 api+web；无参数进入交互菜单；三阶段输出格式清晰；Ctrl+C 安全终止；非 TTY 环境要求 --services

### 4.5 更新子启动脚本
- [ ] 修改 `scripts/start_api.py`：改为调用 `start.py --services api`
- [ ] 修改 `scripts/start_worker.py`：改为调用 `start.py --services worker`
- [ ] 修改 `scripts/start_web.py`：改为调用 `start.py --services web`

**涉及文件**: `scripts/start_api.py`, `scripts/start_worker.py`, `scripts/start_web.py`
**依赖任务**: 4.4
**优先级**: P1 | 预估: 0.2h
**验收标准**: `python scripts/start_api.py` 等效于 `python scripts/start.py --services api`

---

## 5. py-logger增强（需求5.5）

### 5.1 补齐events.py事件名常量
- [ ] 补齐认证事件配对：`AUTH_LOGOUT_FAILED`, `AUTH_BOOTSTRAP_SUPER_ADMIN_EXISTS/Created/Failed`, `AUTH_TOKEN_USER_EXTRACT_FAILED`
- [ ] 补齐鉴权事件：`AUTH_RESOLVE_USER_FAILED`, `AUTH_ROLE_CHECK_FAILED`, `AUTH_TENANT_CONTEXT_FAILED`
- [ ] 补齐用户事件配对：`USER_CREATE_SUCCEEDED/FAILED`, `USER_GET_ME_FAILED`
- [ ] 补齐学生事件配对：`STUDENT_VERIFY_SUCCEEDED/FAILED`
- [ ] 补齐 Token/密码事件：`TOKEN_DECODE_FAILED`, `TOKEN_DECODE_INVALID_TYPE`, `PASSWORD_HASH_FALLBACK_USED`, `PASSWORD_VERIFY_FAILED`
- [ ] 补齐请求日志事件：`REQUEST_RECEIVED`, `REQUEST_COMPLETED`

**涉及文件**: `packages/py-logger/py_logger/events.py`
**依赖任务**: 无
**优先级**: P1 | 预估: 0.3h
**验收标准**: events.py 包含所有 `*_succeeded/*_failed` 配对事件常量；事件名格式为小写下划线，前缀按模块

### 5.2 增强context.py — trace_id自动注入structlog上下文
- [ ] 修改 `set_trace_id(tid)`：在设置 ContextVar 后自动调用 `structlog.contextvars.bind_contextvars(trace_id=tid)`
- [ ] 新增 `clear_trace_id()`：清除 ContextVar 并调用 `structlog.contextvars.unbind_contextvars("trace_id")`
- [ ] 确认 core.py 的 `configure_logging` 已包含 `merge_contextvars` 处理器

**涉及文件**: `packages/py-logger/py_logger/context.py`
**依赖任务**: 无
**优先级**: P1 | 预估: 0.3h
**验收标准**: 调用 `set_trace_id("abc-123")` 后日志输出包含 `trace_id=abc-123` 字段；`clear_trace_id()` 正确清除上下文

### 5.3 增强fastapi_middleware.py — 添加request_received事件
- [ ] 在 `dispatch` 方法的 `call_next` 之前添加 `request_received` 事件日志：输出 `method`, `path`, `trace_id`
- [ ] 确认 `request_completed` 事件日志输出包含 `method`, `path`, `status_code`, `elapsed_ms`, `trace_id`

**涉及文件**: `packages/py-logger/py_logger/middlewares/fastapi_middleware.py`
**依赖任务**: 5.1（需 REQUEST_RECEIVED 常量）
**优先级**: P1 | 预估: 0.2h
**验收标准**: 请求入口日志包含 `request_received` 事件；出口日志包含 `request_completed` 事件及 duration

### 5.4 增强core.py — JSON Renderer配置选项
- [ ] 修改 `configure_logging(level, json_format=False)`：`json_format=True` 时使用 `structlog.processors.JSONRenderer()`，`False` 时使用 `structlog.dev.ConsoleRenderer()`

**涉及文件**: `packages/py-logger/py_logger/core.py`
**依赖任务**: 无
**优先级**: P1 | 预估: 0.2h
**验收标准**: `configure_logging(json_format=True)` 后日志输出 JSON 格式；默认输出 Console 格式

---

## 6. 注释与代码规范增强（需求5.6）

### 6.1 增强Ruff配置
- [ ] 在根 `pyproject.toml` 的 `[tool.ruff.lint]` 中扩展 select 规则：增加 `D`（pydocstyle）、`ANN`（flake8-annotations）
- [ ] 添加 `[tool.ruff.lint.pydocstyle]` 段：`convention = "google"`
- [ ] 添加 ignore 规则：`["D100", "D104"]`（允许模块级和包级缺 docstring）
- [ ] 采用渐进策略：新代码严格执行，存量问题通过 ignore 豁免

**涉及文件**: `pyproject.toml`
**依赖任务**: 无
**优先级**: P2 | 预估: 0.3h
**验收标准**: `ruff check .` 使用扩展规则集；D/ANN 规则生效；存量代码通过 ignore 豁免不报错

### 6.2 集成Husky + Commitlint
- [ ] 安装 Husky：`pnpm add -D husky` 并 `pnpm exec husky init`
- [ ] 创建 `.husky/pre-commit`：执行 `ruff check .`
- [ ] 创建 `.husky/commit-msg`：执行 `pnpm exec commitlint --edit $1`
- [ ] 更新 `package.json`：增加 `prepare` 脚本（`husky`）和 Husky 依赖声明
- [ ] 确认 `commitlint.config.js` 已存在且配置正确

**涉及文件**: `package.json`, `.husky/pre-commit`, `.husky/commit-msg`
**依赖任务**: 无
**优先级**: P2 | 预估: 0.5h
**验收标准**: `git commit -m "fix bug"` 被 commitlint 拦截；`ruff check` 不通过时 pre-commit 阻止提交

### 6.3 添加ESLint jsdoc插件
- [ ] 在 web-client 中安装 `eslint-plugin-jsdoc`：`cd apps/web-client && pnpm add -D eslint-plugin-jsdoc`
- [ ] 配置 ESLint 启用 jsdoc 规则，检查 TSDoc 完整性

**涉及文件**: `apps/web-client/package.json`, `apps/web-client/.eslintrc.*`
**依赖任务**: 无
**优先级**: P2 | 预估: 0.2h
**验收标准**: ESLint 检查 TSDoc 注释完整性；组件 Props 和自定义 Hook 缺注释时报错

---

## 7. 项目清理（需求5.7）

### 7.1 更新.gitignore
- [ ] 补充缺失忽略规则：`uv.lock`, `.venv/`, `.uv/`, `.aux/`, `*.egg-info/`, `.mypy_cache/`, `.ruff_cache/`
- [ ] 确认已有规则覆盖：`__pycache__/`, `node_modules/`, `.env`, `dist/`

**涉及文件**: `.gitignore`
**依赖任务**: 无
**优先级**: P2 | 预估: 0.2h
**验收标准**: `git status` 不显示 uv.lock/.venv 等应忽略文件

### 7.2 创建docs/目录并整合文档
- [ ] 创建 `docs/` 目录
- [ ] 创建 `docs/architecture.md`：架构设计文档（整合自规范/或其他位置）
- [ ] 创建 `docs/api.md`：API 接口文档
- [ ] 创建 `docs/deployment.md`：部署指南
- [ ] 保留 `规范/` 目录下四份规范文件不变

**涉及文件**: `docs/architecture.md`, `docs/api.md`, `docs/deployment.md`
**依赖任务**: 无
**优先级**: P2 | 预估: 0.5h
**验收标准**: `docs/` 目录包含三个文档文件；规范/ 目录保持不变

### 7.3 删除冗余文件
- [ ] 删除 `requirements.txt`（已迁移至 uv workspace，pyproject.toml 管理依赖）
- [ ] 确认保留项：`规范/` 目录、`.env.example`、`docker-compose.yml`、`data/` 目录
- [ ] 清理前确保 git commit 可恢复

**涉及文件**: `requirements.txt`（删除）
**依赖任务**: 无
**优先级**: P2 | 预估: 0.2h
**验收标准**: `requirements.txt` 不存在；`uv export > requirements.txt` 可随时生成等效文件

---

## 8. README优化（需求5.8）

### 8.1 重写README.md
- [ ] 添加徽章：Python 版本 | React 版本 | License | Build Status
- [ ] 添加目录：项目概述/技术栈/架构概览/快速启动/项目结构/API端点速查/环境变量配置/开发指南/贡献指南
- [ ] 编写项目概述：心青年智能体平台定位与核心功能
- [ ] 编写架构概览：Mermaid C4 图（web-client → api-server → ai-worker → packages → 外部依赖）
- [ ] 编写快速启动：安装命令 + 启动命令 + 访问地址
- [ ] 编写 API 端点速查表：方法/路径/描述（覆盖 auth/health/notice 等已实现端点）
- [ ] 编写环境变量配置表：变量名/类型/默认值/必填/说明
- [ ] 编写贡献指南：Fork→Branch→PR 流程 + Conventional Commits + Ruff/ESLint 检查 + 测试要求
- [ ] 验证 Mermaid 语法在 GitHub Markdown 预览中正确渲染

**涉及文件**: `README.md`
**依赖任务**: 7.2（清理后目录结构确定再写 README）
**优先级**: P2 | 预估: 1.5h
**验收标准**: README 包含徽章+目录+架构图+API端点表+环境变量表+贡献指南；Mermaid 图在 GitHub 正确渲染

---

## 9. 验收与集成测试

### 9.1 工作区集成验证
- [ ] 执行 `uv sync --all-packages && pnpm install`，确认双工作区解析无误
- [ ] 执行 `python tests/workspace/test_workspace_imports.py`，确认所有共享包导入正常
- [ ] 执行 `pip install -e packages/py-config && from py_config import settings`，验证可编辑安装

**涉及文件**: 无（验证步骤）
**依赖任务**: 1.3, 2.6
**优先级**: P0 | 预估: 0.3h
**验收标准**: 双工作区安装成功；所有共享包 import 无报错

### 9.2 前后端联调验证
- [ ] 启动 api-server + web-client，验证 Vite 代理转发 API 请求到 :8000
- [ ] 验证 SSE 流式响应渐进展示
- [ ] 验证 401 拦截器仅跳转一次

**涉及文件**: 无（验证步骤）
**依赖任务**: 3.1, 3.2, 3.3
**优先级**: P0 | 预估: 0.3h
**验收标准**: API 请求到达后端；SSE 实时传输；401 仅一次跳转

### 9.3 启动脚本功能验证
- [ ] 验证 `python scripts/start.py --services api,web` 正确启动指定服务
- [ ] 验证前置检查失败（如停止 Redis）时中止启动
- [ ] 验证 Ctrl+C 安全终止所有进程

**涉及文件**: 无（验证步骤）
**依赖任务**: 4.4
**优先级**: P1 | 预估: 0.3h
**验收标准**: 三阶段输出；前置检查失败中止；Ctrl+C 无僵尸进程

### 9.4 代码规范工具链验证
- [ ] 执行 `ruff check .`，确认扩展规则生效
- [ ] 执行 `git commit -m "fix bug"`，确认 commitlint 拦截
- [ ] 执行 `ruff check . --fix`，确认自动修复可用

**涉及文件**: 无（验证步骤）
**依赖任务**: 6.1, 6.2
**优先级**: P2 | 预估: 0.2h
**验收标准**: Ruff 扩展规则检查通过；commitlint 拦截不合规提交

---

## 已完成工作清单（commit b58a39c）

以下工作已在上一阶段完成，**无需重复执行**：

| 已完成项 | 状态 | 说明 |
|---------|------|------|
| 根 pyproject.toml uv workspace 配置 | ✅ completed | 2 apps + 7 packages 已声明 |
| pnpm-workspace.yaml | ✅ completed | apps/web-client + packages/ts-* 已声明 |
| 7个Python共享包骨架创建 | ✅ completed | py_xxx/子目录结构已创建，pip install -e 验证通过 |
| ts-shared包 | ✅ completed | enums + types 骨架已创建 |
| apps/ai-worker | ✅ completed | Celery Worker 应用骨架已创建 |
| api-server main.py CORS动态配置 | ✅ completed | 从 CORS_ORIGINS 读取 |
| 前端API客户端(adminClient/h5Client) | ✅ completed | 401/422 拦截器已实现 |
| Vite proxy /api → localhost:8000 | ✅ completed | 基础代理已配置 |
| tests/workspace/test_workspace_imports.py | ✅ completed | 工作区导入测试已创建 |
| py-logger骨架 | ✅ completed | core.py/context.py/events.py/middleware 骨架已创建 |
| ts-config .gitkeep | ✅ completed | 占位目录已存在 |

---

## 任务依赖关系图

```text
阶段1 (P0-基础配置)
  1.1 补齐package.json脚本 ──┐
  1.2 创建ts-config占位包 ───┤
  1.3 验证工作区完整性 ←──────┘
  2.1 py-auth补齐模块
  2.2 py-db补齐models ────────┐
  2.3 py-schemas补齐DTO ──────┤
  2.4 py-ai-engine补齐parsers │
  2.5 py-messaging补齐napcat  │
  2.6 api-server兼容层 ←──────┘
  3.1 创建consultSSE
  3.2 Vite代理增强
  3.3 CORS配置完善
  3.4 API路径映射审计 ← 2.3
  3.5 401拦截器去重验证

阶段2 (P1-工程增强)
  4.1 process_utils.py
  4.2 log_utils.py
  4.3 check_utils.py重写
  4.4 start.py重写 ← 4.1+4.2+4.3
  4.5 子启动脚本更新 ← 4.4
  5.1 events.py补齐事件名
  5.2 context.py trace_id注入
  5.3 middleware request_received ← 5.1
  5.4 core.py JSON Renderer

阶段3 (P2-规范与清理)
  6.1 Ruff配置增强
  6.2 Husky+Commitlint集成
  6.3 ESLint jsdoc插件
  7.1 .gitignore更新
  7.2 docs/目录整合
  7.3 冗余文件删除
  8.1 README重写 ← 7.2

验收
  9.1 工作区集成验证 ← 1.3+2.6
  9.2 前后端联调验证 ← 3.1+3.2+3.3
  9.3 启动脚本验证 ← 4.4
  9.4 代码规范验证 ← 6.1+6.2
```

---

## 工时汇总

| 阶段 | 任务组 | 优先级 | 预估工时 |
|------|--------|--------|---------|
| 阶段1 | 1. Monorepo工作区配置 | P0 | 1.0h |
| 阶段1 | 2. Python共享包补齐 | P0 | 3.5h |
| 阶段1 | 3. 前后端API对接 | P0/P1 | 1.6h |
| 阶段2 | 4. 统一启动脚本 | P1 | 3.2h |
| 阶段2 | 5. py-logger增强 | P1 | 1.0h |
| 阶段3 | 6. 注释与代码规范 | P2 | 1.0h |
| 阶段3 | 7. 项目清理 | P2 | 0.9h |
| 阶段3 | 8. README优化 | P2 | 1.5h |
| 验收 | 9. 验收与集成测试 | P0/P1/P2 | 1.1h |
| **合计** | | | **14.8h** |
