# **1. 实现模型**

## **1.1 上下文视图**

### 1.1.1 系统上下文图

```plantuml
@startuml
skinparam componentStyle rectangle

rectangle "智院灵枢(SAP) 平台" as platform {
    rectangle "前端应用层" as frontend {
        [web-client\nReact 18 + Vite + TS]
    }
    rectangle "后端应用层" as backend {
        [api-server\nFastAPI 网关]
        [ai-worker\nCelery Worker]
    }
    rectangle "共享能力层" as packages {
        [py-config] as cfg
        [py-db] as db
        [py-schemas] as sch
        [py-auth] as auth
        [py-logger] as log
        [py-ai-engine] as ai
        [py-messaging] as msg
        [ts-shared] as ts
        [ts-config] as tscfg
    }
    rectangle "工程支撑层" as infra {
        [scripts/start.py\n统一启动脚本]
        [scripts/utils/\n工具模块]
    }
}

actor "平台开发者" as dev
actor "运维人员" as ops

rectangle "外部依赖" as external {
    rectangle "DashScope\n(Qwen-VL-Max)" as dashscope
    rectangle "Milvus" as milvus
    rectangle "MySQL 8.4" as mysql
    rectangle "Redis 7" as redis
    rectangle "WxPusher" as wxpusher
    rectangle "NapCatQQ" as napcat
}

dev --> platform : 开发/构建/测试
ops --> platform : Docker编排/环境管理

frontend --> backend : API请求(HTTP/SSE)
frontend ..> ts : 共享类型/枚举
backend ..> packages : 共享配置/DB/认证/日志/DTO
backend --> dashscope : 大模型API
backend --> mysql : 数据持久化
backend --> redis : 缓存/会话/任务投递
backend ..> ai : AI引擎(间接)
backend ..> msg : 消息推送(间接)

infra --> frontend : 启动/管理
infra --> backend : 启动/管理

@enduml
```

### 1.1.2 架构决策记录（ADR）

| ADR编号 | 决策标题 | 决策内容 | 理由 |
|---------|---------|---------|------|
| ADR-01 | 双工作空间策略 | Python使用uv workspace（pyproject.toml），前端使用pnpm workspace（pnpm-workspace.yaml） | Python与Node.js生态差异显著，各自使用原生工作区工具可最大化依赖解析效率和工具链兼容性 |
| ADR-02 | Cookie认证优先于Bearer Token | 前后端认证统一使用HTTP Cookie传递会话标识 | 浏览器自动管理Cookie生命周期，减少前端Token管理复杂度；配合SameSite属性可防御CSRF |
| ADR-03 | Vite代理解决开发跨域 | 开发环境通过Vite server.proxy转发API请求，不依赖后端CORS宽放 | 代理方式零配置、零心智负担，生产环境切换为Nginx反向代理，开发与生产行为一致 |
| ADR-04 | Python共享包pip-install-e引用 | 替代sys.path.append临时方案，通过uv workspace的可编辑模式安装共享包 | 可编辑安装提供正确的依赖解析、IDE自动补全和类型检查，sys.path.append仅作为降级兼容保留 |
| ADR-05 | 启动脚本Python统一实现 | 统一启动脚本使用Python实现（scripts/start.py），不使用shell/node | Python跨平台兼容性优于shell，且项目已有Python运行时，避免引入额外依赖 |
| ADR-06 | py-schemas统一DTO隔离ORM | API响应必须使用py-schemas定义的DTO，禁止直接返回ORM模型 | 隔离数据库内部结构与API契约，防止敏感字段泄漏，支持前后端字段命名约定共享 |
| ADR-07 | Feature-Based前端聚合 | 前端按业务功能聚合于features/目录，每个feature内部自治 | 降低模块耦合，便于功能级增删，避免pages/扁平结构导致的公共逻辑散落 |

## **1.2 服务/组件总体架构**

### 1.2.1 Monorepo双工作空间架构

```plantuml
@startuml
skinparam componentStyle rectangle

rectangle "根项目 (Young-Hearts-Agent-Platform)" as root {
    rectangle "uv workspace\n(pyproject.toml)" as uvws {
        rectangle "apps/" as apps_py {
            [api-server\n(FastAPI)] as api
            [ai-worker\n(Celery)] as worker
        }
        rectangle "packages/ (Python)" as pkgs_py {
            [py-config] as pycfg
            [py-db] as pydb
            [py-schemas] as pysch
            [py-auth] as pyauth
            [py-logger] as pylog
            [py-ai-engine] as pyai
            [py-messaging] as pymsg
        }
    }
    rectangle "pnpm workspace\n(pnpm-workspace.yaml)" as pnpmws {
        rectangle "apps/" as apps_ts {
            [web-client\n(React+Vite)] as web
        }
        rectangle "packages/ (TypeScript)" as pkgs_ts {
            [ts-shared] as tsshared
            [ts-config\n(占位)] as tsconfig
        }
    }
    rectangle "工程支撑" as eng {
        [scripts/\n启动脚本] as scripts
        [infrastructure/\n部署配置] as infra
    }
}

api ..> pycfg : 可编辑安装
api ..> pydb : 可编辑安装
api ..> pysch : 可编辑安装
api ..> pyauth : 可编辑安装
api ..> pylog : 可编辑安装
worker ..> pyai : 可编辑安装
worker ..> pymsg : 可编辑安装
worker ..> pydb : 可编辑安装
worker ..> pycfg : 可编辑安装
web ..> tsshared : workspace:*

@enduml
```

### 1.2.2 前后端数据流架构

```plantuml
@startuml
skinparam componentStyle rectangle

rectangle "浏览器" as browser {
    [React 页面] as page
    [Zustand Store] as store
    [API SDK\n(src/shared/api/)] as sdk
}

rectangle "Vite Dev Server\n(port 5173)" as vite {
    [server.proxy\n/v1 → :8000] as proxy
}

rectangle "FastAPI\n(port 8000)" as fastapi {
    [CORSMiddleware] as cors
    [Router层\n(app/api/v1/)] as router
    [Service层\n(app/services/)] as service
    [Repository层\n(app/repositories/)] as repo
    [Dependencies\n(app/dependencies/)] as deps
}

rectangle "数据层" as data {
    [(MySQL 8.4)] as mysql
    [(Redis 7)] as redis
}

page --> sdk : 调用API函数
sdk --> proxy : HTTP请求\n(credentials: include)
proxy --> cors : 转发至:8000
cors --> router : 路由分发
router --> deps : 注入DB Session/用户/租户
router --> service : 调用业务逻辑
service --> repo : 数据访问
repo --> mysql : ORM查询
service --> redis : 缓存/任务投递

@enduml
```

