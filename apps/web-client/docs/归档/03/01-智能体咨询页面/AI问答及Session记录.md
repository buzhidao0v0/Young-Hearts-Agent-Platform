正在优化工具选择...

已在 代码库 中搜索 "AI问答 历史session 相关接口、数据模型、业务逻辑、技术栈"、17 结果

## 功能名称
AI问答及历史session

---

## 技术栈

- **后端框架**：FastAPI
- **ORM**：SQLAlchemy
- **数据校验**：Pydantic
- **数据库**：关系型数据库（如PostgreSQL/MySQL，具体见部署配置）
- **流式输出**：SSE（Server-Sent Events），建议支持WebSocket
- **鉴权**：基于用户身份（user_id、roles），支持管理员与普通用户权限区分

---

## 主要接口

### 1. 创建会话
- **路径**：`POST /api/consult/sessions`
- **请求体**：
  ```json
  {
    "topic": "string" // 可选，会话主题
  }
  ```
- **响应**：
  ```json
  {
    "id": 1,
    "user_id": 1,
    "topic": "xxx",
    "created_at": "...",
    "is_archived": false
  }
  ```
- **鉴权**：需登录，自动关联当前用户

---

### 2. 获取历史会话列表
- **路径**：`GET /api/consult/sessions`
- **参数**（Query）：
  - `page`（默认1）
  - `size`（默认20，最大100）
- **响应**：
  ```json
  {
    "items": [
      {
        "id": 1,
        "topic": "xxx",
        "created_at": "...",
        "is_archived": false
      }
    ],
    "total": 100
  }
  ```
- **鉴权**：普通用户仅能获取自己的会话，管理员可获取全部

---

### 3. 获取会话消息详情
- **路径**：`GET /api/consult/sessions/{id}`
- **响应**：
  ```json
  {
    "items": [
      {
        "id": 1,
        "role": "user|ai",
        "content": "xxx",
        "sources": [{ "title": "...", "id": 123, "score": 0.98 }],
        "created_at": "..."
      }
    ]
  }
  ```
- **鉴权**：普通用户仅能访问自己的会话，管理员可访问全部

---

### 4. 删除会话
- **路径**：`DELETE /api/consult/sessions/{id}`
- **鉴权**：同上

---

### 5. 发送消息并获取AI回复（流式）
- **路径**：`POST /api/consult/chat`
- **请求体**：
  ```json
  {
    "session_id": 1,
    "query": "string",
    "role": "user",
    "reasoning_effort": "string" // 可选
  }
  ```
- **响应**：SSE流式返回AI回复，消息自动持久化到ConsultationMessage
- **鉴权**：需登录，session_id归属校验

---

## 相关数据模型

### ConsultationSession
- `id`: Integer，会话ID
- `user_id`: Integer，所属用户
- `topic`: String，会话主题
- `created_at`: DateTime，创建时间
- `is_archived`: Boolean，是否归档

### ConsultationMessage
- `id`: Integer，消息ID
- `session_id`: Integer，所属会话
- `role`: String（'user'/'ai'）
- `content`: Text，消息内容（Markdown）
- `sources`: Array<Object>，RAG引用来源
- `created_at`: DateTime，创建时间

---

## 关键业务逻辑说明

- **会话与消息强关联**：所有消息必须归属于某个ConsultationSession
- **AI回复持久化**：AI回复内容及其sources字段需完整写入ConsultationMessage
- **权限控制**：普通用户仅能操作/查询自己的会话和消息，管理员可全量操作
- **分页**：历史会话与消息详情接口均支持分页，参数为`page`和`size`
- **流式输出**：AI回复采用SSE流式返回，前端需处理流式数据

---

## 其他注意事项

- **管理员判定**：`user.roles`包含'admin'即为管理员
- **接口参数与响应结构需严格对齐API文档**
- **引用卡跳转**：sources内的知识引用需支持前端跳转知识详情页
- **异常处理**：需对无权限、会话不存在等情况返回标准错误码与信息

---

如需更详细字段定义与示例，请参考项目内`docs/“心青年”智能体平台-数据模型与 API 设计.md`与`openapi.json`。