# 编码任务规划：Monorepo集成与API对接

> 基于需求规格文档(spec.md)和实现方案文档(design.md)生成
> 覆盖5个渐进实施阶段（P0→P1），共9项核心能力

---

## 1. Monorepo工作区配置（阶段一，P0-基础优先）

> 目标：建立规范化的双工作空间配置，确保所有子项目可通过工作区工具正确安装和链接
> 依赖：无前置依赖
> 风险：uv workspace与现有sys.path.append冲突（中概率，保留降级兼容缓解）

- [ ] 创建根目录 `pyproject.toml` 的 `[tool.uv.workspace]` 配置，声明9个workspace成员（2个apps + 7个packages），配置Ruff/pytest/coverage等开发依赖和工具设定
  - 涉及文件：`pyproject.toml`
  - 验收条件：执行 `uv sync --all-packages` 成功安装所有Python包
  - 复杂度：中 | 风险：低

- [ ] 创建 `pnpm-workspace.yaml`，声明前端workspace成员（apps/web-client 和 packages/ts-*）
  - 涉及文件：`pnpm-workspace.yaml`
  - 验收条件：执行 `pnpm install` 正确链接web-client和ts-shared
  - 复杂度：低 | 风险：低

- [ ] 创建/更新根目录 `package.json` 统一脚本，提供 dev/dev:web/dev:api/dev:worker/build/test/test:fe/test:be/lint/lint:fix/install:all 等一键操作脚本
  - 涉及文件：`package.json`
  - 验收条件：执行 `npm run install:all` 一键安装前后端依赖；执行 `npm run dev` 启动全栈服务
  - 复杂度：中 | 风险：低

- [ ] 为7个Python共享包补充完整 `pyproject.toml`（py-config/py-db/py-schemas/py-ai-engine/py-logger/py-auth/py-messaging），声明包名、版本、依赖和build-system
  - 涉及文件：`packages/py-config/pyproject.toml`、`packages/py-db/pyproject.toml`、`packages/py-schemas/pyproject.toml`、`packages/py-ai-engine/pyproject.toml`、`packages/py-logger/pyproject.toml`、`packages/py-auth/pyproject.toml`、`packages/py-messaging/pyproject.toml`
  - 验收条件：每个包可独立 `pip install -e` 安装，包间依赖显式声明
  - 复杂度：中 | 风险：中（包间循环依赖需关注）

- [ ] 更新 `apps/api-server/pyproject.toml` 和 `apps/ai-worker/pyproject.toml`，显式声明对Python共享包的依赖（py-config/py-db/py-schemas/py-auth/py-logger等）
  - 涉及文件：`apps/api-server/pyproject.toml`、`apps/ai-worker/pyproject.toml`
  - 验收条件：api-server和ai-worker不再需要 `sys.path.append` 即可正确导入共享包
  - 复杂度：中 | 风险：中（需保留sys.path.append降级兼容，分阶段迁移）

- [ ] 从 `apps/api-server/app/main.py` 和 `apps/ai-worker` 入口中移除 `sys.path.append` 临时方案（优先验证workspace安装正确后再移除，保留注释说明降级方式）
  - 涉及文件：`apps/api-server/app/main.py`、`apps/ai-worker/src/ai_worker/celery_app.py`
  - 验收条件：移除sys.path.append后，通过 `from py_config import settings` 等方式可正确导入
  - 复杂度：低 | 风险：中（移除过早可能阻断开发，建议workspace验证通过后再操作）

- [ ] 确保 `packages/ts-shared` 包含完整 `package.json` 和 `tsconfig.json`，配置 `exports` 字段支持 `@young-hearts/ts-shared` 命名空间引用
  - 涉及文件：`packages/ts-shared/package.json`、`packages/ts-shared/tsconfig.json`
  - 验收条件：web-client通过 `import { TypeName } from '@young-hearts/ts-shared'` 可正确导入共享类型
  - 复杂度：中 | 风险：低

- [ ] 确保 `packages/ts-config` 目录存在（空占位），为后续多前端应用共享配置预留
  - 涉及文件：`packages/ts-config/`
  - 验收条件：目录存在，pnpm-workspace.yaml包含该路径
  - 复杂度：低 | 风险：低

