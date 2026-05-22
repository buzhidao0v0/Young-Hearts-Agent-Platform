# 心青年智能体平台（前端） / Young Hearts Agent Platform (Frontend)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)
![React](https://img.shields.io/badge/react-18.3.1-blue?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/vite-7.2.4-blue?style=flat-square&logo=vite)
![License: GPLv3](https://img.shields.io/badge/license-GPLv3-blue?style=flat-square)

> **面向孤独症家庭与专业服务者的智能咨询与服务平台**

## 📖 简介 (Introduction)

“心青年”智能体平台是一款面向孤独症家庭与专业服务者的智能咨询与服务平台。前端采用 React + Vite 构建，核心聚焦基于 **RAG（检索增强生成）** 引擎的专业知识在线问答。结合多角色统一服务中心设计，致力于提供包含智能康复咨询、知识库众包审核、志愿排班辅助及专家系统调度的全链条一站式响应服务体验。

## ✨ 主要功能 (Features)

- [x] **RAG 智能咨询引擎（核心）**：对接高精度向量库检索，提供专业咨询指导，并在每次会话中生成附带可溯源链接引用的答案。
- [x] **统一服务中心（工作台）**：告别陈旧的散落式后台页面，提供模块化的收纳入口，向多权限身份动态展示快捷功能卡片。
- [x] **细粒度 RBAC 体系与认证管控**：严密管控家属、志愿者、专家、管理员等角色的细化页面权限隔离及业务隐私数据过滤展示。
- [x] **知识可视查阅与入库审核工作流**：支持专业资料分阶段多渠道入库（人工/文档截取），实现内部专家对草案严密审核以及对外全公开可视查询。
- [ ] **志愿者全流程流转中心**：打通志愿者注册招募、班次预约统管及线上咨询工单任务认领等服务流。
- [ ] **专业资质验证与专家大厅**：专家完成严格的注册准入审核后，可主动承接和管理高复杂难度的咨询工单与知识纠错把关。
- [ ] **多端业务响应适配**：业务视觉及交互全面适配桌面端（PC）和移动端显示（H5）。

## 🛠 技术栈 (Tech Stack)

- **前端核心框架**：`React 18`, `Vite 7`
- **前端路由管控**：`React Router DOM 7`
- **UI 组件库**：`Ant Design Mobile 5`, `Vant Icons`, `React Markdown` （含 Remark GFM）
- **开发与工程校验规范**：`ESLint 9`
- **自动化测试部署**：单元及组件级测试框架 `Vitest 4`, `Testing Library`
- **持久化及状态同步**：`Fetch API`, `js-cookie` (配合后端的 JWT 解包实现用户长连接)

## 📂 项目结构 (Project Structure)

```text
.
├── public/                # 浏览器静态资源与外部根植 HTML 框架
├── src/
│   ├── api/               # API 服务接口异步请求层级封装
│   ├── assets/            # 全局引入的通用媒体内容、SVG 或基础图标
│   ├── components/        # 全局高频复用的通用原子及复合型功能 UI 组件
│   ├── config/            # 前端统一硬配置声明（如 apiConfig 变量指引）
│   ├── hooks/             # 前端定制的各类复用数据流逻辑操作 Hook
│   ├── layouts/           # 隔离内外功能区的主体骨架拓扑（如响应式主导航等）
│   ├── pages/             # 以功能主线聚合同类逻辑的横向业务路由页面（如咨询、后台等）
│   ├── router/            # 前端导航总控机制引擎及鉴权路由中间件流向控制
│   ├── store/             # React 全局通用状态聚合容器（下发 Context、缓存数据字典）
│   ├── styles/            # 宏观的断点自适应样式表与 CSS 重置声明系统
│   ├── types/             # 为项目注入安全约束的共享 JS/TS 数据结构及泛型定义
│   └── utils/             # 高频轻量辅助工具函数及转换拦截器
├── docs/                  # 系统各核心场景搭建、路由架构与设计稿落地方案备忘册
├── .env                   # 本机核心参数下指常量库（基于环境独立生成配置）
├── eslint.config.js       # ESLint v9 代码合规检查策略体系文件
├── openapi.json           # Backend API 功能基建格式契约映射标准定义
├── package.json           # 项目基本身份与依赖包环境清单 
└── vite.config.js         # Vite 底层构建装配及外部环境打包代理文件
```

## 🚀 快速开始 (Getting Started)

### 前置要求 (Prerequisites)

准备下述终端执行环境：
- **Node.js**: 建议使用 `>= 18.0.0` 及以上的长期支持版
- 可流畅运行的 **npm**
- 具备基本的 **Git** 操作环境

### 安装依赖 (Installation)

1. **获取远端代码**：
   ```bash
   git clone <仓库远程地址>
   cd young-hearts-agent-platform-frontend-react
   ```

2. **静默拉取 Node.js 包资源**：
   ```bash
   npm install
   ```

### 环境变量与配置 (Configuration)

本项目依赖特定的连接参数定位后端服务调用端点，请在根目录新建 `.env`：

```dotenv
# .env 示例
VITE_MODE=development
VITE_API_BASE_URL=http://127.0.0.1:8000
```
> *(注意：请针对本地、公有测试及最终的主机环境替换相应的 `VITE_API_BASE_URL`，并切忌将敏感业务口令硬编码上传至远端开源仓库。)*

## 📖 使用指南 (Usage)

| 功能说明 | 运行命令 |
| --- | --- |
| **启动开发服务器** (带 HMR 热重载) | `npm run dev` |
| **代码规范检查** (驱动 ESLint) | `npm run lint` |
| **执行集成测试** (唤起 Vitest 测试套件) | `npm run test` |
| **极速构建打包产物** (输出至 `dist/`) | `npm run build` |
| **生产态前置预览** (基于 `dist/`) | `npm run preview` |

## 🔗 API 接口文档 (API Documentation)

平台后端基于 FastAPI 搭建，同时对外部业务请求接口统一了严谨周详的请求返回基态描述：
1. **静态定义**：参考根文件目录最外侧的 [openapi.json](./openapi.json) 定义快照。
2. **本地调试（推荐）**：如果您本地并网运行了后端的 FastAPI 服务，则可以直接叩动访问 `http://127.0.0.1:8000/docs` 阅读可互动的高级交互调试说明。

## 📜 许可证 (License)

本项目开源且受 **GNU GPLv3** 协议合规保护及二次开发使用防伪要求约束，欢迎大家借鉴与协同开发建设。