### 1.2.3 SSE流式响应架构

```plantuml
@startuml
skinparam componentStyle rectangle

rectangle "前端" as fe {
    [对话页面] as chat
    [chatSSE函数\n(AbortController)] as sse_fn
}

rectangle "Vite代理" as proxy

rectangle "后端" as be {
    [Router\n/api/consult/chat] as route
    [Service\n(流式生成)] as svc
}

rectangle "豆包AI\n(Qwen-VL-Max)" as ai

chat --> sse_fn : 发起SSE请求
sse_fn --> proxy : POST + AbortController
proxy --> route : 转发
route --> svc : 调用流式生成
svc --> ai : 流式API调用
ai --> svc : 逐段返回content
svc --> route : SSE event:message
svc --> route : SSE event:topic
svc --> route : SSE event:sources
svc --> route : SSE event:done
route --> proxy : SSE流
proxy --> sse_fn : SSE流
sse_fn --> chat : onMessage/onComplete

@enduml
```

### 1.2.4 统一启动脚本架构

```plantuml
@startuml
skinparam componentStyle rectangle

rectangle "scripts/start.py\n(CLI入口)" as cli {
    [argparse\n参数解析] as args
    [交互式菜单] as menu
}

rectangle "scripts/utils/" as utils {
    [check_utils.py\n前置检查] as check
    [process_utils.py\n进程管理] as proc
    [log_utils.py\n日志输出] as log
}

rectangle "子启动脚本" as starters {
    [start_api.py] as start_api
    [start_worker.py] as start_worker
    [start_web.py] as start_web
}

rectangle "服务进程" as procs {
    [api-server\n(PID:xxx)] as api_proc
    [ai-worker\n(PID:xxx)] as worker_proc
    [web-client\n(PID:xxx)] as web_proc
}

cli --> args : --services api,worker,web
cli --> menu : 无参数时展示
cli --> check : 阶段一：前置检查
check --> log : ✔/✘ 逐项输出
cli --> proc : 阶段二：启动进程
proc --> start_api : 拉起API
proc --> start_worker : 拉起Worker
proc --> start_web : 拉起Web
start_api --> api_proc : 子进程
start_worker --> worker_proc : 子进程
start_web --> web_proc : 子进程
cli --> log : 阶段三：运行中日志

@enduml
```

## **1.3 实现设计文档**

### 1.3.1 单体仓库结构优化

#### 1.3.1.1 目标目录结构（完整目录树）

```text
Young-Hearts-Agent-Platform/
├─ apps/                                        # 可执行应用层
│  ├─ web-client/                               # React 18 + Vite 前端（B端后台 + C端H5）
│  │  ├─ src/
│  │  │  ├─ app/                                # 页面级入口组件
│  │  │  │  ├─ admin/                           # B端管理后台页面
│  │  │  │  ├─ auth/                            # 认证相关页面
│  │  │  │  ├─ h5/                              # C端H5页面
│  │  │  │  ├─ headless/                        # 无头逻辑页面
│  │  │  │  └─ landing/                         # 落地页与引导页
│  │  │  ├─ components/                         # 全局通用UI组件
│  │  │  ├─ features/                           # Feature-Based业务聚合
│  │  │  │  ├─ auth/                            # 认证：登录、会话、租户上下文
│  │  │  │  ├─ notice/                          # 通知引擎：解析、发布、催收
│  │  │  │  ├─ member/                          # 成员管理
│  │  │  │  ├─ student/                         # 学生端：验证、WxPusher绑定
│  │  │  │  ├─ tenant/                          # 租户管理
│  │  │  │  ├─ activity/                        # 活动大厅（P1预留）
│  │  │  │  ├─ knowledge/                       # 知识库与RAG（P1预留）
│  │  │  │  └─ agent/                           # Agent助理（P2预留）
│  │  │  ├─ hooks/                              # 全局通用Hooks
│  │  │  ├─ layouts/                            # 页面布局壳
│  │  │  ├─ shared/                             # 跨功能复用基础设施
│  │  │  │  ├─ api/                             # API客户端封装
│  │  │  │  │  ├─ adminClient.ts                # B端Axios实例（JWT注入、401刷新）
│  │  │  │  │  └─ h5Client.ts                   # C端Axios实例（学生凭证注入）
│  │  │  │  └─ store/                           # Zustand全局状态
│  │  │  ├─ styles/                             # 全局样式
│  │  │  ├─ assets/                             # 静态资源
│  │  │  └─ test/                               # Vitest测试
│  │  ├─ public/
│  │  ├─ package.json
│  │  ├─ vite.config.ts                         # Vite配置（含代理）
│  │  └─ tsconfig.json
│  ├─ api-server/                               # FastAPI 网关
│  │  ├─ app/
│  │  │  ├─ api/v1/                             # API版本化路由
│  │  │  │  ├─ auth.py
│  │  │  │  ├─ notices.py
│  │  │  │  ├─ activities.py                    # P1预留
│  │  │  │  ├─ knowledge.py                     # P1预留
│  │  │  │  ├─ agent.py                         # P2预留
│  │  │  │  └─ health.py
│  │  │  ├─ services/                           # 业务服务层
│  │  │  ├─ repositories/                       # 数据访问层
│  │  │  ├─ dependencies/                       # FastAPI依赖注入
│  │  │  │  └─ deps.py
│  │  │  ├─ middleware/                         # 中间件（CORS、审计、异常处理）
│  │  │  ├─ tasks/                              # Celery任务调度封装
│  │  │  └─ main.py                             # FastAPI入口
│  │  ├─ tests/
│  │  └─ pyproject.toml
│  └─ ai-worker/                                # Celery Worker
│     ├─ src/ai_worker/
│     │  ├─ tasks/                              # 异步任务实现
│     │  ├─ pipelines/                          # 任务编排流水线
│     │  ├─ clients/                            # 三方API客户端封装
│     │  └─ celery_app.py                       # Celery入口
│     ├─ tests/
│     └─ pyproject.toml
├─ packages/                                    # 可复用能力层
│  ├─ py-config/                                # Pydantic-settings全局配置
│  │  ├─ py_config/
│  │  │  ├─ __init__.py
│  │  │  └─ settings.py
│  │  ├─ tests/
│  │  └─ pyproject.toml
│  ├─ py-db/                                    # SQLAlchemy ORM + Alembic迁移
│  │  ├─ py_db/
│  │  │  ├─ __init__.py
│  │  │  ├─ database.py
│  │  │  ├─ models/
│  │  │  ├─ migrations/
│  │  │  └─ alembic.ini
│  │  ├─ tests/
│  │  └─ pyproject.toml
│  ├─ py-schemas/                               # 统一DTO
│  │  ├─ py_schemas/
│  │  │  ├─ __init__.py
│  │  │  ├─ auth.py
│  │  │  ├─ notice.py
│  │  │  └─ tenant.py
│  │  ├─ tests/
│  │  └─ pyproject.toml
│  ├─ py-ai-engine/                             # AI引擎抽象层
│  │  ├─ py_ai_engine/
│  │  │  ├─ __init__.py
│  │  │  ├─ llm_client.py
│  │  │  └─ parsers.py
│  │  ├─ tests/
│  │  └─ pyproject.toml
│  ├─ py-logger/                                # 结构化日志
│  │  ├─ py_logger/
│  │  │  ├─ __init__.py
│  │  │  ├─ core.py
│  │  │  ├─ context.py
│  │  │  ├─ events.py
│  │  │  └─ middlewares/
│  │  │     └─ fastapi_middleware.py
│  │  ├─ tests/
│  │  └─ pyproject.toml
│  ├─ py-auth/                                  # JWT/RBAC/租户隔离
│  │  ├─ py_auth/
│  │  │  ├─ __init__.py
│  │  │  ├─ jwt_handler.py
│  │  │  ├─ password.py
│  │  │  ├─ rbac.py
│  │  │  └─ middleware.py
│  │  ├─ tests/
│  │  └─ pyproject.toml
│  ├─ py-messaging/                             # 消息推送适配器
│  │  ├─ py_messaging/
│  │  │  ├─ __init__.py
│  │  │  ├─ wxpusher.py
│  │  │  └─ napcat.py
│  │  ├─ tests/
│  │  └─ pyproject.toml
│  ├─ ts-shared/                                # 前端共享类型/枚举
│  │  ├─ src/
│  │  │  ├─ enums/
│  │  │  └─ types/
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ ts-config/                                # 前端共享配置（占位预留）
├─ infrastructure/                              # 基础设施与部署
│  ├─ docker/
│  ├─ nginx/
│  └─ observability/
├─ scripts/                                     # 启动与运维脚本
│  ├─ start.py                                  # 统一编排启动入口
│  ├─ start_api.py                              # API Server启动
│  ├─ start_web.py                              # Web Client启动
│  ├─ start_worker.py                           # AI Worker启动
│  ├─ __init__.py
│  └─ utils/                                    # 脚本工具模块
│     ├─ __init__.py
│     ├─ check_utils.py                         # 前置检查
│     ├─ log_utils.py                           # 日志输出
│     └─ process_utils.py                       # 进程管理
├─ tests/                                       # 根级集成/E2E测试
│  ├─ conftest.py
│  ├─ test_startup_cli.py
│  └─ test_startup_check_utils.py
├─ docs/                                        # 项目文档
├─ data/                                        # 样例数据/导入模板
├─ logs/                                        # 运行时日志
│  ├─ api.log
│  ├─ web.log
│  └─ worker.log
├─ tmp/                                         # 临时文件
├─ .env.example                                 # 环境变量模板
├─ .gitignore
├─ docker-compose.yml                           # 本地开发基础设施编排
├─ pyproject.toml                               # Python uv workspace配置
├─ pnpm-workspace.yaml                          # Node.js pnpm workspace配置
├─ package.json                                 # 根级npm脚本
├─ main.py                                      # 项目根级入口（预留）
└─ README.md
```