- [ ] 验证双工作空间配置完整性：执行 `uv sync --all-packages` 和 `pnpm install`，确认所有workspace成员被正确安装和链接
  - 涉及文件：无新文件，验证步骤
  - 验收条件：两个命令均成功完成，无报错；Python包可通过from import正确引用；TypeScript包可通过workspace引用
  - 复杂度：低 | 风险：低

## 2. 前后端API对接与网络配置（阶段二，P0-核心功能）

> 目标：打通前后端数据流，确保API请求正确到达后端并返回预期响应
> 依赖：阶段一完成后（workspace配置正确才能安装依赖）
> 风险：CORS白名单遗漏导致局域网访问失败（低概率，.env配置缓解）

- [ ] 配置 `vite.config.ts` 的 `server.proxy`，将 `/api` 路径代理到FastAPI后端地址（http://localhost:8000），设置 `changeOrigin: true` 和 `secure: false`
  - 涉及文件：`apps/web-client/vite.config.ts`
  - 验收条件：开发环境下前端请求 `/api/auth/me` 被代理到 `http://localhost:8000/api/auth/me`
  - 复杂度：低 | 风险：低

- [ ] 优化 `api-server/app/main.py` 的CORS配置，从 `.env` 的 `CORS_ORIGINS` 变量动态读取 `allow_origins`，确保包含 localhost:5173、127.0.0.1:5173、0.0.0.0:5173 及局域网IP；配置 `allow_credentials=True`；禁止使用通配符 `*`
  - 涉及文件：`apps/api-server/app/main.py`、`apps/api-server/app/middleware/`、`.env.example`
  - 验收条件：CORS白名单包含所有前端源地址，局域网跨域请求成功
  - 复杂度：中 | 风险：中（SameSite/Secure属性配置需谨慎）

- [ ] 更新 `.env.example` 统一环境变量模板，包含前端配置（VITE_API_BASE_URL/VITE_MODE）、核心配置、数据库、Redis、大模型、向量库、消息推送、Celery、CORS、邮件等全量变量
  - 涉及文件：`.env.example`
  - 验收条件：开发者复制 `.env.example` 为 `.env` 并填写后，前后端配置项均可正确读取
  - 复杂度：低 | 风险：低

- [ ] 配置前端 `adminClient.ts` 的 `withCredentials: true`（Cookie凭证传递），设置 `baseURL` 为 `VITE_API_BASE_URL`，实现请求拦截器注入 `X-Tenant-ID` 租户头
  - 涉及文件：`apps/web-client/src/shared/api/adminClient.ts`
  - 验收条件：所有B端API请求浏览器自动携带Cookie和租户头
  - 复杂度：中 | 风险：低

- [ ] 配置前端 `h5Client.ts` 的 `withCredentials: true`（学生端Cookie凭证传递），实现请求拦截器注入学生凭证
  - 涉及文件：`apps/web-client/src/shared/api/h5Client.ts`
  - 验收条件：C端API请求携带学生Cookie凭证
  - 复杂度：低 | 风险：低

- [ ] 实现 `adminClient.ts` 的401响应拦截器：捕获401状态码 → 清除本地用户状态 → 跳转登录页（防抖处理，仅触发一次跳转，避免并发请求重复跳转）
  - 涉及文件：`apps/web-client/src/shared/api/adminClient.ts`
  - 验收条件：后端返回401时，前端仅触发一次登录页跳转，不出现页面闪烁
  - 复杂度：中 | 风险：中（并发401请求需防抖）

- [ ] 实现 `adminClient.ts` 的422响应拦截器：将Pydantic校验错误详情（detail数组）映射为字段→错误消息对象（fieldErrors），标记 `isValidationError: true`
  - 涉及文件：`apps/web-client/src/shared/api/adminClient.ts`
  - 验收条件：422错误被映射为 `{ fieldErrors: { username: "字段必填" }, isValidationError: true }` 结构
  - 复杂度：中 | 风险：低

