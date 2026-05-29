# 规范合规优化 - 编码任务清单

> **基线**: commit ea15700 | **目标**: 消除7大差异域(D1-D7)的合规缺陷 | **预估总工时**: 15-20h

---

## Phase 0: infrastructure 目录补齐 (D4)

### Task 1: 创建 infrastructure 预留目录及 README
- **编号**: T1
- **优先级**: P2
- **预估工时**: 0.5h
- **风险等级**: 🟢 无风险
- **依赖**: 无
- **涉及文件**:
  - `infrastructure/__init__.py` (新建)
  - `infrastructure/docker/README.md` (新建)
  - `infrastructure/nginx/README.md` (新建)
  - `infrastructure/observability/README.md` (新建)
- **描述**: 在项目根目录创建 `infrastructure/` 目录及三个预留子目录（docker/、nginx/、observability/），每个子目录包含 README.md 说明当前为空预留及未来用途
- **验收标准**:
  - `infrastructure/docker/`、`infrastructure/nginx/`、`infrastructure/observability/` 均存在
  - 每个子目录包含 README.md 且内容说明为空预留
- **回退策略**: 直接删除 infrastructure/ 目录即可

---

## Phase 1: ai-worker 目录补齐 (D3)

### Task 2: 创建 ai-worker clients/ 目录及客户端封装
- **编号**: T2
- **优先级**: P1
- **预估工时**: 0.5h
- **风险等级**: 🟢 无风险
- **依赖**: 无
- **涉及文件**:
  - `apps/ai-worker/src/ai_worker/clients/__init__.py` (新建)
  - `apps/ai-worker/src/ai_worker/clients/dashscope_client.py` (新建)
  - `apps/ai-worker/src/ai_worker/clients/wxpusher_client.py` (新建)
  - `apps/ai-worker/src/ai_worker/clients/napcat_client.py` (新建)
- **描述**: 在 ai_worker/ 下创建 clients/ 目录，封装三方 API 客户端。DashScopeClient 提供 chat_completion/embed_texts 高层接口；WxPusherClient 和 NapCatClient 封装 HTTP 调用逻辑（重试、超时、错误处理），内部调用 py-ai-engine / py-messaging
- **验收标准**:
  - `clients/` 目录存在且包含 `__init__.py`、`dashscope_client.py`、`wxpusher_client.py`、`napcat_client.py`
  - 每个客户端类含 Google Style Docstring 和基本方法签名
  - 客户端内部调用 py-ai-engine / py-messaging 的已有接口
- **回退策略**: 删除 clients/ 目录

### Task 3: 创建 ai-worker pipelines/ 目录及 Celery Beat 补齐
- **编号**: T3
- **优先级**: P1
- **预估工时**: 0.5h
- **风险等级**: 🟢 无风险
- **依赖**: 无
- **涉及文件**:
  - `apps/ai-worker/src/ai_worker/pipelines/__init__.py` (新建)
  - `apps/ai-worker/src/ai_worker/celery_app.py` (修改)
- **描述**: 创建 pipelines/ 预留目录（含 `__init__.py`），在 celery_app.py 中补齐 beat_schedule 配置（当前扫描周期 60 秒）
- **验收标准**:
  - `pipelines/` 目录存在且含 `__init__.py`
  - `celery_app.py` 包含 `beat_schedule` 配置项
- **回退策略**: 删除 pipelines/ 目录，恢复 celery_app.py

---

## Phase 2: api-server 三层架构重组 (D1) — 🔴高风险，渐进迁移

### Task 4: 创建 repositories/ 和 dependencies/ 目录结构
- **编号**: T4
- **优先级**: P0
- **预估工时**: 0.5h
- **风险等级**: 🟢 无风险
- **依赖**: 无
- **涉及文件**:
  - `apps/api-server/app/repositories/__init__.py` (新建)
  - `apps/api-server/app/repositories/user_repository.py` (新建，空壳)
  - `apps/api-server/app/repositories/session_repository.py` (新建，空壳)
  - `apps/api-server/app/repositories/notice_repository.py` (新建，空壳预留)
  - `apps/api-server/app/dependencies/__init__.py` (新建)
  - `apps/api-server/app/dependencies/deps.py` (新建，空壳)
  - `apps/api-server/app/services/notice_service.py` (新建，空壳预留)
  - `apps/api-server/app/services/tenant_service.py` (新建，空壳预留)