#### 1.3.1.2 关键配置文件设计

**pyproject.toml（根目录 - uv workspace）**

```toml
[project]
name = "young-hearts-agent-platform"
version = "0.1.0"
description = "智院灵枢(SAP) - 青年之心智能体平台"
requires-python = ">=3.12"

[tool.uv.workspace]
members = [
    "apps/api-server",
    "apps/ai-worker",
    "packages/py-config",
    "packages/py-db",
    "packages/py-schemas",
    "packages/py-ai-engine",
    "packages/py-logger",
    "packages/py-auth",
    "packages/py-messaging",
]

[tool.uv]
dev-dependencies = [
    "pytest>=9.0.2",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=5.0.0",
    "ruff>=0.8.0",
]

[tool.ruff]
line-length = 120
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "W", "I", "N", "UP", "B", "A", "C4", "SIM", "RUF"]
ignore = ["E501"]

[tool.pytest.ini_options]
testpaths = ["tests", "apps/*/tests", "packages/*/tests"]
asyncio_mode = "auto"

[tool.coverage.report]
fail_under = 70
```

**pnpm-workspace.yaml**

```yaml
packages:
  - "apps/web-client"
  - "packages/ts-*"
```

**package.json（根目录 - 统一脚本）**

```json
{
  "name": "young-hearts-agent-platform",
  "private": true,
  "scripts": {
    "dev": "python scripts/start.py",
    "dev:web": "pnpm --filter web-client dev",
    "dev:api": "python scripts/start_api.py",
    "dev:worker": "python scripts/start_worker.py",
    "build": "pnpm --filter web-client build",
    "test": "pnpm --filter web-client test && uv run pytest",
    "test:fe": "pnpm --filter web-client test",
    "test:be": "uv run pytest",
    "lint": "pnpm --filter web-client lint && uv run ruff check .",
    "lint:fix": "pnpm --filter web-client lint --fix && uv run ruff check --fix .",
    "install:all": "pnpm install && uv sync --all-packages"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

**vite.config.ts（web-client）**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite 开发与构建配置
 *
 * 开发环境通过 server.proxy 将 /api 路径代理到 FastAPI 后端，
 * 避免跨域问题；生产环境通过 Nginx 反向代理实现。
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
})
```

**.env.example（统一环境变量模板）**