- [ ] 实现前端SSE流式响应处理函数 `chatSSE`：使用 `fetch` + `ReadableStream` 解析SSE协议，支持 `AbortController` 用户中断，事件类型映射（message/topic/sources/error/done），流完成和中断检测
  - 涉及文件：`apps/web-client/src/features/knowledge/api/consultSSE.ts`（或对应feature路径）
  - 验收条件：chatSSE正确解析所有SSE事件类型，用户点击停止按钮可中断流，流结束调用onComplete
  - 复杂度：高 | 风险：中（SSE协议解析和中断检测逻辑较复杂）

- [ ] 确保后端SSE响应遵循标准格式：`event: {type}\ndata: {json}\n\n`，统一SSE事件发送函数
  - 涉及文件：`apps/api-server/app/api/v1/` 下的SSE路由文件
  - 验收条件：SSE事件格式符合前端解析预期，event和data行正确
  - 复杂度：中 | 风险：低

- [ ] 验证前端API路径与后端路由的一一映射：确认auth.js→/api/auth、notice.js→/api/notices、consult.js→/api/consult、knowledge.js→/api/knowledge等路径对齐
  - 涉及文件：`apps/web-client/src/features/*/api/`、`apps/api-server/app/api/v1/`
  - 验收条件：前端每个API函数的请求路径与后端路由prefix+path完全匹配
  - 复杂度：低 | 风险：低

- [ ] 验证前端请求参数结构与后端Pydantic Schema匹配：确认LoginRequest、NoticeCreateRequest等前后端DTO字段名和类型兼容
  - 涉及文件：`apps/web-client/src/features/*/api/`、`packages/py_schemas/`
  - 验收条件：前端发送的请求体字段与后端Schema定义一致，无422校验错误
  - 复杂度：低 | 风险：低

- [ ] 验证后端响应结构与前端解析预期匹配：确认LoginResponse、UserInfoResponse、NoticeDTO等前后端结构一致
  - 涉及文件：`packages/py_schemas/`、`packages/ts-shared/src/types/`
  - 验收条件：前端API函数返回的对象包含所有预期字段，无undefined值
  - 复杂度：低 | 风险：低

## 3. 认证状态跨端共享（阶段二延续，P0-核心功能）

> 目标：确保Cookie认证机制在前后端之间正确传递，登录/登出状态同步
> 依赖：阶段二网络配置完成后（代理和CORS配置正确才能传递Cookie）
> 风险：Cookie SameSite属性配置不当（中概率，开发环境使用Lax缓解）

- [ ] 确保后端登录接口成功后通过 `Set-Cookie` 写入认证Cookie，配置合适的 `SameSite=Lax`（开发环境）和 `HttpOnly` 属性
  - 涉及文件：`apps/api-server/app/api/v1/auth.py`、`apps/api-server/app/services/auth_service.py`
  - 验收条件：登录成功后浏览器Cookie中包含认证session，后续请求自动携带
  - 复杂度：中 | 风险：中（SameSite配置需与CORS协调）

- [ ] 确保后端登出接口清除Cookie（Set-Cookie空值 + 过期），前端清除Zustand全局用户状态后跳转登录页
  - 涉及文件：`apps/api-server/app/api/v1/auth.py`、`apps/web-client/src/features/auth/`
  - 验收条件：登出后Cookie被清除，前端store重置为未登录状态，页面跳转至/login
  - 复杂度：低 | 风险：低

- [ ] 实现前端登录成功后的状态同步：调用 `getCurrentUser` 获取完整用户信息并更新Zustand store，确保所有页面组件可访问当前用户数据
  - 涉及文件：`apps/web-client/src/features/auth/`、`apps/web-client/src/shared/store/`
  - 验收条件：登录成功后store中用户状态包含user_id、roles、tenant_id等完整信息
  - 复杂度：中 | 风险：低

- [ ] 实现开发环境Mock降级：VITE_MODE=development时 `getCurrentUser` 返回Mock用户对象，不发送网络请求
  - 涉及文件：`apps/web-client/src/features/auth/api/` 或对应hooks
  - 验收条件：VITE_MODE=development时getCurrentUser返回Mock数据，无网络请求
  - 复杂度：低 | 风险：低