- **描述**: 创建 Repository 层和 Dependencies 层的目录骨架。user_repository.py / session_repository.py 仅含方法签名和 Docstring；deps.py 仅含 get_db / get_current_user / require_roles 函数签名；notice_service.py / tenant_service.py 为预留空壳
- **验收标准**:
  - `repositories/` 和 `dependencies/` 目录存在
  - 所有文件含 `__init__.py` 和基本方法签名
  - 新文件均含 Google Style Docstring
- **回退策略**: 删除新建目录

### Task 5: 实现 user_repository.py — 从 user_service.py 抽取数据访问逻辑
- **编号**: T5
- **优先级**: P0
- **预估工时**: 1h
- **风险等级**: 🟡 中
- **依赖**: T4
- **涉及文件**:
  - `apps/api-server/app/repositories/user_repository.py` (实现)
  - `apps/api-server/app/services/user_service.py` (参考，不修改)
- **描述**: 从 user_service.py 中抽取所有 db.query / db.add / db.commit 调用，封装为 user_repository.py 的函数：get_by_username、get_by_id、create、update、delete。Repository 函数仅负责 ORM 操作，不含业务逻辑判断。默认注入 tenant_id 过滤条件
- **验收标准**:
  - user_repository.py 包含完整的 CRUD 函数实现
  - 每个 Repository 函数仅包含 ORM 查询/写入操作
  - 函数签名与 design.md 2.2 节接口定义一致
  - 含 Google Style Docstring
- **回退策略**: 清空 user_repository.py 为空壳，保留原有 user_service.py 不变

### Task 6: 实现 session_repository.py — 从 auth.py 抽取会话数据访问逻辑
- **编号**: T6
- **优先级**: P0
- **预估工时**: 1h
- **风险等级**: 🟡 中
- **依赖**: T4
- **涉及文件**:
  - `apps/api-server/app/repositories/session_repository.py` (实现)
  - `apps/api-server/app/api/v1/routes/auth.py` (参考，不修改)
- **描述**: 从 auth.py 路由文件中抽取所有与 Session 模型相关的 db 操作，封装为 session_repository.py 的函数：create_session、delete_by_session_id、get_by_session_id、get_user_by_session。确保 session 的 CRUD 操作从路由层分离到 Repository 层
- **验收标准**:
  - session_repository.py 包含完整的会话 CRUD 函数
  - 函数签名与 design.md 2.2 节一致
  - 含 Google Style Docstring
- **回退策略**: 清空 session_repository.py 为空壳

### Task 7: 实现 dependencies/deps.py — 集中依赖注入
- **编号**: T7
- **优先级**: P0
- **预估工时**: 1h
- **风险等级**: 🟡 中
- **依赖**: T5, T6
- **涉及文件**:
  - `apps/api-server/app/dependencies/deps.py` (实现)
  - `apps/api-server/app/db/session.py` (参考 get_db 实现)
- **描述**: 将散落在各路由文件中的 get_db、get_current_user、get_current_tenant、require_roles 等依赖注入项集中迁移至 deps.py。get_db 从 db/session.py 引用；get_current_user 从 Cookie/Header 提取 session_id 并验证；require_roles 为角色校验装饰器工厂
- **验收标准**:
  - deps.py 包含 get_db、get_current_user、get_current_tenant、require_roles
  - get_current_user 从 Cookie/Header 提取 session_id，调用 session_repository 验证
  - require_roles 接受角色列表，返回校验装饰器
  - 函数签名与 design.md 2.2 节一致
- **回退策略**: 清空 deps.py 为空壳，各路由保留原有依赖注入

### Task 8: 重构 auth.py 路由 — 移除 db 直接操作，改用 Service + Depends 注入
- **编号**: T8
- **优先级**: P0
- **预估工时**: 1.5h
- **风险等级**: 🔴 高
- **依赖**: T5, T6, T7
- **涉及文件**:
  - `apps/api-server/app/api/v1/routes/auth.py` (重构)
