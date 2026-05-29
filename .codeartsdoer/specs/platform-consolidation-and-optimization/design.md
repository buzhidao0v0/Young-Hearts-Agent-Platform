# **1. 实现模型**

## **1.1 上下文视图**

### 当前状态（已完成）

上一阶段已落地以下基础设施：

| 已完成项 | 当前状态 | 对应提交 |
|---------|---------|---------|
| 根pyproject.toml uv workspace | 2 apps + 7 packages 已声明 | b58a39c |
| pnpm-workspace.yaml | apps/web-client + packages/ts-* 已声明 | b58a39c |
| 7个Python共享包 | py_xxx/子目录结构已创建，pip install -e 验证通过 | b58a39c |
| ts-shared包 | enums + types 骨架已创建 | b58a39c |
| apps/ai-worker | Celery Worker应用骨架已创建 | b58a39c |
| api-server main.py | CORS动态配置已改为从CORS_ORIGINS读取 | b58a39c |
| 前端API客户端 | adminClient/h5Client 已创建（401/422拦截器已实现） | b58a39c |
| Vite proxy | /api → localhost:8000 已配置 | b58a39c |
| scripts/start.py | 基础版启动脚本已存在（需按规范重构） | 已有 |
| py-logger | core.py/context.py/events.py/middleware 骨架已创建 | b58a39c |

### 待实现差距分析