## 4. 统一启动脚本（阶段三，P1-开发体验）

> 目标：提供一键启动开发环境的统一控制台方案
> 依赖：阶段一完成后（workspace配置正确才能安装和启动服务）
> 风险：启动脚本跨平台兼容问题（中概率，Windows优先测试缓解）

- [ ] 实现 `scripts/utils/process_utils.py` 跨平台进程管理模块：`start_process(cmd)` 启动子进程（Linux/macOS使用os.setsid，Windows使用CREATE_NEW_PROCESS_GROUP）；`graceful_terminate(proc, timeout)` 优雅终止（Linux: os.killpg→SIGKILL，Windows: taskkill /F /T）；`is_process_alive(proc)` 存活检测
  - 涉及文件：`scripts/utils/process_utils.py`
  - 验收条件：Windows/Linux/macOS均可安全启动和终止子进程，无僵尸进程残留
  - 复杂度：高 | 风险：中（Windows信号机制差异显著）

- [ ] 实现 `scripts/utils/check_utils.py` 前置检查模块：`check_env_file()` .env文件存在性；`check_python()` Python解释器就绪性；`check_node()` Node.js运行时就绪性（web启用时）；`check_database()` 数据库连通性Ping探测；`check_redis()` Redis连通性Ping探测；`check_port(port)` 端口占用检查
  - 涉及文件：`scripts/utils/check_utils.py`
  - 验收条件：缺少.env时提示"请从.env.example复制"；端口占用时报错；DB/Redis不可达时正确报错并中止启动
  - 复杂度：中 | 风险：低

- [ ] 实现 `scripts/utils/log_utils.py` 日志输出模块：颜色语义映射（GREEN=成功、YELLOW=警告、RED=错误、CYAN=信息）；`sys.stdout.isatty()` 检测终端颜色支持并自动降级；服务日志前缀固定宽度对齐（`[API   ]`/`[Worker]`/`[Web   ]`）；复用py-logger的 `get_logger`
  - 涉及文件：`scripts/utils/log_utils.py`
  - 验收条件：颜色语义正确；CI管道中输出纯文本无ANSI码；日志前缀对齐
  - 复杂度：中 | 风险：低

- [ ] 实现 `scripts/utils/__init__.py` 和 `scripts/__init__.py` 模块初始化
  - 涉及文件：`scripts/utils/__init__.py`、`scripts/__init__.py`
  - 验收条件：utils模块可被scripts下其他脚本正确导入
  - 复杂度：低 | 风险：低

- [ ] 实现 `scripts/start.py` 主入口：argparse参数解析（--services/--no-check/--log-level）；交互式菜单（无参数时展示）；三阶段控制台布局（前置检查→服务启动→运行中）；SIGINT/SIGTERM信号处理；按启动逆序终止子进程
  - 涉及文件：`scripts/start.py`
  - 验收条件：`start.py --services api,worker` 仅启动指定服务；无参数时展示交互式菜单；Ctrl+C安全终止所有服务
  - 复杂度：高 | 风险：中（信号处理和进程编排逻辑复杂）

- [ ] 实现 `scripts/start_api.py` 子启动脚本：拉起FastAPI服务（uvicorn），重定向stdout/stderr到logs/api.log，使用process_utils启动进程
  - 涉及文件：`scripts/start_api.py`
  - 验收条件：API服务可独立启动，PID正确记录，日志输出到logs/api.log
  - 复杂度：低 | 风险：低

- [ ] 实现 `scripts/start_worker.py` 子启动脚本：拉起Celery Worker，重定向stdout/stderr到logs/worker.log
  - 涉及文件：`scripts/start_worker.py`
  - 验收条件：Worker服务可独立启动，日志输出到logs/worker.log
  - 复杂度：低 | 风险：低

- [ ] 实现 `scripts/start_web.py` 子启动脚本：拉起Vite开发服务器（pnpm dev），重定向stdout/stderr到logs/web.log
  - 涉及文件：`scripts/start_web.py`
  - 验收条件：Web服务可独立启动，日志输出到logs/web.log
  - 复杂度：低 | 风险：低