- **描述**: 重构 auth.py 路由文件：(1) 移除所有 db: Session 直接操作和 next(get_db()) 模式；(2) 改用 Depends(get_db) 注入数据库会话；(3) 所有业务逻辑委托至 auth_service.py；(4) 会话操作委托至 session_repository；(5) 权限校验改用 Depends(require_roles(...))。此为 D1 最核心的变更，必须确保 /api/auth/* 全部接口行为不变
- **验收标准**:
  - auth.py 中无直接 db.query / db.add / db.commit 调用
  - 无 next(get_db()) 模式
  - 所有路由使用 Depends 注入依赖
  - /api/auth/login、/api/auth/register、/api/auth/refresh 等接口行为不变（pytest 通过）
- **回退策略**: `git revert` 回退到迁移前 commit

### Task 9: 重构 auth_service.py — 移除 db 操作，改用 Repository 层
- **编号**: T9
- **优先级**: P0
- **预估工时**: 1h
- **风险等级**: 🔴 高
- **依赖**: T5, T6, T8
- **涉及文件**:
  - `apps/api-server/app/services/auth.py` (重构)
- **描述**: 将 auth_service.py 中所有 db.query / db.add / db.commit 调用替换为对应的 repository 函数调用。Service 层仅保留业务逻辑判断（密码校验、角色校验、会话创建决策等），数据访问完全委托 Repository
- **验收标准**:
  - auth_service.py 中无直接 db.query / db.add / db.commit
  - 所有数据访问通过 user_repository / session_repository 调用
  - 登录/注册/会话刷新逻辑行为不变
- **回退策略**: `git revert` 回退

### Task 10: 重构 user_service.py — 移除 db 操作，改用 Repository 层
- **编号**: T10
- **优先级**: P0
- **预估工时**: 0.5h
- **风险等级**: 🟡 中
- **依赖**: T5
- **涉及文件**:
  - `apps/api-server/app/services/user_service.py` (重构)
- **描述**: 将 user_service.py 中所有 db 操作替换为 user_repository 调用。Service 层仅保留业务逻辑（用户创建流程、角色分配决策等），事务控制（commit/rollback）保留在 Service 层
- **验收标准**:
  - user_service.py 中无直接 db.query / db.add / db.commit
  - 所有数据访问通过 user_repository 调用
  - 用户相关接口行为不变
- **回退策略**: `git revert` 回退

### Task 11: models/schemas/config 外迁至共享包 + 重导出兼容
- **编号**: T11
- **优先级**: P0
- **预估工时**: 1.5h
- **风险等级**: 🟡 中
- **依赖**: T8, T9, T10
- **涉及文件**:
  - `apps/api-server/app/models/__init__.py` (重写)
  - `apps/api-server/app/models/user.py` (重写为重导出)
  - `apps/api-server/app/schemas/__init__.py` (重写)
  - `apps/api-server/app/schemas/user.py` (重写为重导出)
  - `apps/api-server/app/core/config.py` (重写为重导出)
  - `packages/py-db/py_db/models/user.py` (确认/补充)
  - `packages/py-schemas/py_schemas/user.py` (确认/补充)
  - `packages/py-config/py_config/settings.py` (确认/补充)
- **描述**: (1) 确认 py-db/py_schemas/py-config 中已包含 User/Session/Settings 等定义，若缺失则从 api-server 迁移补充；(2) 将 api-server 的 models/user.py、schemas/user.py、core/config.py 改为纯重导出模式（from py_db.models.user import ...）；(3) 确保 api-server 内所有现有 import 路径不断裂。需特别注意 Settings 字段完整性约束（design.md 4.2 节）
- **验收标准**:
  - api-server 的 models/、schemas/、core/ 仅做重导出，不再定义模型/配置
  - 所有现有 import 路径正常工作
  - Settings 包含 api-server 所需全部字段
  - pytest 通过，无 ImportError
- **回退策略**: 保留原文件内容，仅添加重导出；如有循环引用则恢复原文件

### Task 12: 移除 knowledge/ 目录及所有引用
- **编号**: T12
- **优先级**: P0
- **预估工时**: 0.5h
- **风险等级**: 🟡 中
- **依赖**: T8
- **涉及文件**:
  - `apps/api-server/app/knowledge/` (删除整个目录)
  - `apps/api-server/app/main.py` (移除 knowledge 路由注册)
  - 其他引用 `app.knowledge` 的文件（如有）
- **描述**: (1) 全局搜索 `from app.knowledge` 和 `import app.knowledge`，逐一移除引用；(2) 检查 main.py 路由注册中是否有 knowledge 相关路由，如有则移除；(3) 删除 app/knowledge/ 整个目录（ingest.py、rag_pipeline.py、retriever.py、vectorstore/）；(4) 确认知识域功能由 ai-worker 承担（或记录为 P1 待实现）
- **验收标准**:
  - api-server/app/ 目录下不存在 knowledge/ 子目录
  - 全局搜索无 `from app.knowledge` 或 `import app.knowledge` 引用
  - main.py 中无 knowledge 路由注册
- **回退策略**: 恢复 knowledge/ 目录和所有引用

### Task 13: D1 集成验证 — 三层架构重组全量测试
- **编号**: T13
- **优先级**: P0
- **预估工时**: 0.5h
- **风险等级**: 🟡 中
- **依赖**: T4-T12
- **涉及文件**:
  - `apps/api-server/tests/` (运行)
- **描述**: 运行 api-server 全量 pytest，验证所有 /api/auth/* 接口行为不变。检查：(1) routes/ 中无直接 db 操作；(2) services/ 中无 db.query；(3) repositories/ 包含完整实现；(4) deps.py 包含所有依赖注入项；(5) models/schemas/config 重导出正常
- **验收标准**:
  - pytest 全量通过
  - routes/ 无 db.query/db.add/db.commit
  - services/ 无 db.query（通过 repository 调用）
  - 无循环引用错误
- **回退策略**: `git revert` 回退到 D1 变更前

---

## Phase 3: web-client Feature-Based 聚合 (D2) — 🔴高风险，渐进迁移

### Task 14: pages/ 迁移至 app/ 目录
- **编号**: T14
- **优先级**: P0
- **预估工时**: 1h
- **风险等级**: 🔴 高
- **依赖**: 无
- **涉及文件**:
  - `apps/web-client/src/pages/` (源)
  - `apps/web-client/src/app/auth/` (目标)
  - `apps/web-client/src/app/admin/` (目标预留)
  - `apps/web-client/src/app/h5/` (目标预留)
  - `apps/web-client/src/app/headless/` (目标预留)
  - `apps/web-client/src/app/landing/` (目标预留)
- **描述**: 使用 `git mv` 将 src/pages/ 内容迁移至 src/app/ 目录：(1) auth 相关页面迁移至 app/auth/；(2) 创建 admin/、h5/、headless/、landing/ 预留空壳目录；(3) 同步更新路由配置（App.jsx）中所有 import 路径从 pages/ → app/；(4) 迁移完成后删除原 pages/ 目录
- **验收标准**:
  - src/app/ 目录存在，包含 auth/ 子目录
  - src/pages/ 目录不存在
  - App.jsx 路由 import 路径已更新
  - 页面正常加载，无白屏
- **回退策略**: `git revert` 恢复 pages/ 目录

### Task 15: src/api/ 迁移至 src/shared/api/
- **编号**: T15
- **优先级**: P0
- **预估工时**: 0.5h
- **风险等级**: 🟡 中
- **依赖**: 无
- **涉及文件**:
  - `apps/web-client/src/api/` (源)
  - `apps/web-client/src/shared/api/` (目标)
  - 所有引用 `src/api/` 的组件文件
- **描述**: 使用 `git mv` 将 src/api/ 目录下所有文件（auth.js、consult.js、knowledge.js 等）迁移至 src/shared/api/，全局搜索替换所有 import 路径。确保 adminClient.ts / h5Client.ts 命名保持
- **验收标准**:
  - src/shared/api/ 包含原 src/api/ 下所有文件
  - src/api/ 目录不存在
  - 全局无断裂的 import 路径
- **回退策略**: 恢复 src/api/ 目录

### Task 16: src/store/ 合并至 src/shared/store/
- **编号**: T16
- **优先级**: P0
- **预估工时**: 0.5h
- **风险等级**: 🟡 中
- **依赖**: 无
- **涉及文件**:
  - `apps/web-client/src/store/` (源)
  - `apps/web-client/src/shared/store/` (目标)
  - 所有引用 `src/store/` 的组件文件
- **描述**: 将 src/store/ 下文件（consultSession.jsx、roleUtils.js、UserContext.jsx、useUser.js）合并至 src/shared/store/，全局搜索替换所有 import 路径。仅存放跨页面共享状态，页面级状态留在 feature 内部
- **验收标准**:
  - src/shared/store/ 包含原 src/store/ 下所有文件
  - src/store/ 目录不存在
  - 状态管理正常工作
- **回退策略**: 恢复 src/store/ 目录

### Task 17: 补齐 features/ 预留目录 + test/ 测试目录
- **编号**: T17
- **优先级**: P1
- **预估工时**: 0.5h
- **风险等级**: 🟢 无风险
- **依赖**: T14
- **涉及文件**:
  - `apps/web-client/src/features/auth/` (新建)
  - `apps/web-client/src/features/notice/` (新建)
  - `apps/web-client/src/features/member/` (新建)
  - `apps/web-client/src/features/student/` (新建)
  - `apps/web-client/src/features/tenant/` (新建)
  - `apps/web-client/src/features/activity/` (新建预留)
  - `apps/web-client/src/features/agent/` (新建预留)
  - `apps/web-client/src/test/` (新建及子目录)
- **描述**: (1) 补齐 features/ 下业务域目录（auth/、notice/、member/、student/、tenant/、activity/、agent/），每个含空 `__init__.js`；(2) 创建 src/test/ 目录，按业务域镜像源码结构（admin/、auth/、features/、components/、store/ 等）
- **验收标准**:
  - features/ 包含 auth/、notice/、member/、student/、tenant/、activity/、agent/ 目录
  - src/test/ 存在，包含镜像子目录结构
- **回退策略**: 删除新建目录

### Task 18: D2 集成验证 — 前端页面加载与路由测试
- **编号**: T18
- **优先级**: P0
- **预估工时**: 0.5h
- **风险等级**: 🟡 中
- **依赖**: T14, T15, T16, T17
- **涉及文件**:
  - `apps/web-client/src/App.jsx` (验证)
  - `apps/web-client/vite.config.ts` (验证)
- **描述**: 启动 dev server 验证：(1) 所有页面正常加载，无白屏；(2) 路由切换正常；(3) API 请求正常（shared/api/ 路径正确）；(4) 状态管理正常（shared/store/ 路径正确）；(5) 运行前端 vitest 确认无测试断裂
- **验收标准**:
  - dev server 正常启动
  - 所有路由页面正常渲染
  - API 请求和状态管理功能正常
  - vitest 通过
- **回退策略**: `git revert` 回退 D2 全部变更

---

## Phase 4: 日志规范对齐 (D6)

### Task 19: api-server main.py 增加 py-logger 初始化
- **编号**: T19
- **优先级**: P0
- **预估工时**: 0.5h
- **风险等级**: 🟡 低
- **依赖**: T13
- **涉及文件**:
  - `apps/api-server/app/main.py` (修改)
- **描述**: 在 main.py 的 lifespan 函数中增加 `configure_logging()` 调用初始化 py-logger。实现降级策略：若 py-logger 不可导入，降级为标准 logging 并输出警告
- **验收标准**:
  - lifespan 内包含 configure_logging() 调用
  - py-logger 不可用时降级为标准 logging
  - 应用正常启动
- **回退策略**: 移除 configure_logging() 调用

### Task 20: 替换 except Exception 为精确异常类型
- **编号**: T20
- **优先级**: P0
- **预估工时**: 0.5h
- **风险等级**: 🟡 中
- **依赖**: T13
- **涉及文件**:
  - `apps/api-server/app/api/v1/routes/auth.py` (修改，行132/146/155/165)
  - `apps/api-server/app/db/session.py` (修改，行23)
- **描述**: 按 design.md 1.3.16 节精确替换清单执行：(1) routes/auth.py 行132: `except Exception as e` → `except (IntegrityError, ValueError) as e`；(2) routes/auth.py 行146/155/165: `except Exception` → `except json.JSONDecodeError`；(3) db/session.py 行23: `except Exception` → `except (ImportError, AttributeError)`
- **验收标准**:
  - 全局搜索 apps/ 下无 `except Exception` 模式
  - 替换后的异常类型覆盖原 Exception 的实际可能异常
  - pytest 通过
- **回退策略**: 恢复原 except Exception

### Task 21: api-server 全量接入 py-logger + 补齐结构化事件日志
- **编号**: T21
- **优先级**: P0
- **预估工时**: 1.5h
- **风险等级**: 🟡 低
- **依赖**: T19, T20
- **涉及文件**:
  - `apps/api-server/app/services/auth.py` (修改)
  - `apps/api-server/app/services/user_service.py` (修改)
  - `apps/api-server/app/api/v1/routes/auth.py` (修改)
  - `apps/api-server/app/db/session.py` (修改)
  - `packages/py-logger/py_logger/events.py` (修改)
- **描述**: (1) 将 api-server 所有 Python 文件中的裸 print / 标准 logging 替换为 `from py_logger import get_logger`；(2) 补齐结构化事件日志：登录成功/失败输出 logger.info/warning + events 常量，用户创建输出 logger.info + events 常量；(3) 所有 raise HTTPException 前补齐 logger.warning/error；(4) 补齐 events.py 缺失事件常量（user_update_*、user_delete_*、session_*）；(5) 确保日志中无敏感信息（密码原文、Token 原文）
- **验收标准**:
  - apps/api-server/ 下无 `import logging`，无裸 print（除启动脚本外）
  - 所有 raise HTTPException 前有 logger.warning/error
  - events.py 包含补齐的事件常量
  - 无敏感信息记录
- **回退策略**: 保留原 logging/print，移除新增事件常量

### Task 22: ai-worker 全量接入 py-logger
- **编号**: T22
- **优先级**: P1
- **预估工时**: 0.5h
- **风险等级**: 🟡 低
- **依赖**: T19
- **涉及文件**:
  - `apps/ai-worker/src/ai_worker/tasks/*.py` (修改)
  - `apps/ai-worker/src/ai_worker/celery_app.py` (修改)
  - `apps/ai-worker/src/ai_worker/clients/*.py` (修改)
- **描述**: 将 ai-worker 所有 Python 文件中的裸 print / 标准 logging 替换为 py-logger 的 get_logger。确保 Worker 任务执行日志使用结构化格式
- **验收标准**:
  - apps/ai-worker/ 下无 `import logging`，无裸 print
  - 均通过 get_logger 产出日志
- **回退策略**: 保留原 logging/print

---

## Phase 5: 启动脚本规范对齐 (D5)

### Task 23: log_utils.py 基于 py-logger 重构 + 日志前缀固定宽度对齐
- **编号**: T23
- **优先级**: P1
- **预估工时**: 1h
- **风险等级**: 🟡 低
- **依赖**: T22
- **涉及文件**:
  - `scripts/utils/log_utils.py` (重构)
- **描述**: (1) log_utils.py 的日志输出改用 py-logger 封装（get_script_logger），替换裸 print；(2) 实现 print_service_log 日志前缀固定宽度对齐：按最长服务名（Worker=6）填充空格，确保日志正文对齐（如 `[API   ]`、`[Worker]`、`[Web   ]`）；(3) 实现降级：py-logger 不可用时回退为标准输出
- **验收标准**:
  - log_utils.py 使用 py-logger 封装
  - 多服务并发运行时日志前缀宽度一致
  - py-logger 不可用时降级正常
- **回退策略**: 恢复原 log_utils.py

### Task 24: start.py 增加 Banner 输出 + 退出阶段进度展示
- **编号**: T24
- **优先级**: P1
- **预估工时**: 1h
- **风险等级**: 🟡 低
- **依赖**: T23
- **涉及文件**:
  - `scripts/start.py` (修改)
  - `scripts/utils/log_utils.py` (补充 print_banner / print_shutdown_progress)
- **描述**: (1) 在 start.py 启动时输出方框 Banner（╔═══╗ 格式），包含项目名称居中显示；(2) Ctrl+C 退出时逐服务展示关闭进度："→ 正在终止 API 服务 (PID: 12345) ... ✔ 已关闭"，超时标注 "⚠ 强制终止"；(3) 确认 start_api.py / start_web.py / start_worker.py 无硬编码平台判断
- **验收标准**:
  - 启动时控制台首行输出方框 Banner
  - Ctrl+C 退出时逐服务展示关闭进度
  - start_api/start_web/start_worker 无 sys.platform 硬编码判断
- **回退策略**: 移除 Banner 输出和退出进度展示

### Task 25: 前置检查输出格式对齐 + 日志重定向
- **编号**: T25
- **优先级**: P1
- **预估工时**: 1h
- **风险等级**: 🟡 低
- **依赖**: T24
- **涉及文件**:
  - `scripts/utils/check_utils.py` (修改)
  - `scripts/start_api.py` (修改)
  - `scripts/start_worker.py` (修改)
  - `scripts/start_web.py` (修改)
- **描述**: (1) check_utils.py 前置检查输出格式对齐：检查项名称右对齐 + 状态左对齐（如 `  ✔  检查项名称        已就绪`）；(2) 各子服务的 stdout/stderr 重定向至 logs/ 目录下独立日志文件（logs/api.log、logs/worker.log、logs/web.log）；(3) logs/ 目录不存在时自动创建；(4) 日志文件写入权限不足时降级为仅控制台输出并警告
- **验收标准**:
  - 前置检查输出格式对齐规范
  - 服务运行时 logs/ 目录下生成对应日志文件
  - 写入权限不足时降级正常
- **回退策略**: 恢复原输出格式，移除日志重定向

---

## Phase 6: 注释规范对齐 (D7)

### Task 26: api-server 路由补齐 summary/description + Google Style Docstring
- **编号**: T26
- **优先级**: P1
- **预估工时**: 1h
- **风险等级**: 🟢 无风险
- **依赖**: T13
- **涉及文件**:
  - `apps/api-server/app/api/v1/routes/auth.py` (修改)
  - `apps/api-server/app/api/v1/routes/health.py` (修改，如有)
  - `apps/api-server/app/api/v1/routes/notices.py` (修改，如有)
- **描述**: 为所有 FastAPI 路由装饰器补齐 summary 和 description 参数；每个路由函数补齐 Google Style Docstring（含 Args、Returns、Raises 段落）。参照 design.md 1.3.20 节示例格式
- **验收标准**:
  - 所有 @router 装饰器含 summary 和 description
  - 所有路由函数含 Google Style Docstring
  - Swagger 文档正常显示
- **回退策略**: 移除新增注释

### Task 27: api-server Service/Repository/Dependencies 补齐 Docstring
- **编号**: T27
- **优先级**: P1
- **预估工时**: 1h
- **风险等级**: 🟢 无风险
- **依赖**: T13
- **涉及文件**:
  - `apps/api-server/app/services/auth.py` (修改)
  - `apps/api-server/app/services/user_service.py` (修改)
  - `apps/api-server/app/services/notice_service.py` (修改)
  - `apps/api-server/app/services/tenant_service.py` (修改)
  - `apps/api-server/app/repositories/user_repository.py` (修改)
  - `apps/api-server/app/repositories/session_repository.py` (修改)
  - `apps/api-server/app/repositories/notice_repository.py` (修改)
  - `apps/api-server/app/dependencies/deps.py` (修改)
- **描述**: 为所有 Service、Repository、Dependencies 层函数补齐 Google Style Docstring，说明业务逻辑的"为什么"。新建文件即应包含完整 Docstring
- **验收标准**:
  - services/ 和 repositories/ 下所有函数含 Docstring
  - Docstring 说明业务逻辑原因
  - deps.py 函数含完整 Docstring
- **回退策略**: 移除新增注释

### Task 28: api-server Pydantic 模型 + ORM 模型补齐 Docstring
- **编号**: T28
- **优先级**: P1
- **预估工时**: 0.5h
- **风险等级**: 🟢 无风险
- **依赖**: T11
- **涉及文件**:
  - `packages/py-schemas/py_schemas/user.py` (修改)
  - `packages/py-db/py_db/models/user.py` (修改)
- **描述**: (1) 为所有 Pydantic 模型补齐类 Docstring，每个 Field 补齐 title 和 description 参数；(2) 为所有 ORM 模型补齐类 Docstring
- **验收标准**:
  - 所有 Pydantic 模型含类 Docstring
  - Field 含 title/description
  - ORM 模型含类 Docstring
- **回退策略**: 移除新增注释

### Task 29: web-client 组件补齐 TSDoc + Hook 补齐 @param/@returns
- **编号**: T29
- **优先级**: P1
- **预估工时**: 1.5h
- **风险等级**: 🟢 无风险
- **依赖**: T18
- **涉及文件**:
  - `apps/web-client/src/app/**/*.jsx` / `*.tsx` (修改)
  - `apps/web-client/src/components/**/*.jsx` / `*.tsx` (修改)
  - `apps/web-client/src/hooks/**/*.ts` (修改)
  - `apps/web-client/src/features/**/*.jsx` / `*.tsx` (修改)
- **描述**: (1) 为所有 React 组件补齐 TSDoc 功能说明，Props 接口每个非显而易见属性补齐注释；(2) 为所有自定义 Hook 补齐 @param 和 @returns 注释；(3) 全局 TODO/FIXME/HACK/NOTE 标记检查，确保格式为 `关键字(责任人): 说明 [关联Issue/日期]`
- **验收标准**:
  - 所有 .tsx/.jsx 组件文件顶部含 TSDoc 功能说明
  - Props 接口含属性注释
  - Hook 含 @param/@returns
  - TODO/FIXME 标记格式合规
- **回退策略**: 移除新增注释

### Task 30: Ruff D 规则渐进收紧
- **编号**: T30
- **优先级**: P2
- **预估工时**: 0.5h
- **风险等级**: 🟢 无风险
- **依赖**: T26, T27, T28
- **涉及文件**:
  - `pyproject.toml` (修改 Ruff 配置)
- **描述**: 采用渐进策略收紧 Ruff D 规则：Phase 1 先忽略所有 D 规则（当前状态）；注释补齐后进入 Phase 2（仅忽略 D102/D103）；最终 Phase 3 全量开启。当前先配置为 Phase 2 阶段
- **验收标准**:
  - Ruff 配置中 D 规则处于 Phase 2 状态
  - CI 构建不因 D 规则报错而失败
- **回退策略**: 恢复 Ruff D 规则忽略配置

---

## Phase 7: 全量集成验证

### Task 31: 全量规范合规性验证
- **编号**: T31
- **优先级**: P0
- **预估工时**: 1h
- **风险等级**: 🟡 中
- **依赖**: T1-T30
- **涉及文件**:
  - 项目全量（验证）
- **描述**: 按 design.md 附录 B 验证检查清单逐项验证：(1) api-server 三层架构验证；(2) web-client Feature-Based 验证；(3) ai-worker 目录补齐验证；(4) infrastructure 目录验证；(5) 启动脚本验证（Banner/前置检查/日志前缀/退出进度/日志重定向）；(6) 日志规范验证（无裸 logging/print、无 except Exception、结构化事件）；(7) 注释规范验证（summary/description/Docstring/TSDoc）；(8) Ruff + ESLint 全量检查通过
- **验收标准**:
  - design.md 附录 B 所有检查项全部通过 ✓
  - Ruff（含 D/ANN 规则 Phase 2）检查通过
  - ESLint 检查通过
  - pytest + vitest 全量通过
- **回退策略**: 标记未通过项，制定修复计划

---

## 任务依赖关系图

```
T1 ──────────────────────────────────────────────────── Phase 0 (D4)
T2, T3 ──────────────────────────────────────────────── Phase 1 (D3)
T4 → T5 → T7 ─┐
T4 → T6 → T7 ─┤
               ├→ T8 → T9 → T11 → T12 → T13 ──────── Phase 2 (D1)
