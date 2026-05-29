# 项目清理与README整合 - 编码任务清单

## 1. 阶段一验证：缓存与废弃文件清理

- [ ] 验证项目源码中不再存在 `__pycache__/` 目录和 `*.pyc` 文件（排除 node_modules、.git、.codeartsdoer）：运行 `find . -name "__pycache__" -not -path "*/node_modules/*" -not -path "./.git/*" -not -path "./.codeartsdoer/*"`，预期输出为空
- [ ] 验证项目源码中不再存在 `package-lock.json`（排除 node_modules）：运行 `find . -name "package-lock.json" -not -path "*/node_modules/*" -not -path "./.git/*"`，预期输出为空
- [ ] 验证根目录不再存在 `requirements.txt`
- [ ] 验证 `apps/web-client/openapi.json` 已删除，仅保留 `apps/api-server/openapi.json`
- [ ] 验证 `apps/api-server/LICENSE` 和 `apps/web-client/LICENSE` 已删除
- [ ] 验证 `规范/` 目录下文件已删除

## 2. 阶段一验证：.gitignore与.gitkeep

- [ ] 验证 `.gitignore` 包含所有必需模式：`__pycache__/`、`*.pyc`、`*.db`、`*.tmp`、`.vs/`、`package-lock.json`、`tmp/`、`logs/`、`data/`、`apps/web-client/dist/`
- [ ] 验证阶段一的 `.gitkeep` 文件均已存在：`data/.gitkeep`、`logs/.gitkeep`、`infrastructure/nginx/.gitkeep`、`infrastructure/observability/.gitkeep`

## 3. 阶段一验证：README重写与子README清理

- [ ] 验证根目录 `README.md` 包含7个必需章节：项目概述、技术栈、目录结构、快速开始、开发指南、部署说明、项目规范
- [ ] 验证 `README.md` 使用简体中文撰写（代码块和命令除外）
- [ ] 验证 `apps/` 和 `packages/` 下不再存在冗余 `README.md`（排除 node_modules）：运行 `find apps packages -maxdepth 4 -name "README.md" -not -path "*/node_modules/*"`，预期输出为空

## 4. 阶段二执行：删除 `.vs/` 目录

- [ ] 确认 `.vs/` 目录存在且包含 IDE 残留文件（CopilotSnapshots/、ProjectSettings.json、slnx.sqlite 等）
- [ ] 执行删除：`rm -rf .vs/`，删除整个 `.vs/` 目录
- [ ] 验证删除成功：`ls .vs/ 2>/dev/null` 预期返回错误（目录不存在）
- [ ] 确认 `.gitignore` 已包含 `.vs/` 模式，删除后不会被重新提交

## 5. 阶段二执行：删除 `apps/api-server/dev.db`

- [ ] 确认 `apps/api-server/dev.db` 文件存在（当前 45056 字节）
- [ ] 确认 dev.db 未被 SQLite 进程占用（API Server 未运行）
- [ ] 执行删除：`rm apps/api-server/dev.db`
- [ ] 验证删除成功：`ls apps/api-server/dev.db 2>/dev/null` 预期返回错误
- [ ] 确认 `.gitignore` 已包含 `*.db` 模式，删除后不会被重新提交

## 6. 阶段二执行：添加 `tmp/.gitkeep`

- [ ] 确认 `tmp/` 目录存在且缺少 `.gitkeep` 文件
- [ ] 执行添加：`touch tmp/.gitkeep`
- [ ] 验证 `tmp/.gitkeep` 文件已创建
- [ ] 验证 `.gitignore` 中 `tmp/` 模式不会忽略 `.gitkeep` 文件：如 `git add tmp/.gitkeep` 被忽略，需在 `.gitignore` 中添加例外规则 `!tmp/.gitkeep`

## 7. 阶段二执行：docs/目录与保留项确认

- [ ] 确认 `apps/web-client/docs/` 目录内容完整性（保留原位置，不迁移）
- [ ] 确认根目录 `main.py` 保留（快捷启动入口，仅3行代码）
- [ ] 确认 `apps/api-server/openapi.json` 保留（API规范单一权威来源）

## 8. 全局集成验证

- [ ] 验证 README 中目录结构章节与实际目录一致（每个提到的目录均实际存在）
- [ ] 验证 README 中未引用已删除的文件或目录路径（如 `规范/`、`package-lock.json`）
- [ ] 验证所有已删除文件可通过 Git 历史恢复（`git log --oneline -5` 确认回溯记录存在）
- [ ] 验证 Python 依赖安装正常：`uv sync --all-packages`
- [ ] 验证前端依赖安装正常：`pnpm install`