- [ ] 创建 `logs/` 目录和占位日志文件（api.log/web.log/worker.log），确保日志重定向目标存在
  - 涉及文件：`logs/`、`logs/api.log`、`logs/web.log`、`logs/worker.log`
  - 验收条件：logs目录存在，启动脚本可将日志重定向至对应文件
  - 复杂度：低 | 风险：低

- [ ] 更新根目录 `package.json` 的 `dev` 脚本指向 `python scripts/start.py`，确保 `npm run dev` 调用统一启动脚本
  - 涉及文件：`package.json`
  - 验收条件：`npm run dev` 执行 `python scripts/start.py`，触发统一启动控制台
  - 复杂度：低 | 风险：低

## 5. 注释与代码规范落地（阶段四，P1-工程质量）

> 目标：通过工具强制执行代码注释和提交规范
> 依赖：阶段一完成后（workspace配置正确后Ruff/ESLint才能正确安装）
> 风险：Ruff/ESLint严格模式导致现有代码大量报错（高概率，渐进式启用缓解）

- [ ] 在根目录 `pyproject.toml` 中启用Ruff Docstring检查：在 `[tool.ruff.lint]` 的select中添加"D"系列规则，配置 `[tool.ruff.lint.pydocstyle]` convention = "google"
  - 涉及文件：`pyproject.toml`
  - 验收条件：缺少Docstring的代码提交被Ruff检测到
  - 复杂度：低 | 风险：中（严格模式可能大量报错，建议先warn后error）

- [ ] 配置前端ESLint `eslint-plugin-jsdoc` 插件：启用 `jsdoc/require-jsdoc`、`jsdoc/require-param`、`jsdoc/require-returns` 规则（warn级别）
  - 涉及文件：`apps/web-client/eslint.config.js`（或对应ESLint配置文件）
  - 验收条件：缺少TSDoc的组件/函数提交时输出warn提示
  - 复杂度：低 | 风险：中

- [ ] 配置 Husky + Commitlint：安装Husky Git Hooks，配置 `commitlint.config.js` 使用 `@commitlint/config-conventional`，定义scope-enum（auth/notice/member/student/tenant/activity/knowledge/agent/api/worker/web/scripts/config）
  - 涉及文件：`.husky/pre-commit`、`.husky/commit-msg`、`commitlint.config.js`、`package.json`
  - 验收条件：不符合Conventional Commits格式的提交被拦截
  - 复杂度：中 | 风险：低

- [ ] 补充现有后端代码的Google Style Docstring：为api-server和ai-worker中缺少Docstring的public函数、类、模块补充注释，路由装饰器补充summary/description
  - 涉及文件：`apps/api-server/app/`、`apps/ai-worker/src/ai_worker/`
  - 验收条件：现有后端代码通过 `ruff check .` 无D系列错误
  - 复杂度：高 | 风险：低（工作量较大但风险低）

- [ ] 补充现有前端代码的TSDoc/JSDoc注释：为React组件添加功能说明和Props注释，为自定义Hook添加入参和返回值说明，为复杂工具函数添加注释
  - 涉及文件：`apps/web-client/src/` 下各组件和Hook文件
  - 验收条件：现有前端代码通过ESLint jsdoc规则检查无warn
  - 复杂度：高 | 风险：低（工作量较大但风险低）

- [ ] 补充Python共享包代码的Google Style Docstring：为packages/下7个Python包的public API补充注释
  - 涉及文件：`packages/py-config/`、`packages/py-db/`、`packages/py-schemas/`、`packages/py-ai-engine/`、`packages/py-logger/`、`packages/py-auth/`、`packages/py-messaging/`
  - 验收条件：共享包代码通过Ruff Docstring检查
  - 复杂度：中 | 风险：低

- [ ] 审计并补充代码中的TODO/FIXME/HACK/NOTE特殊标记格式：确保格式为"关键字(责任人): 说明 [关联Issue/日期]"
  - 涉及文件：全项目代码
  - 验收条件：所有特殊标记符合规范格式
  - 复杂度：低 | 风险：低

## 6. 日志规范全面落地（阶段五，P1-可观测性）