| 需求编号 | 需求点 | 当前差距 | 实现优先级 |
|---------|-------|---------|-----------|
| 5.1 | Monorepo工作区配置 | 根package.json脚本不完整，缺dev:worker联动；缺ts-config包 | P0 |
| 5.2 | Python共享包目录结构修复 | py-auth缺password.py/rbac.py/middleware.py；py-db/models/为空壳；py-schemas缺auth.py/notice.py/tenant.py；py-ai-engine缺parsers.py；py-messaging缺napcat.py | P0 |
| 5.3 | 前后端API对接 | adminClient/h5Client已有但缺consultSSE；SSE流式处理未实现；前端api/目录下仍用硬编码baseURL | P0 |
| 5.4 | 统一启动脚本 | 现有start.py不满足三阶段布局、无argparse、无交互式菜单、无前置检查（DB/Redis连通性）、进程管理不跨平台 | P1 |
| 5.5 | py-logger增强 | events.py事件名不全（缺*_succeeded/*_failed配对）；context.py trace_id未自动注入structlog上下文；middleware缺request_received事件 | P1 |
| 5.6 | 注释与代码规范 | Ruff已有基础配置但缺pydocstyle/isort/bugbear规则；Commitlint配置已存在但缺Husky集成；Conventional Commits无pre-commit hook强制 | P2 |
| 5.7 | 项目清理 | README.md内容过时；.gitignore缺uv.lock/uv/等规则；规范/目录需保留但docs/目录缺失 | P2 |
| 5.8 | README优化 | 当前README极简，缺徽章/目录/架构图/API端点表/环境变量表/贡献指南 | P2 |

## **1.2 服务/组件总体架构**

```text
┌─────────────────────────────────────────────────────────────────┐
│                    心青年(SAP) 平台架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  apps/                                                          │
│  ├── web-client ─── React 18 + Vite ─── B端后台 + C端H5        │
│  │   ├── src/shared/api/ ─ adminClient / h5Client / consultSSE │
│  │   └── src/features/ ─ knowledge / (auth/notice/...)         │
│  ├── api-server ─── FastAPI ─── 认证 + 业务API + 任务调度       │
│  │   ├── app/api/v1/routes/ ─ auth.py / (notices/health/...)   │
│  │   ├── app/services/ ─ auth_service / user_service / ...      │
│  │   └── app/db/ ─ session + models                            │
│  └── ai-worker ─── Celery ─── 解析 + 推送 + 向量化 + 导出       │
│      └── src/ai_worker/ ─ celery_app + tasks/                  │
│                                                                 │
│  packages/                                                      │
│  ├── py-config ─── Pydantic Settings 全局配置                   │
│  ├── py-db ─── SQLAlchemy ORM + Alembic + models               │
│  ├── py-schemas ─── Pydantic DTO (auth/notice/tenant)           │
│  ├── py-auth ─── JWT + RBAC + 密码哈希 + 租户隔离中间件         │
│  ├── py-ai-engine ─── LLM Client + 响应解析器                   │
│  ├── py-logger ─── structlog + trace_id + events + middleware   │
│  ├── py-messaging ─── WxPusher + NapCatQQ                      │
│  ├── ts-shared ─── 枚举 + 类型定义                              │
│  └── ts-config ─── (占位预留)                                   │
│                                                                 │
│  scripts/                                                       │
│  ├── start.py ─── argparse + 三阶段布局 + 交互式菜单             │
│  ├── start_api.py / start_worker.py / start_web.py              │
│  └── utils/ ─ check_utils + log_utils + process_utils           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## **1.3 实现设计文档**

### 1.3.1 需求5.1 — Monorepo工作区配置

**架构决策**：双工作空间已声明完成，本轮聚焦补齐根脚本联动和ts-config占位包。

#### 实现路径

**步骤1：补齐根package.json脚本**

当前`package.json`的`dev`脚本仅启动api+web，需增加worker联动选项：

```json
{
  "scripts": {
    "dev": "python scripts/start.py --services api,web",
    "dev:all": "python scripts/start.py --services api,worker,web",
    "dev:api": "cd apps/api-server && python -m uvicorn app.main:app --reload --port 8000",
    "dev:web": "cd apps/web-client && pnpm run dev",
    "dev:worker": "cd apps/ai-worker && celery -A src.ai_worker.celery_app worker --loglevel=info",
    "build": "cd apps/web-client && pnpm run build",
    "test": "pytest && cd apps/web-client && pnpm run test",
    "test:api": "cd apps/api-server && pytest",
    "test:web": "cd apps/web-client && pnpm run test",
    "lint": "ruff check . && cd apps/web-client && pnpm run lint",
    "lint:fix": "ruff check --fix . && cd apps/web-client && pnpm run lint:fix",
    "install:all": "pnpm install && uv sync --all-packages"
  }
}
```

**关键变更**：`dev`脚本改为调用`scripts/start.py`，由启动脚本统一管理多进程。

**步骤2：创建ts-config占位包**

```
packages/ts-config/
├── package.json    # name: "@young-hearts/ts-config", 版本占位
├── index.js        # 空导出
└── README.md       # 职责说明
```

**步骤3：验证工作区完整性**

- 执行`uv sync --all-packages`确认Python workspace解析无误
- 执行`pnpm install`确认pnpm workspace解析无误
- 执行`tests/workspace/test_workspace_imports.py`确认共享包导入正常

#### 文件变更清单

| 文件路径 | 变更类型 | 变更说明 |
|---------|---------|---------|
| `package.json` | 修改 | dev脚本改为调用start.py，新增dev:all脚本 |
| `packages/ts-config/package.json` | 新增 | ts-config占位包声明 |
| `packages/ts-config/index.js` | 新增 | 空导出 |
| `packages/ts-config/README.md` | 新增 | 职责说明 |

#### 风险与回退

- **风险**：dev脚本从concurrently切换为python start.py，若start.py未就绪则dev不可用
- **回退**：保留`dev:api`/`dev:web`/`dev:worker`直接启动脚本作为降级路径

---

### 1.3.2 需求5.2 — Python共享包目录结构修复

**架构决策**：py_xxx/子目录结构已在上阶段创建并验证，本轮聚焦补齐缺失的业务模块源码和__init__.py导出。

#### 实现路径

**步骤1：py-auth补齐缺失模块**

当前仅有`jwt_handler.py`，需补充：

| 新增文件 | 职责 | 核心接口 |
|---------|------|---------|
| `py_auth/password.py` | bcrypt密码哈希与验证 | `hash_password(plain) → str`, `verify_password(plain, hashed) → bool` |
| `py_auth/rbac.py` | RBAC角色权限辅助函数 | `has_role(user, role) → bool`, `require_role(*roles) → Callable` |
| `py_auth/middleware.py` | 租户隔离与鉴权中间件 | `TenantIsolationMiddleware`, `require_auth`依赖 |

更新`py_auth/__init__.py`导出：`jwt_handler`, `password`, `rbac`

**步骤2：py-db补齐models定义**

当前`py_db/models/`仅有空`__init__.py`，需迁移api-server中的ORM模型：

- `py_db/models/user.py` — User, TenantUserRole等模型
- `py_db/models/tenant.py` — Tenant模型
- `py_db/models/notice.py` — Notice相关模型
- `py_db/models/student.py` — Student模型

更新`py_db/models/__init__.py`聚合导出所有模型类。
更新`py_db/__init__.py`导出`session`, `models`。

**步骤3：py-schemas补齐DTO定义**

当前仅有`base.py`，需补充：

- `py_schemas/auth.py` — LoginRequest, TokenResponse, UserInfo等
- `py_schemas/notice.py` — NoticeCreate, NoticeResponse等
- `py_schemas/tenant.py` — TenantCreate, TenantResponse等

更新`py_schemas/__init__.py`聚合导出。

**步骤4：py-ai-engine补齐parsers.py**

- `py_ai_engine/parsers.py` — 响应解析与格式化工具函数
  - `parse_llm_response(raw) → dict`
  - `extract_json_from_text(text) → dict`

**步骤5：py-messaging补齐napcat.py**

- `py_messaging/napcat.py` — NapCatQQ HTTP API封装
  - `NapCatClient`类，`send_group_message(group_id, message) → dict`

更新`py_messaging/__init__.py`导出`wxpusher`, `napcat`。

**步骤6：验证循环引用消除**

对py-schemas执行`python -c "from py_schemas import base"`和`python -c "from py_schemas.models import *"`（若存在models.py），确保无循环导入。

#### 文件变更清单

| 文件路径 | 变更类型 | 变更说明 |
|---------|---------|---------|
| `packages/py-auth/py_auth/password.py` | 新增 | bcrypt密码哈希与验证 |
| `packages/py-auth/py_auth/rbac.py` | 新增 | RBAC角色权限辅助函数 |
| `packages/py-auth/py_auth/middleware.py` | 新增 | 租户隔离与鉴权中间件 |
| `packages/py-auth/py_auth/__init__.py` | 修改 | 增加password/rbac导出 |
| `packages/py-db/py_db/models/user.py` | 新增 | User ORM模型 |
| `packages/py-db/py_db/models/tenant.py` | 新增 | Tenant ORM模型 |
| `packages/py-db/py_db/models/notice.py` | 新增 | Notice ORM模型 |
| `packages/py-db/py_db/models/student.py` | 新增 | Student ORM模型 |
| `packages/py-db/py_db/models/__init__.py` | 修改 | 聚合导出所有模型 |
| `packages/py-db/py_db/__init__.py` | 修改 | 增加models导出 |
| `packages/py-schemas/py_schemas/auth.py` | 新增 | 认证DTO |
| `packages/py-schemas/py_schemas/notice.py` | 新增 | 通知DTO |
| `packages/py-schemas/py_schemas/tenant.py` | 新增 | 租户DTO |
| `packages/py-schemas/py_schemas/__init__.py` | 修改 | 聚合导出 |
| `packages/py-ai-engine/py_ai_engine/parsers.py` | 新增 | 响应解析器 |
| `packages/py-ai-engine/py_ai_engine/__init__.py` | 修改 | 增加parsers导出 |
| `packages/py-messaging/py_messaging/napcat.py` | 新增 | NapCatQQ客户端 |
| `packages/py-messaging/py_messaging/__init__.py` | 修改 | 增加napcat导出 |

#### 风险与回退

- **风险1**：ORM模型从api-server迁移至py-db后，api-server的import路径需全部更新
- **回退1**：保留api-server/app/models/作为兼容层，re-export py_db.models
- **风险2**：py-schemas新增DTO可能与现有api-server/app/schemas/存在命名冲突
- **回退2**：采用渐进迁移策略，新代码优先使用py_schemas，旧代码保持不变

---

### 1.3.3 需求5.3 — 前后端API对接

**架构决策**：adminClient/h5Client已实现401/422拦截器和Cookie凭证传递，本轮聚焦补齐SSE流式响应和API路径映射规范化。

#### 实现路径

**步骤1：创建consultSSE流式响应客户端**

在`src/shared/api/`下新增`consultSSE.js`：

```javascript
// consultSSE.js — SSE流式响应客户端
// 核心接口：
// consultSSE(url, payload, callbacks) → AbortController
// callbacks: { onMessage, onTopic, onSources, onError, onDone }
// 内部实现：
// - 使用fetch API + ReadableStream解析SSE
// - AbortController支持用户主动中断
// - 处理所有SSE事件类型：message/topic/sources/source/error/done
// - 断连检测：ReadableStream提前结束且completed=false时触发onError
```

**步骤2：Vite代理配置增强**

当前`vite.config.js`已配置`/api`代理到`localhost:8000`，需补充：

- 增加WebSocket代理支持（HMR已内置，需确保SSE连接不被代理截断）
- 增加代理超时配置（SSE长连接需较长超时）

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    // SSE长连接需较长超时
    timeout: 300000,
  },
},
```

**步骤3：CORS配置完善**

当前`main.py`已实现CORS动态读取，需确认：
- `.env.example`中已声明`CORS_ORIGINS`变量
- CORS_ORIGINS默认值包含`http://localhost:5173`
- 禁止`allow_origins=["*"]`与`allow_credentials=True`同时使用（FastAPI已自动校验）

**步骤4：API路径映射审计**

对比前端`src/api/`模块与后端`app/api/v1/routes/`的路由注册：

| 前端模块 | 请求路径 | 后端路由prefix | 对齐状态 |
|---------|---------|---------------|---------|
| auth.js | /api/auth/* | /api/auth | ✅ 已对齐 |
| consult.js | /api/consult/* | 待创建 | ❌ 需后端补路由 |
| knowledge.js | /api/knowledge/* | 待创建 | ❌ 需后端补路由 |

**步骤5：adminClient 401拦截器去重**

当前401拦截器已实现`isRefreshing`标志位防止并发重复跳转，需确认：
- `isRefreshing`在跳转后正确重置为false
- `pendingRequests`队列正确清空

#### 文件变更清单

| 文件路径 | 变更类型 | 变更说明 |
|---------|---------|---------|
| `apps/web-client/src/shared/api/consultSSE.js` | 新增 | SSE流式响应客户端 |
| `apps/web-client/vite.config.js` | 修改 | 增加SSE代理超时配置 |
| `apps/api-server/app/main.py` | 修改 | 确认CORS配置不含通配符 |

#### 风险与回退

- **风险1**：SSE连接在Vite代理下可能被缓冲而非流式传输
- **回退1**：Vite代理配置增加`configure`回调禁用代理缓冲
- **风险2**：fetch API在部分旧浏览器不支持ReadableStream
- **回退2**：SSE客户端内降级为EventSource（仅支持GET请求）

---

### 1.3.4 需求5.4 — 统一启动脚本

**架构决策**：完全重写`scripts/start.py`，遵循启动脚本规范的"三阶段布局 + argparse CLI + 交互式菜单 + 跨平台进程管理"四项核心要求。

#### 实现路径

**步骤1：创建scripts/utils/process_utils.py**

封装跨平台进程管理逻辑：

```python
# process_utils.py — 跨平台进程生命周期管理
# 核心接口：
# launch_process(command, env, service_name) → subprocess.Popen
#   - Linux/macOS: os.setsid 创建新进程组
#   - Windows: CREATE_NEW_PROCESS_GROUP
# graceful_terminate(proc, timeout=10) → None
#   - Linux/macOS: os.killpg 发送SIGTERM给进程组
#   - Windows: taskkill /F /T /PID 递归终止进程树
# force_terminate(proc) → None
#   - 终极手段：proc.kill()
# is_process_alive(proc) → bool
```

**关键设计**：所有平台差异封装在此模块，业务脚本（start.py等）禁止包含`sys.platform`判断。

**步骤2：创建scripts/utils/log_utils.py**

封装控制台日志输出逻辑：

```python
# log_utils.py — 带颜色前缀的多进程日志输出
# 核心接口：
# print_colored(text, color) → None
#   - 检测sys.stdout.isatty()，不支持颜色时降级纯文本
#   - 颜色语义绑定：green=成功, yellow=警告, red=错误, cyan=信息
# print_stage_header(title) → None
#   - 输出三阶段分隔标题
# print_check_result(name, passed, detail="") → None
#   - 逐项输出前置检查结果（✔/✘ + 对齐 + 失败原因）
# print_service_log(service_name, message) → None
#   - 固定宽度服务名前缀对齐输出
# ANSI颜色码严禁硬编码，统一通过此模块输出
```

**步骤3：重写scripts/utils/check_utils.py**

当前仅有`validate_env`和`check_port`，需扩展：

```python
# check_utils.py — 前置检查工具
# 扩展接口：
# check_env_file() → (bool, str)         # .env文件存在性
# check_python_env() → (bool, str)        # Python/uv可执行性
# check_node_env() → (bool, str)          # Node/pnpm可执行性
# check_port(port, host) → (bool, str)    # 端口占用检查（已有，增强返回消息）
# check_mysql() → (bool, str)             # MySQL连通性Ping
# check_redis() → (bool, str)             # Redis连通性Ping
# run_preflight_checks(services) → bool   # 执行全量前置检查
```

**步骤4：重写scripts/start.py**

采用三阶段布局 + argparse + 交互式菜单：

```python
# start.py — 统一启动脚本
# 执行流程：
# 1. argparse解析 --services / --env-file 参数
# 2. 无参数时进入交互式菜单（选择api/worker/web组合）
# 3. 阶段一：前置检查（逐项实时打印，强依赖失败立即中止）
# 4. 阶段二：服务启动（逐个拉起子进程，打印PID）
# 5. 阶段三：运行中（子进程stdout/stderr重定向+前缀着色）
# 6. 信号处理：Ctrl+C → 优雅终止所有子进程 → 退出阶段输出

# argparse参数设计：
# --services: 逗号分隔的服务组合，可选值 api/worker/web
# --env-file: 环境文件路径，默认.env
# 无参数: 进入交互式菜单
```

**步骤5：更新scripts/start_api.py, start_worker.py, start_web.py**

将各子启动脚本改为调用`start.py --services xxx`的快捷方式。

#### 文件变更清单

| 文件路径 | 变更类型 | 变更说明 |
|---------|---------|---------|
| `scripts/utils/process_utils.py` | 新增 | 跨平台进程管理封装 |
| `scripts/utils/log_utils.py` | 新增 | 颜色日志+三阶段布局 |
| `scripts/utils/check_utils.py` | 重写 | 扩展前置检查（DB/Redis连通性） |
| `scripts/utils/__init__.py` | 修改 | 导出新增工具模块 |
| `scripts/start.py` | 重写 | argparse+三阶段+交互菜单+信号处理 |
| `scripts/start_api.py` | 修改 | 改为调用start.py --services api |
| `scripts/start_worker.py` | 修改 | 改为调用start.py --services worker |
| `scripts/start_web.py` | 修改 | 改为调用start.py --services web |

#### 风险与回退

- **风险1**：Windows下os.setsig不适用，进程组管理需taskkill递归终止
- **回退1**：process_utils.py中Windows分支使用`subprocess.call("taskkill /F /T /PID ...")`
- **风险2**：交互式菜单在CI/CD管道中不可用（stdin非TTY）
- **回退2**：CI环境检测`sys.stdin.isatty()`，非TTY时要求--services参数
- **风险3**：子进程stdout/stderr合并输出可能导致日志交错
- **回退3**：各子服务日志重定向至独立文件（logs/api.log等），控制台仅展示带前缀的关键日志

---

### 1.3.5 需求5.5 — py-logger增强

**架构决策**：在现有py-logger骨架上增强events.py事件命名规范、context.py trace_id自动注入、middleware request_received事件。

#### 实现路径

**步骤1：补齐events.py事件名常量**

当前events.py缺少`*_succeeded/*_failed`配对和部分模块事件，按日志规范补充：

```python
# 需补充的事件名（对齐规范/智院灵枢(SAP)-日志规范.md 第6节）：

# 认证与会话（补齐配对）
AUTH_LOGOUT_FAILED = "auth_logout_failed"
AUTH_BOOTSTRAP_SUPER_ADMIN_EXISTS = "auth_bootstrap_super_admin_exists"
AUTH_BOOTSTRAP_SUPER_ADMIN_CREATED = "auth_bootstrap_super_admin_created"
AUTH_BOOTSTRAP_SUPER_ADMIN_FAILED = "auth_bootstrap_super_admin_failed"
AUTH_TOKEN_USER_EXTRACT_FAILED = "auth_token_user_extract_failed"

# 鉴权依赖
AUTH_RESOLVE_USER_FAILED = "auth_resolve_user_failed"
AUTH_ROLE_CHECK_FAILED = "auth_role_check_failed"
AUTH_TENANT_CONTEXT_FAILED = "auth_tenant_context_failed"

# 用户管理（补齐配对）
USER_CREATE_FAILED = "user_create_failed"
USER_CREATE_SUCCEEDED = "user_create_succeeded"
USER_GET_ME_FAILED = "user_get_me_failed"

# 学生验证（补齐配对）
STUDENT_VERIFY_FAILED = "student_verify_failed"
STUDENT_VERIFY_SUCCEEDED = "student_verify_succeeded"

# Token与密码处理
TOKEN_DECODE_FAILED = "token_decode_failed"
TOKEN_DECODE_INVALID_TYPE = "token_decode_invalid_type"
PASSWORD_HASH_FALLBACK_USED = "password_hash_fallback_used"
PASSWORD_VERIFY_FAILED = "password_verify_failed"

# 请求日志
REQUEST_RECEIVED = "request_received"
REQUEST_COMPLETED = "request_completed"
```

**步骤2：增强context.py — trace_id自动注入structlog上下文**

当前`set_trace_id`仅设置ContextVar，未注入structlog contextvars。需修改：

```python
# context.py增强
import contextvars
import structlog

trace_id: contextvars.ContextVar[str] = contextvars.ContextVar("trace_id", default="")

def set_trace_id(tid: str) -> None:
    """设置trace_id并自动注入structlog上下文"""
    trace_id.set(tid)
    structlog.contextvars.bind_contextvars(trace_id=tid)

def get_trace_id() -> str:
    return trace_id.get("")

def clear_trace_id() -> None:
    """清除trace_id上下文"""
    trace_id.set("")
    structlog.contextvars.unbind_contextvars("trace_id")
```

**步骤3：增强fastapi_middleware.py — 添加request_received事件**

当前middleware仅记录`request_completed`，需补充`request_received`：

```python
# 在dispatch方法中，call_next之前添加：
logger.info(
    "request_received",
    method=request.method,
    path=request.url.path,
    trace_id=trace,
)
```

**步骤4：增强core.py — JSON Renderer配置选项**

为生产环境提供JSON格式输出能力：

```python
# core.py增强
def configure_logging(level: str = "INFO", json_format: bool = False) -> None:
    # json_format=True时使用structlog.processors.JSONRenderer()
    # json_format=False时使用structlog.dev.ConsoleRenderer()
```

#### 文件变更清单

| 文件路径 | 变更类型 | 变更说明 |
|---------|---------|---------|
| `packages/py-logger/py_logger/events.py` | 修改 | 补齐*_succeeded/*_failed配对，补齐鉴权/用户/学生/请求事件 |
| `packages/py-logger/py_logger/context.py` | 修改 | set_trace_id自动bind_contextvars，新增clear_trace_id |
| `packages/py-logger/py_logger/middlewares/fastapi_middleware.py` | 修改 | 增加request_received事件日志 |
| `packages/py-logger/py_logger/core.py` | 修改 | 增加json_format参数 |

#### 风险与回退

- **风险1**：structlog.contextvars.bind_contextvars需要structlog配置中包含merge_contextvars处理器
- **回退1**：core.py的configure_logging已包含merge_contextvars，确认无误
- **风险2**：中间件日志在高并发下可能增加约1ms延迟
- **回退2**：P95响应时间300ms红线内，无需调整；若超限可通过环境变量开关中间件

---

### 1.3.6 需求5.6 — 注释与代码规范

**架构决策**：在现有Ruff基础配置上增强规则集，集成Husky+Commitlint实现提交拦截。

#### 实现路径

**步骤1：增强Ruff配置**

在根`pyproject.toml`的`[tool.ruff.lint]`中扩展规则：

```toml
[tool.ruff.lint]
select = [
    "E",      # pycodestyle errors
    "F",      # pyflakes
    "W",      # pycodestyle warnings
    "I",      # isort（导入排序）
    "UP",     # pyupgrade
    "B",      # flake8-bugbear（常见Bug检测）
    "SIM",    # flake8-simplify
    "D",      # pydocstyle（强制Docstring）
    "ANN",    # flake8-annotations（类型注解）
]
ignore = ["D100", "D104"]  # 允许模块级和包级缺docstring

[tool.ruff.lint.pydocstyle]
convention = "google"  # Google Style Docstring
```

**步骤2：集成Husky + Commitlint**

当前`commitlint.config.js`已存在，需添加Husky Git Hooks：

```bash
# 安装Husky
pnpm add -D husky
pnpm exec husky init

# 配置pre-commit hook
echo "ruff check ." > .husky/pre-commit

# 配置commit-msg hook
echo "pnpm exec commitlint --edit \$1" > .husky/commit-msg
```

更新`package.json`增加Husky配置段。

**步骤3：添加ESLint jsdoc插件**

在web-client中配置eslint-plugin-jsdoc检查TSDoc完整性：

```bash
cd apps/web-client && pnpm add -D eslint-plugin-jsdoc
```

#### 文件变更清单

| 文件路径 | 变更类型 | 变更说明 |
|---------|---------|---------|
| `pyproject.toml` | 修改 | Ruff规则集扩展：+D/ANN/B，pydocstyle=google |
| `package.json` | 修改 | 增加Husky依赖和prepare脚本 |
| `.husky/pre-commit` | 新增 | ruff check前置检查 |
| `.husky/commit-msg` | 新增 | commitlint提交信息校验 |
| `apps/web-client/package.json` | 修改 | 增加eslint-plugin-jsdoc依赖 |

#### 风险与回退

- **风险1**：Ruff D规则可能导致存量代码大量报错
- **回退1**：采用渐进策略，先配置`ignore`豁免存量问题，新代码严格执行
- **风险2**：Husky在Windows下可能需要额外配置
- **回退2**：Husky v9+已原生支持Windows，确认版本>=9

---

### 1.3.7 需求5.7 — 项目清理

**架构决策**：清理散落文件、更新.gitignore、整合docs目录，保留规范/目录不变。

#### 实现路径

**步骤1：更新.gitignore**

补充缺失的忽略规则：

```gitignore
# 新增忽略规则
uv.lock                    # uv lock文件
.venv/                     # uv虚拟环境
.uv/                       # uv缓存
.aux/                      # Aux缓存
*.egg-info/                # 已有但需确认
.mypy_cache/               # mypy缓存
.ruff_cache/               # ruff缓存
```

**步骤2：创建docs/目录并整合文档**

```
docs/
├── architecture.md        # 架构设计文档（从规范/或其他位置整合）
├── api.md                 # API接口文档
└── deployment.md          # 部署指南
```

**步骤3：删除冗余文件**

- `requirements.txt`（已迁移至uv workspace，pyproject.toml管理依赖）
- 散落的`.github/agents/`下agent配置（如存在）

**步骤4：确认保留项**

- `规范/`目录下四份规范文件保留
- `.env.example`保留
- `docker-compose.yml`保留
- `data/`目录保留（含样例数据）

#### 文件变更清单

| 文件路径 | 变更类型 | 变更说明 |
|---------|---------|---------|
| `.gitignore` | 修改 | 补充uv.lock/.venv/.uv/.mypy_cache/.ruff_cache等规则 |
| `docs/` | 新增 | 创建docs目录，整合架构/API/部署文档 |
| `requirements.txt` | 删除 | 已迁移至uv workspace管理 |

#### 风险与回退

- **风险1**：删除requirements.txt可能导致依赖手动pip安装的场景不可用
- **回退1**：通过`uv export > requirements.txt`可随时生成等效文件
- **风险2**：docs整合可能遗漏某些文档
- **回退2**：清理前git commit确保可恢复

---

### 1.3.8 需求5.8 — README优化

**架构决策**：完全重写README.md，包含徽章、目录、架构图、API端点表、环境变量表、贡献指南。

#### 实现路径

**README.md结构设计**：

```markdown
# Young Hearts Agent Platform
[徽章: Python版本 | React版本 | License | Build Status]

## 目录
- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [架构概览](#架构概览)
- [快速启动](#快速启动)
- [项目结构](#项目结构)
- [API端点速查](#api端点速查)
- [环境变量配置](#环境变量配置)
- [开发指南](#开发指南)
- [贡献指南](#贡献指南)

## 项目概述
心青年智能体平台 - ...

## 架构概览
[Mermaid C4图: web-client → api-server → ai-worker → packages → 外部依赖]

## API端点速查
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/refresh | Token刷新 |
| GET  | /api/auth/me | 获取当前用户 |
| GET  | /health | 健康检查 |
| ...  | ...  | ...  |

## 环境变量配置
| 变量名 | 类型 | 默认值 | 必填 | 说明 |
|--------|------|--------|------|------|
| VITE_API_BASE_URL | string | http://localhost:8000/api/v1 | 是 | 前端API基础路径 |
| SECRET_KEY | string | - | 是 | JWT签名密钥 |
| CORS_ORIGINS | string | http://localhost:5173 | 否 | CORS允许源列表 |
| DATABASE_URL | string | sqlite:///./dev.db | 否 | 数据库连接串 |
| REDIS_URL | string | redis://localhost:6379/0 | 否 | Redis连接串 |
| ... | ... | ... | ... | ... |

## 贡献指南
1. Fork → Branch → PR
2. 遵循Conventional Commits格式
3. 代码需通过Ruff/ESLint检查
4. 新增功能需包含测试
```

#### 文件变更清单

| 文件路径 | 变更类型 | 变更说明 |
|---------|---------|---------|
| `README.md` | 重写 | 完整README：徽章+目录+架构图+API表+环境变量表+贡献指南 |

#### 风险与回退

- **风险1**：Mermaid架构图语法在GitHub上可能渲染失败
- **回退1**：先在GitHub Markdown预览中验证Mermaid语法正确性
- **风险2**：API端点表可能随代码变更而不同步
- **回退2**：在贡献指南中要求新增API时同步更新README

---

# **2. 接口设计**

## **2.1 总体设计**

本项目的接口设计分为三个层次：

1. **共享包公共接口**：Python包通过`__init__.py`导出的核心API，TypeScript包通过index.ts导出
2. **启动脚本CLI接口**：argparse命令行参数 + 交互式菜单
3. **前后端HTTP接口**：FastAPI路由 + Axios客户端 + SSE流式响应

所有接口遵循以下原则：
- 类型安全：Python全面类型注解，TypeScript禁止any
- 命名一致：Python snake_case，TypeScript camelCase，事件名小写下划线
- 版本化：API路径从/api/v1起步

## **2.2 接口清单**

### 2.2.1 共享包公共接口

| 包名 | 导出项 | 类型签名 |
|------|--------|---------|
| py-config | `settings` | `Settings (BaseSettings实例)` |
| py-db | `get_session` | `() → Generator[Session]` |
| py-db | `models` | `{User, Tenant, Notice, Student, ...}` |
| py-schemas | `base`, `auth`, `notice`, `tenant` | `Pydantic BaseModel子类` |
| py-auth | `jwt_handler`, `password`, `rbac` | `模块引用` |
| py-auth | `hash_password`, `verify_password` | `(str) → str / (str, str) → bool` |
| py-auth | `has_role`, `require_role` | `(User, Role) → bool / (*Role) → Callable` |
| py-ai-engine | `llm_client`, `parsers` | `模块引用` |
| py-ai-engine | `parse_llm_response` | `(str) → dict` |
| py-logger | `get_logger`, `configure_logging` | `(str) → BoundLogger / (str, bool) → None` |
| py-logger | `set_trace_id`, `get_trace_id`, `clear_trace_id` | `(str) → None / () → str / () → None` |
| py-logger | `events` | `事件名常量模块` |
| py-messaging | `wxpusher`, `napcat` | `模块引用` |
| ts-shared | `enums`, `types` | `TypeScript导出` |

### 2.2.2 启动脚本CLI接口

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--services` | str | 无（进入交互式菜单） | 逗号分隔的服务组合：api,worker,web |
| `--env-file` | str | `.env` | 环境变量文件路径 |

交互式菜单选项：
- `[1] API Server` — 启动api-server
- `[2] AI Worker` — 启动ai-worker
- `[3] Web Client` — 启动web-client
- `[4] All` — 启动所有服务
- `[q] Quit` — 退出

### 2.2.3 前端API客户端接口

| 客户端 | 创建方式 | 拦截器 | 用途 |
|--------|---------|--------|------|
| adminClient | `axios.create({baseURL: '/api', withCredentials: true})` | 请求: X-Tenant-ID注入; 响应: 401跳转登录+422校验错误映射 | B端管理后台 |
| h5Client | `axios.create({baseURL: '/api', withCredentials: true})` | 请求: X-Student-Token注入; 响应: 401跳转验证页 | C端H5页面 |
| consultSSE | `fetch + ReadableStream` | AbortController中断支持 | SSE流式对话 |

### 2.2.4 SSE流式响应接口

```typescript
// consultSSE函数签名
function consultSSE(
  url: string,
  payload: Record<string, unknown>,
  callbacks: {
    onMessage?: (content: string) => void,
    onTopic?: (topic: string) => void,
    onSources?: (sources: Source[]) => void,
    onError?: (error: string) => void,
    onDone?: () => void,
  }
): AbortController

// SSE事件类型
type SSEEventType = 'message' | 'topic' | 'sources' | 'source' | 'error' | 'done'
```

### 2.2.5 py-logger增强接口

| 模块 | 接口 | 签名 | 说明 |
|------|------|------|------|
| events.py | `REQUEST_RECEIVED` | `str` | 请求入口事件常量 |
| events.py | `REQUEST_COMPLETED` | `str` | 请求出口事件常量 |
| events.py | `AUTH_*`, `USER_*`, `STUDENT_*` | `str` | 补齐配对事件常量 |
| context.py | `set_trace_id(tid)` | `(str) → None` | 设置trace_id并自动注入structlog上下文 |
| context.py | `clear_trace_id()` | `() → None` | 清除trace_id上下文 |
| core.py | `configure_logging(level, json_format)` | `(str, bool) → None` | 增加json_format参数 |

---

# **4. 数据模型**

## **4.1 设计目标**

数据模型设计服务于三个目标：
1. **共享包间依赖关系清晰**：py-config无依赖 → py-logger依赖py-config → py-db依赖py-config → py-auth依赖py-config+py-db → py-schemas依赖base → py-ai-engine依赖py-config → py-messaging依赖py-config
2. **前后端类型契约一致**：py-schemas定义的DTO字段与ts-shared定义的TypeScript类型保持命名和结构对应
3. **日志事件可枚举**：所有事件名定义在events.py常量中，reason使用snake_case机器码

## **4.2 模型实现**

### 4.2.1 共享包依赖拓扑

```text
py-config (无依赖)
    │
    ├── py-logger (依赖: py-config)
    ├── py-db (依赖: py-config)
    ├── py-ai-engine (依赖: py-config)
    ├── py-messaging (依赖: py-config)
    │
    ├── py-auth (依赖: py-config, py-db)
    │
    └── py-schemas (依赖: base.py自引用)

api-server (依赖: py-config, py-db, py-schemas, py-auth, py-logger, py-ai-engine)
ai-worker (依赖: py-config, py-db, py-ai-engine, py-messaging, py-logger)
```

### 4.2.2 日志事件模型

```python
# 事件名格式: {模块}_{动作}_{结果}
# 模块前缀: auth_ / user_ / student_ / notice_ / tenant_ / task_ / ai_ / message_ / request_
# 结果后缀: _succeeded / _failed

# 日志输出格式（结构化键值）:
logger.info(
    "auth_login_succeeded",     # 事件名（events.py常量）
    user_id=user.id,            # 业务上下文
    tenant_id=user.tenant_id,   # 租户隔离
    role=user.role.value,       # 角色
    trace_id=trace,             # 分布式追踪
)

# 请求日志中间件输出:
# 入口: info("request_received", method=POST, path=/api/auth/login, trace_id=xxx)
# 出口: info("request_completed", method=POST, path=/api/auth/login, status=200, elapsed_ms=50.23, trace_id=xxx)
```

### 4.2.3 启动脚本配置模型

```python
# 前置检查项模型
@dataclass
class CheckItem:
    name: str                    # 检查项名称（如"数据库连接"）
    check_fn: Callable           # 检查函数，返回(bool, str)
    is_strong_dep: bool = True   # True=强依赖(失败中止)，False=弱依赖(失败警告)

# 服务定义模型
@dataclass
class ServiceConfig:
    name: str                    # 服务标识（api/worker/web）
    display_name: str            # 显示名称（API服务/AI Worker/Web服务）
    command: str                 # 启动命令
    port: Optional[int] = None   # 绑定端口（用于前置检查）
    log_prefix: str              # 日志前缀（[API   ]）
    log_color: str               # 日志颜色（green/red/yellow/cyan）

# 颜色语义映射
COLOR_MAP = {
    "green": "成功/就绪",
    "yellow": "警告/等待",
    "red": "错误/失败",
    "cyan": "信息/提示",
}
```

---

# **5. 依赖关系与执行顺序**

## **5.1 实现阶段依赖图**

```text
阶段1 (P0-基础配置) ──────────────────────────────────────
  [5.1] Monorepo工作区配置
    └── 依赖: 无
    └── 产出: package.json脚本 + ts-config包

  [5.2] Python共享包目录结构修复
    └── 依赖: 无（独立于5.1）
    └── 产出: 补齐py-auth/py-db/py-schemas/py-ai-engine/py-messaging模块

  [5.3] 前后端API对接
    └── 依赖: 5.2（py-schemas DTO需先就位）
    └── 产出: consultSSE + Vite增强 + CORS完善

阶段2 (P1-工程增强) ──────────────────────────────────────
  [5.4] 统一启动脚本
    └── 依赖: 5.1（dev脚本需调用start.py）
    └── 产出: start.py重写 + utils三件套

  [5.5] py-logger增强
    └── 依赖: 无（独立于5.4）
    └── 产出: events补齐 + context注入 + middleware增强

阶段3 (P2-规范与清理) ────────────────────────────────────
  [5.6] 注释与代码规范
    └── 依赖: 5.5（Ruff配置需先就位）
    └── 产出: Ruff增强 + Husky + Commitlint

  [5.7] 项目清理
    └── 依赖: 5.6（清理前需确保Lint工具链可用）
    └── 产出: .gitignore + docs整合 + 冗余文件删除

  [5.8] README优化
    └── 依赖: 5.7（清理后目录结构确定再写README）
    └── 产出: README.md重写
```

## **5.2 推荐执行顺序**

| 执行序号 | 需求编号 | 任务描述 | 预计工时 |
|---------|---------|---------|---------|
| 1 | 5.1 | 补齐根package.json脚本 + 创建ts-config包 | 0.5h |
| 2 | 5.2 | 补齐Python共享包缺失模块（py-auth/py-db/py-schemas/py-ai-engine/py-messaging） | 2h |
| 3 | 5.3 | 创建consultSSE + Vite增强 + CORS完善 + API路径审计 | 1.5h |
| 4 | 5.4 | 重写start.py + 创建process_utils/log_utils + 增强check_utils | 3h |
| 5 | 5.5 | 补齐events.py + 增强context.py + 增强middleware | 1h |
| 6 | 5.6 | 增强Ruff配置 + 集成Husky+Commitlint + ESLint jsdoc | 1h |
| 7 | 5.7 | 更新.gitignore + 创建docs/ + 清理冗余文件 | 1h |
| 8 | 5.8 | 重写README.md | 1.5h |

**总预计工时**：11.5h

---

# **6. 风险点与回退策略汇总**

| 风险编号 | 所属需求 | 风险描述 | 影响等级 | 回退策略 |
|---------|---------|---------|---------|---------|
| R1 | 5.1 | dev脚本切换至start.py后启动不可用 | 高 | 保留dev:api/dev:web/dev:worker直接启动脚本作为降级 |
| R2 | 5.2 | ORM模型迁移后api-server import路径全部失效 | 高 | 保留api-server/app/models/作为re-export兼容层 |
| R3 | 5.2 | py-schemas循环引用未彻底消除 | 中 | base.py仅定义纯基类，不引用任何子模块 |
| R4 | 5.3 | SSE在Vite代理下被缓冲而非流式传输 | 中 | Vite proxy configure回调禁用缓冲 |
| R5 | 5.3 | fetch ReadableStream在旧浏览器不支持 | 低 | 降级为EventSource（仅GET） |
| R6 | 5.4 | Windows进程组管理不完整导致僵尸进程 | 高 | taskkill /F /T /PID递归终止 |
| R7 | 5.4 | 交互式菜单在CI/CD非TTY环境不可用 | 中 | 检测stdin.isatty()，非TTY要求--services参数 |
| R8 | 5.5 | structlog contextvars未包含merge_contextvars处理器 | 低 | core.py已包含，验证即可 |
| R9 | 5.6 | Ruff D规则导致存量代码大量报错 | 中 | 渐进策略：ignore豁免存量，新代码严格执行 |
| R10 | 5.7 | 删除requirements.txt后手动pip安装不可用 | 低 | `uv export > requirements.txt`可随时生成 |
| R11 | 5.8 | Mermaid架构图GitHub渲染失败 | 低 | 先在预览中验证语法 |

---

# **7. 验收标准映射**

| 需求编号 | 关键验收条件 | 验证命令 |
|---------|-------------|---------|
| 5.1 | uv sync --all-packages成功 + pnpm install成功 | `uv sync --all-packages && pnpm install` |
| 5.1 | 根脚本dev启动所有服务 | `npm run dev` |
| 5.2 | 所有共享包pip install -e成功 | `pip install -e packages/py-config && from py_config import settings` |
| 5.2 | py-schemas无循环导入 | `python -c "from py_schemas import base"` |
| 5.3 | Vite代理转发API请求 | 浏览器访问localhost:5173，API请求到达localhost:8000 |
| 5.3 | SSE流式响应渐进展示 | 前端对话界面内容实时增长 |
| 5.3 | 401拦截器仅跳转一次 | 并发401响应后仅一次登录页跳转 |
| 5.4 | 三阶段控制台布局 | `python scripts/start.py --services api` 观察输出 |
| 5.4 | 前置检查失败中止启动 | 停止Redis后执行start.py，确认中止 |
| 5.4 | Ctrl+C安全终止所有进程 | 启动后Ctrl+C，确认无僵尸进程 |
| 5.5 | trace_id自动注入日志 | 请求后日志包含trace_id字段 |
| 5.5 | request_received事件输出 | 请求入口日志包含request_received事件 |
| 5.6 | Ruff检查报告不规范代码 | `ruff check apps/api-server/` |
| 5.6 | Commitlint拦截不合规提交 | `git commit -m "fix bug"` 被拦截 |
| 5.7 | .gitignore覆盖uv.lock等 | `git status` 不显示uv.lock |
| 5.8 | README包含徽章+架构图+API表 | 检查README.md内容完整性 |
