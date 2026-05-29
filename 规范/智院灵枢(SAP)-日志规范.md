# 智院灵枢(SAP)-日志规范

## 1. 目标
- 统一后端结构化日志字段，便于检索、告警、审计与排障。
- 保证关键失败路径可观测，关键成功路径可追踪。
- 严禁裸异常处理。所有异常分支需要有明确异常类型，并在必要处输出日志。

## 2. 基础约束
- 日志库：统一使用 py-logger（get_logger）。
- 日志格式：结构化键值日志，不使用拼接字符串。
- 敏感信息：禁止记录密码、Token 原文、密钥、完整身份证号等敏感数据。
- 异常处理：
  - 禁止 except Exception。
  - 使用精确异常类型。
  - 在降级、拒绝、失败分支输出 warning 或 error。

## 3. 级别约定
- info：成功事件、状态变更完成。
- warning：业务失败但系统可继续运行（如鉴权失败、参数非法、对象未命中）。
- error：系统异常或关键流程失败（如数据库提交失败、不可恢复错误）。

## 4. 字段规范
通用字段建议：
- reason: 失败原因机器码（snake_case）。
- user_id: 当前用户 ID（若可获取）。
- tenant_id: 当前租户 ID（若可获取）。
- username: 用户名（仅非敏感标识）。
- role: 角色（如 SUPER_ADMIN）。
- student_id: 学生 ID（C 端身份链路）。
- token_type: token 类型（不记录 token 原文）。

说明：
- reason 使用可枚举值，避免自然语言长句。
- 同类事件保持字段稳定，便于告警规则复用。

## 5. 事件命名规范
- 统一使用小写下划线。
- 推荐前缀：
  - auth_*: 认证与会话
  - user_*: 用户管理
  - student_*: 学生身份验证
- 结果后缀：
  - *_succeeded
  - *_failed

## 6. 当前已落地事件清单（功能 1.1）

### 6.1 认证与会话
- auth_login_failed
- auth_login_succeeded
- auth_refresh_failed
- auth_refresh_succeeded
- auth_logout_failed
- auth_logout_succeeded
- auth_bootstrap_super_admin_exists
- auth_bootstrap_super_admin_created
- auth_bootstrap_super_admin_failed
- auth_token_user_extract_failed

### 6.2 鉴权依赖
- auth_resolve_user_failed
- auth_role_check_failed
- auth_tenant_context_failed

### 6.3 用户管理
- user_create_failed
- user_create_succeeded
- user_get_me_failed

### 6.4 学生验证
- student_verify_failed
- student_verify_succeeded

### 6.5 Token 与密码处理
- token_decode_failed
- token_decode_invalid_type
- password_hash_fallback_used
- password_verify_failed
- password_verify_fallback_parse_failed
- password_verify_fallback_invalid_iteration

## 7. 示例

```python
from py_logger import get_logger

logger = get_logger(__name__)

logger.warning(
    "auth_login_failed",
    username=username,
    reason="password_mismatch",
)

logger.info(
    "auth_login_succeeded",
    user_id=user.id,
    tenant_id=user.tenant_id,
    role=user.role.value,
)
```

## 8. 落地建议
- 新增业务模块时，先定义事件名与 reason 枚举，再写业务逻辑。
- 为 error 级别事件配置告警（如数据库提交失败、外部服务不可用）。
- 在集成测试中覆盖关键失败事件对应分支，确保日志不会因重构丢失。