> 目标：后端所有日志输出统一使用py-logger结构化格式，消除裸print和字符串拼接
> 依赖：阶段一完成后（共享包安装正确后py-logger可正确引用）
> 风险：except Exception裸捕获分布广泛（中概率，分批修复缓解）

- [ ] 审计并替换所有裸 `print()` 调用为 `logger.info/warning/error` 调用：扫描 `apps/` 和 `packages/` 目录下所有Python文件
  - 涉及文件：`apps/api-server/`、`apps/ai-worker/`、`packages/` 下所有.py文件
  - 验收条件：`grep -r "print(" apps/ packages/` 无结果（排除test文件和调试用途）
  - 复杂度：中 | 风险：低

- [ ] 审计并替换所有字符串拼接日志为结构化键值格式：将 `logger.info("用户 %s 登录成功" % username)` 替换为 `logger.info("auth_login_succeeded", username=username)`
  - 涉及文件：`apps/api-server/`、`apps/ai-worker/`、`packages/` 下所有.py文件
  - 验收条件：所有日志输出为键值对格式，无字符串拼接/格式化
  - 复杂度：中 | 风险：低

- [ ] 审计并替换所有 `except Exception` 裸捕获为精确异常类型，确保每个except块有对应日志输出
  - 涉及文件：`apps/api-server/`、`apps/ai-worker/`、`packages/` 下所有.py文件
  - 验收条件：无 `except Exception` 裸捕获，所有异常分支有warning/error日志输出
  - 复杂度：高 | 风险：中（需逐个分析异常类型，工作量大）

- [ ] 在 `py_logger/events.py` 中新增通知模块事件名定义：notice_parse_succeeded/failed、notice_send_succeeded/failed、notice_confirm_succeeded/failed等，及对应reason枚举
  - 涉及文件：`packages/py-logger/py_logger/events.py`
  - 验收条件：events.py包含通知模块事件名和reason枚举
  - 复杂度：低 | 风险：低

- [ ] 在 `py_logger/events.py` 中新增知识库/Agent等P1/P2预留模块事件名定义：knowledge_upload_succeeded/failed、agent_task_succeeded/failed等
  - 涉及文件：`packages/py-logger/py_logger/events.py`
  - 验收条件：events.py包含P1/P2预留模块事件名
  - 复杂度：低 | 风险：低

- [ ] 审计日志中的敏感信息泄漏：搜索并移除日志输出中包含password/token原文/secret_key/api_key原文/完整身份证号等敏感字段值的语句
  - 涉及文件：`apps/`、`packages/` 下所有.py文件
  - 验收条件：日志中不包含敏感信息原文，仅记录token_type等非敏感标识
  - 复杂度：中 | 风险：中（需仔细审查，遗漏有安全风险）

- [ ] 验证日志级别语义正确性：info用于成功事件，warning用于业务失败（系统可继续），error用于系统异常/关键流程失败
  - 涉及文件：`apps/`、`packages/` 下所有.py文件
  - 验收条件：日志级别使用符合info/warning/error语义约定，无级别混用
  - 复杂度：低 | 风险：低

## 7. 目录结构与基础设施对齐（阶段一延续，P0-基础优先）

> 目标：确保项目目录结构完全符合项目结构规范，消除散落文件
> 依赖：无前置依赖（可与阶段一并行）
> 风险：低

- [ ] 检查并创建规范要求的顶层目录：`infrastructure/`（docker/nginx/observability）、`docs/`、`data/`、`tmp/`
  - 涉及文件：`infrastructure/`、`infrastructure/docker/`、`infrastructure/nginx/`、`infrastructure/observability/`、`docs/`、`data/`、`tmp/`
  - 验收条件：顶层目录结构仅包含apps/、packages/、infrastructure/、docs/、tests/、scripts/、data/、logs/、tmp/及配置文件
  - 复杂度：低 | 风险：低

- [ ] 确保根目录包含 `main.py`（项目根级入口，预留或快捷启动）、`.env.example`、`docker-compose.yml`、`.gitignore`
  - 涉及文件：`main.py`、`.env.example`、`docker-compose.yml`、`.gitignore`
  - 验收条件：根目录包含上述必要文件
  - 复杂度：低 | 风险：低

