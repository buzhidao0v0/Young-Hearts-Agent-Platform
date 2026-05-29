# 渐进收敛第五轮：Docstring 全量补齐 + Repository 重构 + Ruff ignore 收紧

## 1. Repository 重构：新增 repository 函数

- [ ] 在 `user_repository.py` 中新增 `create_user_with_profiles(db, user, volunteer_profile, expert_profile)` 函数，封装 db.add/db.flush/db.commit/db.refresh 原子性操作，包含 Google Style Docstring
- [ ] 在 `session_repository.py` 中新增 `get_valid_session(db, session_id)` 函数，复用已有 `get_by_session_id` 并内聚过期校验逻辑，包含 Google Style Docstring
- [ ] 在 `session_repository.py` 中优化 `get_user_by_session(db, session_id)` 函数，改为先调用 `get_valid_session` 再调用 `user_repository.get_user_by_id`，消除内部直接 db.query

## 2. Repository 重构：改造 auth_service

- [ ] 重构 `auth.py` 的 `register()` 函数：移除 db.add/db.flush/db.commit/db.refresh 共 6 处直接操作，改为调用 `user_repository.create_user_with_profiles()`，service 层仅负责对象组装
- [ ] 重构 `auth.py` 的 `get_current_user_from_context()` 函数：移除 db.query 共 2 处直接操作，改为调用 `session_repository.get_valid_session()` + `user_repository.get_user_by_id()`，过期校验逻辑下沉至 repository
- [ ] 补充 `auth.py` 顶部 import：新增 `from app.repositories.user_repository import create_user_with_profiles, get_user_by_id` 和 `from app.repositories.session_repository import get_valid_session`
- [ ] 移除 `auth.py` 中不再使用的 `SessionModel` 直接 import（如不再直接 query）

## 3. Docstring 补齐 Phase 1：D106 嵌套类（4处 → 0处）

- [ ] 运行 `ruff check --select D106` 定位 4 处嵌套类违规文件
- [ ] 为 4 处公开嵌套类补齐 docstring，说明其在所属外部类中的角色和职责
- [ ] 运行 `ruff check --select D106` 验证 0 违规

## 4. Docstring 补齐 Phase 2：D107 公开类 __init__（8处 → 0处）

- [ ] 运行 `ruff check --select D107` 定位 8 处 __init__ 违规文件
- [ ] 为 8 处公开类 __init__ 补齐 docstring：简单赋值型写 `"""初始化实例，设置核心属性。"""`
- [ ] 运行 `ruff check --select D107` 验证 0 违规

## 5. Docstring 补齐 Phase 3：D102 公开方法（8处 → 0处）

- [ ] 运行 `ruff check --select D102` 定位 8 处公开方法违规文件
- [ ] 为 8 处公开方法补齐 Google Style docstring（含 Args/Returns/Raises 段落）
- [ ] 运行 `ruff check --select D102` 验证 0 违规

## 6. Docstring 补齐 Phase 4：D101 公开类（43处 → 0处）

- [ ] 运行 `ruff check --select D101` 定位 43 处公开类违规文件
- [ ] 为 `packages/` 共享包中的 Pydantic 模型、SQLAlchemy 模型、配置类补齐类 docstring
- [ ] 为 `apps/api-server/` 中的 schemas、models、services 类补齐类 docstring
- [ ] 为 `scripts/` 中的类补齐类 docstring
- [ ] 为 `tests/` 中的测试类补齐类 docstring
- [ ] 运行 `ruff check --select D101` 验证 0 违规

## 7. Docstring 补齐 Phase 5：D100 模块 docstring（50处 → 0处）

- [ ] 运行 `ruff check --select D100` 定位 50 处模块 docstring 违规文件
- [ ] 为 `packages/` 共享包模块补齐模块 docstring（描述核心能力和对外暴露接口）
- [ ] 为 `apps/api-server/` 应用模块补齐模块 docstring（描述在整体架构中的定位）
- [ ] 为 `scripts/` 脚本模块补齐模块 docstring（描述运行场景和用途）
- [ ] 为 `tests/` 测试模块补齐模块 docstring（描述测试覆盖范围）
- [ ] 为 `__init__.py` 补齐模块 docstring：空包写 `"""包初始化。"""`，有导出写 `"""本包导出核心符号：xxx。"""`
- [ ] 运行 `ruff check --select D100` 验证 0 违规

## 8. Docstring 补齐 Phase 6：D103 公开函数（64处 → 0处）

- [ ] 运行 `ruff check --select D103` 定位 64 处公开函数违规文件
- [ ] 为 `schemas/user.py`（20处，最高违规密度）补齐 Google Style 函数 docstring
- [ ] 为 `check_utils.py`（8处）补齐函数 docstring
- [ ] 为 `routes/auth.py`（7处）补齐路由处理函数 docstring
- [ ] 为 `wxpusher.py`（7处）补齐函数 docstring
- [ ] 为 `log_utils.py`（7处）补齐函数 docstring
- [ ] 为 `auth.py`（6处）补齐函数 docstring
- [ ] 为 `models/user.py`（5处）补齐函数 docstring
- [ ] 为 `jwt_handler.py`（5处）补齐函数 docstring
- [ ] 为 `middleware.py`（5处）补齐函数 docstring
- [ ] 为 `py-db/models/user.py`（5处）补齐函数 docstring
- [ ] 为 `napcat.py`（5处）补齐函数 docstring
- [ ] 为 `process_utils.py`（5处）补齐函数 docstring
- [ ] 为其余违规文件补齐函数 docstring
- [ ] 运行 `ruff check --select D103` 验证 0 违规

## 9. Ruff ignore 列表渐进收紧

- [ ] 从 pyproject.toml ignore 列表中移除 D106，运行 `ruff check --select D106` 验证 0 违规
- [ ] 从 pyproject.toml ignore 列表中移除 D107，运行 `ruff check --select D107` 验证 0 违规
- [ ] 从 pyproject.toml ignore 列表中移除 D102，运行 `ruff check --select D102` 验证 0 违规
- [ ] 从 pyproject.toml ignore 列表中移除 D101，运行 `ruff check --select D101` 验证 0 违规
- [ ] 从 pyproject.toml ignore 列表中移除 D100，运行 `ruff check --select D100` 验证 0 违规
- [ ] 从 pyproject.toml ignore 列表中移除 D103，运行 `ruff check --select D103` 验证 0 违规
- [ ] 从 pyproject.toml ignore 列表中移除 D105（当前 0 违规），运行 `ruff check --select D105` 验证 0 违规
- [ ] 确认 pyproject.toml 最终 ignore 列表仅含 `["ANN101", "ANN102", "ANN401"]`

## 10. 验证与回归测试

- [ ] 运行 `ruff check` 全量检查，确认 0 违规（D100-D107 + 其他已有规则）
- [ ] 运行项目 pytest 测试套件，确认所有测试通过
- [ ] 检查 `auth.py` 中不存在 db.add/db.commit/db.flush/db.query/db.refresh/db.delete 直接调用
- [ ] 检查 `user_repository.py` 新增 `create_user_with_profiles` 函数 docstring 合规
- [ ] 检查 `session_repository.py` 新增 `get_valid_session` 函数 docstring 合规
- [ ] 手动验证注册流程：用户注册 → profile 创建 → 事务提交 等价性
- [ ] 手动验证认证流程：session 查找 → 过期校验 → 用户查找 等价性