```bash
# ===== 前端配置 =====
VITE_API_BASE_URL=http://localhost:8000
VITE_MODE=development

# ===== 核心配置 =====
ENV=development
DEBUG=true
SECRET_KEY=your_secure_secret_key_here_min_32_chars
ALLOWED_HOSTS=localhost,127.0.0.1

# ===== 数据库配置 =====
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/agent_platform

# ===== Redis配置 =====
REDIS_URL=redis://localhost:6379/0

# ===== 大模型配置 =====
DASHSCOPE_API_KEY=your_dashscope_api_key
DASHSCOPE_MODEL=qwen-vl-max

# ===== 向量数据库配置 =====
MILVUS_HOST=localhost
MILVUS_PORT=19530

# ===== 消息推送配置 =====
WXPUSHER_APP_TOKEN=your_wxpusher_app_token
NAPCAT_HTTP_URL=http://localhost:3000

# ===== Celery配置 =====
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# ===== CORS配置 =====
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://0.0.0.0:5173

# ===== 邮件配置 =====
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=your_email@qq.com
SMTP_PASSWORD=your_email_password
```

**api-server/app/main.py（CORS配置优化）**

核心变更点：
- 移除sys.path.append临时方案，改为uv workspace可编辑安装
- CORS allow_origins从.env动态读取CORS_ORIGINS，不硬编码
- 中间件注册顺序：CORS → 审计日志 → 异常处理