- [ ] 检查并清理根目录散落的应用专属配置文件：确保vite.config.js、uvicorn配置等保留在对应子项目内，不在根目录散落
  - 涉及文件：根目录文件列表
  - 验收条件：根目录不包含应用专属配置文件
  - 复杂度：低 | 风险：低

- [ ] 验证apps/目录包含3个应用（web-client、api-server、ai-worker），packages/目录包含9个共享包（7个Python + 2个TypeScript）
  - 涉及文件：`apps/`、`packages/`
  - 验收条件：apps/包含3个子目录，packages/包含9个子目录
  - 复杂度：低 | 风险：低

- [ ] 验证前端Feature-Based聚合结构：确认 `web-client/src/features/` 包含auth/notice/member/student/tenant等业务feature子目录，且每个子目录内含api/hooks/components等自治子结构
  - 涉及文件：`apps/web-client/src/features/`
  - 验收条件：features/目录结构符合Feature-Based聚合规则
  - 复杂度：低 | 风险：低

- [ ] 验证后端三层架构结构：确认api-server包含api/v1/（Router）、services/（Service）、repositories/（Repository）、dependencies/、middleware/、tasks/目录，services/不直接操作数据库
  - 涉及文件：`apps/api-server/app/`
  - 验收条件：目录结构符合三层架构规则，无跨层调用
  - 复杂度：低 | 风险：低

## 8. 集成验证与回归测试（全阶段，P0+P1）

> 目标：验证各阶段任务的集成效果，确保不破坏现有功能
> 依赖：各阶段任务完成后
> 风险：低

- [ ] 验证全栈启动流程：执行 `npm run dev`，确认前端（5173）、后端API（8000）、Worker三个服务同时启动并输出就绪信号
  - 涉及文件：无新文件，验证步骤
  - 验收条件：30秒内完成全栈启动，控制台呈现三阶段布局
  - 复杂度：低 | 风险：低

- [ ] 验证API对接完整性：从前端发起auth/notice/consult等域的API请求，确认请求到达后端并返回正确响应
  - 涉及文件：无新文件，验证步骤
  - 验收条件：所有API端点对接成功，无404/422/401错误（除预期错误外）
  - 复杂度：中 | 风险：低

- [ ] 验证SSE流式响应：从前端发起AI对话请求，确认SSE事件逐段返回，message/topic/sources/done事件正确处理
  - 涉及文件：无新文件，验证步骤
  - 验收条件：对话界面内容实时增长，完成信号正确触发
  - 复杂度：中 | 风险：低

- [ ] 验证Cookie认证全流程：登录→请求携带Cookie→401拦截跳转→登出清除状态
  - 涉及文件：无新文件，验证步骤
  - 验收条件：认证流程完整，Cookie正确传递和清除
  - 复杂度：中 | 风险：低

- [ ] 验证启动脚本Ctrl+C优雅退出：启动全栈服务后按Ctrl+C，确认所有子进程被安全终止，无僵尸进程
  - 涉及文件：无新文件，验证步骤
  - 验收条件：退出后无残留Python/Node进程
  - 复杂度：低 | 风险：低

- [ ] 验证代码规范工具链：提交缺少Docstring的代码和不符合Conventional Commits的提交信息，确认Git Hook正确拦截
  - 涉及文件：无新文件，验证步骤
  - 验收条件：不规范提交被拦截并提示修正
  - 复杂度：低 | 风险：低

- [ ] 运行全量测试：执行 `npm run test`（前端Vitest + 后端pytest），确认测试通过率不低于基线
  - 涉及文件：无新文件，验证步骤
  - 验收条件：前端和后端测试全部通过（或失败率不超过基线）
  - 复杂度：中 | 风险：中（现有测试可能因结构调整而失败，需修复）

- [ ] 验证现有开发工作流向后兼容：确认原有的单独启动命令（如直接运行uvicorn、pnpm dev）仍然可用
  - 涉及文件：无新文件，验证步骤
  - 验收条件：原有开发工作流不因Monorepo调整而中断
  - 复杂度：低 | 风险：低