T5 ──────── T10┘
T14, T15, T16, T17 → T18 ───────────────────────────── Phase 3 (D2)
T13 → T19 → T21 ─┐
T13 → T20 → T21 ─┤
T19 → T22 ────────┤
                   ├→ T23 → T24 → T25 ─────────────── Phase 5 (D5)
T13 → T26, T27 ───┤
T11 → T28 ─────────┤
T18 → T29 ─────────┤
T26+T27+T28 → T30 ─┘
                   └→ T31 ─────────────────────────── Phase 7 (验证)
```

**关键并行点**: D1(T4-T13) 和 D2(T14-T18) 可并行执行；D6 需在 D1 完成后统一替换日志；D5 依赖 D6 完成 py-logger 复用；D7 依赖 D1+D2 目录结构稳定。

---

## 工时汇总

| Phase | 差异域 | 任务编号 | 预估工时 | 风险 |
|-------|--------|---------|---------|------|
| Phase 0 | D4: infrastructure | T1 | 0.5h | 🟢 |
| Phase 1 | D3: ai-worker | T2, T3 | 1h | 🟢 |
| Phase 2 | D1: api-server 重组 | T4-T13 | 7.5h | 🔴 |
| Phase 3 | D2: web-client 聚合 | T14-T18 | 3h | 🔴 |
| Phase 4 | D6: 日志规范 | T19-T22 | 3h | 🟡 |
| Phase 5 | D5: 启动脚本 | T23-T25 | 3h | 🟡 |
| Phase 6 | D7: 注释规范 | T26-T30 | 4.5h | 🟢 |
| Phase 7 | 全量验证 | T31 | 1h | 🟡 |
| **合计** | | **T1-T31** | **23.5h** | |