```python
# 关键配置片段（非完整代码）
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 1.3.1.3 共享包pyproject.toml设计示例

**packages/py-config/pyproject.toml**

```toml
[project]
name = "py-config"
version = "0.1.0"
description = "全局配置读取（Pydantic-settings）"
requires-python = ">=3.12"
dependencies = [
    "pydantic>=2.12.0",
    "pydantic-settings>=2.12.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

**packages/py-db/pyproject.toml**

```toml
[project]
name = "py-db"
version = "0.1.0"
description = "SQLAlchemy ORM + Alembic迁移"
requires-python = ">=3.12"
dependencies = [
    "sqlalchemy>=2.0.45",
    "pymysql>=1.1.2",
    "alembic>=1.13.0",
    "py-config",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

**packages/py-schemas/pyproject.toml**

```toml
[project]
name = "py-schemas"
version = "0.1.0"
description = "统一请求/响应DTO定义"
requires-python = ">=3.12"
dependencies = [
    "pydantic>=2.12.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

**apps/api-server/pyproject.toml**

```toml
[project]
name = "young-hearts-api-server"
version = "0.1.0"
description = "FastAPI网关服务"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.128.0",
    "uvicorn>=0.40.0",
    "httpx>=0.28.1",
    "python-jose>=3.5.0",
    "argon2-cffi>=25.1.0",
    "passlib>=1.7.4",
    "celery>=5.4.0",
    "py-config",
    "py-db",
    "py-schemas",
    "py-auth",
    "py-logger",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

**apps/ai-worker/pyproject.toml**

```toml
[project]
name = "young-hearts-ai-worker"
version = "0.1.0"
description = "Celery Worker异步任务处理器"
requires-python = ">=3.12"
dependencies = [
    "celery>=5.4.0",
    "httpx>=0.28.1",
    "py-config",
    "py-db",
    "py-ai-engine",
    "py-messaging",
    "py-logger",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

### 1.3.2 前后端API对接实现

#### 1.3.2.1 API路径映射矩阵

| 前端API模块 | 前端请求路径 | 后端路由文件 | 后端注册prefix | 匹配状态 |
|------------|-------------|------------|---------------|---------|
| auth.js | /api/auth/login | api/v1/auth.py | /api/auth | 对齐 |
| auth.js | /api/auth/me | api/v1/auth.py | /api/auth | 对齐 |
| auth.js | /api/auth/refresh | api/v1/auth.py | /api/auth | 对齐 |
| auth.js | /api/auth/logout | api/v1/auth.py | /api/auth | 对齐 |
| notice.js | /api/notices/* | api/v1/notices.py | /api/notices | 对齐 |
| consult.js | /api/consult/chat (SSE) | api/v1/consult.py | /api/consult | 对齐 |
| knowledge.js | /api/knowledge/* | api/v1/knowledge.py | /api/knowledge | 对齐 |

#### 1.3.2.2 请求/响应结构匹配方案

**前端API SDK封装架构**

```text
src/shared/api/
├─ adminClient.ts          # B端Axios实例
│  - baseURL: VITE_API_BASE_URL
│  - withCredentials: true (Cookie凭证)
│  - 请求拦截: 注入租户头 X-Tenant-ID
│  - 响应拦截: 401 → 清除状态 → 跳转登录
│  - 响应拦截: 422 → 映射Pydantic校验错误为用户可读消息
├─ h5Client.ts             # C端Axios实例
│  - baseURL: VITE_API_BASE_URL
│  - withCredentials: true
│  - 请求拦截: 注入学生凭证
└─ index.ts                # 统一导出
```

**凭证传递方案**

```typescript
// adminClient.ts 核心配置
const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,   // 确保 Cookie 随请求发送
  timeout: 30000,
})
```

**422错误映射方案**

```typescript
// 响应拦截器 - Pydantic校验错误映射
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 422) {
      // 将Pydantic detail数组映射为字段→错误消息对象
      const fieldErrors = error.response.data.detail.reduce((acc, err) => {
        const field = err.loc.join('.')
        acc[field] = err.msg
        return acc
      }, {})
      return Promise.reject({ fieldErrors, isValidationError: true })
    }
    if (error.response?.status === 401) {
      // 清除用户状态，跳转登录页（仅触发一次）
      redirectToLoginOnce()
    }
    return Promise.reject(error)
  }
)
```

#### 1.3.2.3 SSE流式响应实现方案

**前端SSE处理函数架构**

```text
src/features/knowledge/api/
└─ consultSSE.ts
   - chatSSE(params, { onMessage, onComplete, onError })
   - 使用 fetch + ReadableStream 解析SSE协议
   - AbortController 支持用户中断
   - 事件类型映射: message/topic/sources/source/error/done
```

**SSE解析核心流程**

1. 发起fetch请求，获取ReadableStream reader
2. 逐块读取文本，按`\n\n`分割为SSE消息
3. 解析`event:`行获取事件类型，`data:`行获取JSON数据
4. 根据事件类型分发回调：
   - `message` → onMessage(data.content)
   - `topic` → onMessage(data.topic, { isTopic: true })
   - `sources` → onMessage(data, { isSources: true })
   - `error` → onError(data.detail)
   - `done` → 关闭reader，调用onComplete()
5. 流中断检测：reader.done为true但completed标记为false时，仍调用onComplete

**后端SSE响应格式规范**

```python
# SSE事件发送格式
async def send_sse_event(response: StreamingResponse, event: str, data: dict):
    """发送标准SSE格式事件"""
    yield f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
```

### 1.3.3 开发环境网络配置实现

#### 1.3.3.1 Vite代理配置

**代理规则设计**

| 前端请求路径 | 代理目标 | 说明 |
|------------|---------|------|
| /api | http://localhost:8000 | 所有API请求代理到FastAPI |
| /health | http://localhost:8000 | 健康检查端点代理 |

Vite代理配置已在1.3.1.2节vite.config.ts中定义，核心参数：
- `target`: 从环境变量或默认值获取后端地址
- `changeOrigin: true`: 修改请求头中的Origin为target地址
- `secure: false`: 开发环境不验证SSL证书

#### 1.3.3.2 CORS白名单配置

CORS配置从`.env`的`CORS_ORIGINS`变量动态读取，包含：
- `http://localhost:5173` — 本机开发
- `http://127.0.0.1:5173` — 本机IP变体
- `http://0.0.0.0:5173` — 局域网访问
- 局域网IP地址（如`http://10.15.9.148:5173`）— 按需添加

**约束**：禁止`allow_origins=["*"]`与`allow_credentials=True`同时使用。

#### 1.3.3.3 环境变量统一管理

**变量分类与职责**

| 分类 | 前缀 | 读取方 | 示例 |
|------|------|--------|------|
| 前端专用 | VITE_ | Vite注入到import.meta.env | VITE_API_BASE_URL, VITE_MODE |
| 后端核心 | 无前缀 | py-config (Pydantic Settings) | SECRET_KEY, DATABASE_URL, REDIS_URL |
| 大模型 | DASHSCOPE_ | py-ai-engine | DASHSCOPE_API_KEY, DASHSCOPE_MODEL |
| 消息推送 | WXPUSHER_/NAPCAT_ | py-messaging | WXPUSHER_APP_TOKEN |
| 任务队列 | CELERY_ | ai-worker | CELERY_BROKER_URL |
| CORS | CORS_ | api-server middleware | CORS_ORIGINS |

### 1.3.4 统一启动脚本实现

#### 1.3.4.1 scripts/start.py 主入口设计

**CLI参数设计**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| --services | str | "api,worker,web" | 指定启动的服务子集 |
| --no-check | flag | False | 跳过前置检查（用于快速重启） |
| --log-level | str | "info" | 控制台日志级别 |

**三阶段控制台布局**

```
╔══════════════════════════════════════════════════════════════════════╗
║              智院灵枢(SAP) 服务启动控制台                              ║
╚══════════════════════════════════════════════════════════════════════╝

[阶段一：前置检查]
  ✔  .env 配置文件        已就绪
  ✔  Python 环境          已就绪 (3.12.x)
  ✔  Node.js 环境         已就绪 (20.x)
  ✔  数据库连接           已就绪
  ✔  Redis 连接           已就绪
  ✔  端口 8000            未被占用
  ✔  端口 5173            未被占用

──────────────────────────────────────────────────────────────────────

[阶段二：服务启动]
  ● API 服务              正在启动... (PID: 12345)
  ● Worker 服务           正在启动... (PID: 12346)
  ● Web 服务              正在启动... (PID: 12347)

──────────────────────────────────────────────────────────────────────

[阶段三：运行中]
  所有服务已就绪。按下 Ctrl+C 可安全终止所有服务。

[API   ]  INFO     Application startup complete.
[Worker]  INFO     celery@host ready.
[Web   ]  INFO     Local:   http://localhost:5173/
```

#### 1.3.4.2 scripts/utils/check_utils.py 前置检查设计

**检查项清单**

| 检查项 | 类型 | 检查函数 | 失败行为 |
|--------|------|---------|---------|
| .env文件存在 | 强依赖 | `check_env_file()` | 中止启动 |
| Python解释器 | 强依赖 | `check_python()` | 中止启动 |
| Node.js运行时 | 强依赖（web启用时） | `check_node()` | 中止web启动 |
| 数据库连通性 | 强依赖 | `check_database()` | 中止启动 |
| Redis连通性 | 强依赖 | `check_redis()` | 中止启动 |
| 端口8000占用 | 强依赖（api启用时） | `check_port(8000)` | 中止api启动 |
| 端口5173占用 | 强依赖（web启用时） | `check_port(5173)` | 中止web启动 |

#### 1.3.4.3 scripts/utils/process_utils.py 进程管理设计

**跨平台进程管理接口**

| 接口 | Linux/macOS实现 | Windows实现 |
|------|----------------|------------|
| `start_process(cmd)` | `subprocess.Popen(..., preexec_fn=os.setsid)` | `subprocess.Popen(..., creationflags=CREATE_NEW_PROCESS_GROUP)` |
| `graceful_terminate(proc, timeout)` | `os.killpg(pgid, SIGTERM)` → 等待 → `os.killpg(pgid, SIGKILL)` | `taskkill /F /T /PID` |
| `is_process_alive(proc)` | `proc.poll() is None` | `proc.poll() is None` |

**信号处理策略**

- 主进程注册SIGINT/SIGTERM处理函数
- 收到信号后按启动逆序终止子进程
- 每个子进程设置优雅退出超时（默认10秒）
- 超时后执行强制终止，并在控制台标注"强制终止"

#### 1.3.4.4 scripts/utils/log_utils.py 日志输出设计

**颜色语义映射**

| 颜色 | 语义 | ANSI码 |
|------|------|--------|
| GREEN | 成功/就绪 | \033[32m |
| YELLOW | 警告/等待 | \033[33m |
| RED | 错误/失败 | \033[31m |
| CYAN | 信息/提示 | \033[36m |
| WHITE | 普通输出 | \033[0m |

**关键约束**：
- 检测`sys.stdout.isatty()`，不支持颜色时自动降级为纯文本
- 服务日志前缀固定宽度对齐：`[API   ]`、`[Worker]`、`[Web   ]`
- 复用py-logger的`get_logger`进行结构化日志输出

### 1.3.5 注释与代码规范实现

#### 1.3.5.1 后端注释规范（Python）

**Google Style Docstring模板**

```python
@router.post(
    "/users",
    summary="创建新用户",
    description="接收前端传递的用户信息，校验后存入数据库，并触发欢迎邮件发送任务。",
    response_description="返回创建成功的用户ID",
    tags=["Users"],
)
async def create_user(user_in: UserCreate) -> dict:
    """
    执行创建用户的核心逻辑。

    Args:
        user_in (UserCreate): 包含邮箱和密码的Pydantic模型

    Returns:
        dict: 包含新用户UUID的字典

    Raises:
        HTTPException(400): 如果邮箱已被注册
        HTTPException(500): 数据库写入失败
    """
    ...
```

**Ruff配置（pyproject.toml）**

```toml
[tool.ruff.lint]
# 强制Docstring检查
select = ["E", "F", "W", "I", "N", "UP", "B", "A", "C4", "SIM", "RUF", "D"]
# D系列规则: Google Style Docstring
[tool.ruff.lint.pydocstyle]
convention = "google"
```

#### 1.3.5.2 前端注释规范（TypeScript）

**TSDoc组件模板**

```typescript
/**
 * 带有权限校验的按钮组件
 *
 * 只有当当前用户拥有指定action权限时才会渲染，否则隐藏或禁用。
 *
 * @example
 * <AuthButton action="delete_user" onClick={handleDelete}>删除用户</AuthButton>
 */
export const AuthButton: React.FC<AuthButtonProps> = ({ action, children, ...props }) => {
    // ...
}
```

**ESLint JSDoc插件配置**

```javascript
// eslint.config.js
import jsdoc from 'eslint-plugin-jsdoc'
{
  plugins: { jsdoc },
  rules: {
    'jsdoc/require-jsdoc': ['warn', { contexts: ['FunctionDeclaration', 'ArrowFunctionExpression'] }],
    'jsdoc/require-param': 'warn',
    'jsdoc/require-returns': 'warn',
  },
}
```

#### 1.3.5.3 Git提交规范（Conventional Commits）

**Husky + Commitlint配置**

```text
.husky/
├─ pre-commit     # Ruff check + ESLint
└─ commit-msg     # commitlint --edit $1
```

**commitlint.config.js**

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'auth', 'notice', 'member', 'student', 'tenant',
      'activity', 'knowledge', 'agent',
      'api', 'worker', 'web', 'scripts', 'config',
    ]],
  },
}
```

### 1.3.6 日志规范实现

#### 1.3.6.1 py-logger统一使用

**日志获取方式**

```python
from py_logger import get_logger

logger = get_logger(__name__)
```

**结构化日志输出规范**

```python
# 成功事件 - info级别
logger.info(
    "auth_login_succeeded",
    user_id=user.id,
    tenant_id=user.tenant_id,
    role=user.role.value,
)

# 业务失败 - warning级别（系统可继续运行）
logger.warning(
    "auth_login_failed",
    username=username,
    reason="password_mismatch",
)

# 系统异常 - error级别（关键流程失败）
logger.error(
    "database_commit_failed",
    reason="connection_timeout",
    table="users",
)
```

#### 1.3.6.2 事件命名规范

**已落地事件清单（5类23个）**

| 模块前缀 | 事件名 | 级别 |
|---------|--------|------|
| auth_ | auth_login_succeeded/failed, auth_refresh_succeeded/failed, auth_logout_succeeded/failed, auth_bootstrap_super_admin_exists/created/failed, auth_token_user_extract_failed | info/warning |
| auth_ | auth_resolve_user_failed, auth_role_check_failed, auth_tenant_context_failed | warning |
| user_ | user_create_succeeded/failed, user_get_me_failed | info/warning |
| student_ | student_verify_succeeded/failed | info/warning |
| token_/password_ | token_decode_failed, token_decode_invalid_type, password_hash_fallback_used, password_verify_failed, password_verify_fallback_parse_failed, password_verify_fallback_invalid_iteration | warning |

**新增模块事件扩展规则**

新增业务模块时，必须先在`py_logger/events.py`中定义事件名与reason枚举，再编写业务逻辑。例如新增通知模块：

```python
# py_logger/events.py 新增
NOTICE_PARSE_SUCCEEDED = "notice_parse_succeeded"
NOTICE_PARSE_FAILED = "notice_parse_failed"
NOTICE_SEND_SUCCEEDED = "notice_send_succeeded"
NOTICE_SEND_FAILED = "notice_send_failed"

# reason枚举
NOTICE_PARSE_REASONS = {
    "invalid_format": "通知格式不合法",
    "ai_model_error": "AI模型解析失败",
}
```

#### 1.3.6.3 通用字段与敏感信息屏蔽

**通用字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| reason | str | 失败原因机器码（snake_case枚举值） |
| user_id | str/int | 当前用户ID |
| tenant_id | str/int | 当前租户ID |
| username | str | 用户名（非敏感标识） |
| role | str | 角色（如SUPER_ADMIN） |
| student_id | str/int | 学生ID |
| token_type | str | Token类型（不记录原文） |

**禁止记录的敏感信息**

- password / password_hash
- token原文（access_token / refresh_token）
- secret_key / api_key原文
- 完整身份证号

---

# **2. 接口设计**

## **2.1 总体设计**

### 2.1.1 API对接总体架构

前后端API对接遵循"契约先行"原则：
1. 后端通过`py-schemas`定义请求/响应DTO，DTO直接决定Swagger文档结构
2. 前端通过`ts-shared`定义对应的TypeScript类型，与DTO字段命名保持一致
3. 前端API SDK通过`adminClient`/`h5Client`统一封装，处理凭证注入、错误映射、401重定向

### 2.1.2 认证流程接口设计

**Cookie认证流程**

1. 登录：`POST /api/auth/login` → 后端Set-Cookie写入session → 前端更新Zustand store
2. 鉴权：后续请求浏览器自动携带Cookie → 后端依赖注入`get_current_user`解析Cookie
3. 刷新：`POST /api/auth/refresh` → 后端刷新Cookie有效期
4. 登出：`POST /api/auth/logout` → 后端清除Cookie → 前端清除store → 跳转登录页
5. 401拦截：响应拦截器捕获401 → 清除状态 → 跳转登录（仅触发一次）

### 2.1.3 SSE流式接口设计

**SSE连接建立**

- 前端通过`fetch`发起POST请求（非EventSource，因需发送请求体）
- 使用`AbortController`支持用户中断
- Content-Type: application/json（请求体），响应为text/event-stream

**SSE事件协议**

| event类型 | data格式 | 前端处理 |
|----------|---------|---------|
| message | `{ "content": "片段文本" }` | 追加到对话界面 |
| topic | `{ "topic": "话题名" }` | 显示话题标记 |
| sources | `[{ "title": "", "url": "" }]` | 显示引用来源列表 |
| error | `{ "detail": "错误原因" }` | 调用onError回调 |
| done | `{}` | 标记流完成，关闭reader |

## **2.2 接口清单**

### 2.2.1 认证域接口

| 方法 | 路径 | 请求Schema | 响应Schema | 说明 |
|------|------|-----------|-----------|------|
| POST | /api/auth/login | LoginRequest | LoginResponse + Set-Cookie | 用户登录 |
| POST | /api/auth/refresh | - | RefreshResponse + Set-Cookie | 刷新Token |
| POST | /api/auth/logout | - | - + Clear-Cookie | 登出 |
| GET | /api/auth/me | - | UserInfoResponse | 获取当前用户信息 |
| POST | /api/auth/bootstrap | BootstrapRequest | BootstrapResponse | 引导创建超级管理员 |

### 2.2.2 通知域接口

| 方法 | 路径 | 请求Schema | 响应Schema | 说明 |
|------|------|-----------|-----------|------|
| GET | /api/notices | ListQueryParams | PageResponse[NoticeDTO] | 分页查询通知 |
| POST | /api/notices | NoticeCreateRequest | NoticeDTO | 创建通知 |
| GET | /api/notices/{id} | - | NoticeDTO | 获取通知详情 |
| PUT | /api/notices/{id}/confirm | - | NoticeDTO | 确认通知 |
| POST | /api/notices/{id}/remind | - | TaskResponse | 触发催收 |

### 2.2.3 SSE咨询接口

| 方法 | 路径 | 请求Schema | 响应类型 | 说明 |
|------|------|-----------|---------|------|
| POST | /api/consult/chat | ChatRequest | text/event-stream (SSE) | AI对话（流式） |

### 2.2.4 健康检查接口

| 方法 | 路径 | 响应Schema | 说明 |
|------|------|-----------|------|
| GET | /health | `{ "status": "ok" }` | 服务健康检查 |

---

# **4. 数据模型**

## **4.1 设计目标**

1. **统一DTO隔离ORM**：API响应必须使用`py-schemas`中的DTO，禁止直接返回SQLAlchemy ORM模型，防止敏感字段泄漏和内部结构暴露
2. **租户隔离内置**：Repository层默认注入`tenant_id`查询条件，所有核心业务表包含`tenant_id`字段并建立复合索引
3. **前后端类型共享**：`py-schemas`的DTO字段命名与`ts-shared`的TypeScript类型定义保持一致，减少联调歧义
4. **结构化日志关联**：数据操作的关键节点（创建、更新、删除）必须通过`py-logger`输出结构化日志，包含实体ID和操作结果

## **4.2 模型实现**

### 4.2.1 py-schemas DTO定义（后端统一契约）

**认证域DTO**

```python
# packages/py_schemas/auth.py

class LoginRequest(BaseModel):
    """用户登录请求"""
    username: str = Field(..., min_length=1, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, description="密码")

class LoginResponse(BaseModel):
    """用户登录响应"""
    user_id: str
    username: str
    nickname: str | None = None
    roles: list[str]
    tenant_id: int | None = None

class UserInfoResponse(BaseModel):
    """当前用户信息响应"""
    id: str
    username: str
    nickname: str | None = None
    email: str | None = None
    roles: list[str]
    tenant_id: int | None = None
    is_active: bool
```

**通知域DTO**

```python
# packages/py_schemas/notice.py

class NoticeCreateRequest(BaseModel):
    """创建通知请求"""
    title: str = Field(..., max_length=200, description="通知标题")
    content: str = Field(..., description="通知内容")
    notice_type: str = Field(..., description="通知类型")

class NoticeDTO(BaseModel):
    """通知响应DTO（隔离ORM模型）"""
    id: str
    title: str
    content: str
    notice_type: str
    status: str
    created_at: datetime
    updated_at: datetime | None = None
```

### 4.2.2 ts-shared 类型定义（前端共享契约）

**认证域类型**

```typescript
// packages/ts-shared/src/types/auth.ts

/** 用户登录请求参数 */
export interface LoginRequest {
  username: string
  password: string
}

/** 用户登录响应数据 */
export interface LoginResponse {
  user_id: string
  username: string
  nickname?: string
  roles: string[]
  tenant_id?: number
}

/** 当前用户信息 */
export interface UserInfo {
  id: string
  username: string
  nickname?: string
  email?: string
  roles: string[]
  tenant_id?: number
  is_active: boolean
}
```

**共享枚举**

```typescript
// packages/ts-shared/src/enums/index.ts

/** 用户角色枚举 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  VOLUNTEER = 'VOLUNTEER',
  EXPERT = 'EXPERT',
}

/** 用户状态枚举 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/** 通知状态枚举 */
export enum NoticeStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CONFIRMED = 'CONFIRMED',
}
```

### 4.2.3 数据流与交互设计

**前端→后端请求流**

```plantuml
@startuml
actor 用户
participant "React页面" as page
participant "Feature API\n(features/auth/api/)" as feature_api
participant "Axios实例\n(shared/api/adminClient)" as axios
participant "Vite代理\n(/api → :8000)" as proxy
participant "FastAPI Router\n(api/v1/auth.py)" as router
participant "Dependencies\n(deps.py)" as deps
participant "Service\n(auth_service.py)" as svc
participant "Repository\n(user_repository.py)" as repo
participant "MySQL" as db

用户 -> page : 点击登录
page -> feature_api : login({username, password})
feature_api -> axios : POST /api/auth/login
axios -> axios : withCredentials: true\n注入X-Tenant-ID头
axios -> proxy : HTTP POST /api/auth/login
proxy -> router : 转发至FastAPI
router -> deps : get_db_session()
router -> deps : 解析请求体→LoginRequest
router -> svc : auth_service.login(db, login_in)
svc -> repo : user_repo.get_by_username(db, username)
repo -> db : SELECT * FROM users WHERE username=?
db --> repo : User ORM对象
repo --> svc : User对象（含password_hash）
svc -> svc : 验证密码(py-auth)
svc --> router : LoginResponse DTO
router --> proxy : 200 OK + Set-Cookie
proxy --> axios : 200 OK + Set-Cookie
axios --> feature_api : LoginResponse
feature_api --> page : 返回登录结果
page -> page : 更新Zustand store\n(用户状态=已登录)
page --> 用户 : 跳转至管理后台

@enduml
```

**SSE流式响应流**

```plantuml
@startuml
actor 用户
participant "对话页面" as chat
participant "chatSSE函数" as sse_fn
participant "fetch API\n(AbortController)" as fetch
participant "Vite代理" as proxy
participant "FastAPI\n/api/consult/chat" as api
participant "DashScope AI" as ai

用户 -> chat : 输入问题
chat -> sse_fn : chatSSE({session_id, query}, callbacks)
sse_fn -> fetch : fetch(url, {signal: abortController.signal})
fetch -> proxy : POST /api/consult/chat
proxy -> api : 转发
api -> ai : 流式API调用

loop 逐段生成
    ai --> api : content片段
    api --> proxy : SSE: event:message\ndata:{"content":"..."}
    proxy --> fetch : SSE数据流
    fetch --> sse_fn : 解析event+data
    sse_fn --> chat : onMessage(content)
    chat --> 用户 : 追加展示
end

ai --> api : 生成完毕
api --> proxy : SSE: event:done
proxy --> fetch : SSE结束
fetch --> sse_fn : 流完成
sse_fn --> chat : onComplete()
chat --> 用户 : 展示完成状态

@enduml
```

---

# **5. 迁移策略与分阶段实施计划**

## **5.1 实施阶段划分**

### 阶段一：Monorepo工作区配置（P0 - 基础优先）

**目标**：建立规范化的双工作空间配置，确保所有子项目可通过工作区工具正确安装和链接。

| 任务 | 具体内容 | 验收条件 |
|------|---------|---------|
| T1.1 | 创建根目录pyproject.toml的[tool.uv.workspace]配置 | `uv sync --all-packages`成功安装所有Python包 |
| T1.2 | 创建pnpm-workspace.yaml | `pnpm install`正确链接web-client和ts-shared |
| T1.3 | 创建根目录package.json统一脚本 | `npm run install:all`一键安装前后端依赖 |
| T1.4 | 各共享包补充完整pyproject.toml | 每个包可独立`pip install -e`安装 |
| T1.5 | api-server/ai-worker的pyproject.toml声明共享包依赖 | 不再需要sys.path.append即可正确导入 |

### 阶段二：前后端API对接与网络配置（P0 - 核心功能）

**目标**：打通前后端数据流，确保API请求正确到达后端并返回预期响应。

| 任务 | 具体内容 | 验收条件 |
|------|---------|---------|
| T2.1 | vite.config.ts配置server.proxy | 开发环境API请求通过代理到达FastAPI |
| T2.2 | api-server CORS配置改为从.env读取 | CORS白名单包含所有前端源地址 |
| T2.3 | .env.example统一更新 | 包含前后端所有必需变量 |
| T2.4 | 前端adminClient配置withCredentials | Cookie随请求发送 |
| T2.5 | 前端401/422响应拦截器实现 | 401跳转登录、422映射校验错误 |
| T2.6 | SSE流式响应对接 | chatSSE函数正确解析所有SSE事件类型 |

### 阶段三：统一启动脚本（P1 - 开发体验）

**目标**：提供一键启动开发环境的统一控制台方案。

| 任务 | 具体内容 | 验收条件 |
|------|---------|---------|
| T3.1 | scripts/utils/process_utils.py跨平台进程管理 | Windows/Linux/macOS均可安全启动和终止 |
| T3.2 | scripts/utils/check_utils.py前置检查 | 缺少.env/端口占用/DB不可达时正确报错 |
| T3.3 | scripts/utils/log_utils.py日志输出 | 颜色语义正确、终端降级正常、前缀对齐 |
| T3.4 | scripts/start.py主入口 | 交互式菜单和CLI参数均可正常工作 |
| T3.5 | 子启动脚本(start_api/start_worker/start_web) | 各服务可独立启动 |

### 阶段四：注释与代码规范落地（P1 - 工程质量）

**目标**：通过工具强制执行代码注释和提交规范。

| 任务 | 具体内容 | 验收条件 |
|------|---------|---------|
| T4.1 | Ruff配置启用Docstring检查 | 缺少Docstring的代码提交被拦截 |
| T4.2 | ESLint配置eslint-plugin-jsdoc | 缺少TSDoc的组件提交被拦截 |
| T4.3 | Husky + Commitlint配置 | 不符合Conventional Commits的提交被拦截 |
| T4.4 | 现有代码补充Docstring/TSDoc | 现有代码通过Lint检查 |

### 阶段五：日志规范全面落地（P1 - 可观测性）

**目标**：后端所有日志输出统一使用py-logger结构化格式。

| 任务 | 具体内容 | 验收条件 |
|------|---------|---------|
| T5.1 | 审计并替换所有裸print为logger调用 | `grep -r "print(" apps/ packages/`无结果 |
| T5.2 | 审计并替换所有字符串拼接日志 | 所有日志为键值对格式 |
| T5.3 | 新增模块事件名定义 | events.py包含所有业务模块事件 |
| T5.4 | 审计except块确保有日志输出 | 无静默异常吞没 |

## **5.2 迁移风险与缓解措施**

| 风险 | 影响范围 | 概率 | 缓解措施 |
|------|---------|------|---------|
| uv workspace与现有sys.path.append冲突 | api-server启动 | 中 | 保留sys.path.append作为降级兼容，优先使用workspace安装；分阶段迁移，先验证workspace安装正确再移除sys.path |
| pnpm workspace未配置导致ts-shared引用失败 | 前端构建 | 中 | 阶段一完成后立即验证`pnpm install`和workspace引用是否正常 |
| CORS白名单遗漏导致局域网访问失败 | 开发体验 | 低 | .env.example提供CORS_ORIGINS配置项，开发者按需添加局域网IP |
| Vite代理配置与生产环境Nginx行为不一致 | 部署 | 低 | CI/CD中增加生产构建验证；Nginx配置与Vite代理规则保持一致 |
| 共享包循环依赖 | 安装失败 | 低 | 依赖关系在design.md中明确声明，代码审查关注新增依赖方向 |
| 启动脚本跨平台兼容问题 | Windows开发 | 中 | 优先在Windows环境测试，process_utils封装所有平台差异 |
| Ruff/ESLint严格模式导致现有代码大量报错 | 开发效率 | 高 | 采用渐进式启用：先warn后error；现有代码分批修复；CI中仅检查新增代码 |
| Cookie SameSite属性配置不当 | 认证失败 | 中 | 开发环境使用SameSite=Lax；生产环境使用SameSite=Strict + Secure |

## **5.3 回滚策略**

1. **工作区配置回滚**：若uv workspace导致安装失败，可临时恢复sys.path.append方案，不影响开发进度
2. **API对接回滚**：vite.config.ts的代理配置为增量添加，移除proxy配置即可恢复原有跨域方式
3. **启动脚本回滚**：start.py为新增脚本，不替换原有npm run dev方式，可随时切换回concurrently方案
4. **Lint回滚**：Ruff/ESLint规则可采用渐进式启用，初期设为warn不阻塞提交
