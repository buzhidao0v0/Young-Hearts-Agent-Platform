# Message组件 Markdown 渲染研究报告

## 版本记录

| 日期 | 版本 | 修改内容 | 修改原因 |
|---|---|---|---|
| 2026-01-29 | v1.0 | 初始设计 | 响应用户需求，研究 Markdown 渲染方案 |

## 研究问题

用户新建任务，要求研究如何在 `message` 组件（具体为 `MessageBubble`）中实现 markdown 文本的正确渲染，以提升 AI 回复的可读性。

## 发现摘要

当前 `MessageBubble` 组件仅支持纯文本渲染，无法解析 Markdown 语法。
经检查 `package.json`，项目尚未引入任何 Markdown 渲染库。
**建议方案**：
1.  安装 `react-markdown` 作为核心渲染库。
2.  （可选）安装 `remark-gfm` 支持表格、删除线等扩展语法。
3.  修改 `MessageBubble` 组件，替换纯文本输出为 Markdown 组件。
4.  调整 CSS 以适配 Markdown 生成的 HTML 标签（如 `p`, `ul`, `code`）在气泡内的样式。

## 相关文件清单

|文件路径|作用说明|关键行号|
|---|---|---|
|`src/pages/consultation/MessageList/index.jsx`|消息气泡组件实现|L6-L15|
|`src/pages/consultation/MessageList/index.css`|消息列表样式文件|需新增 Markdown 样式|
|`package.json`|项目依赖配置|需新增依赖|

## 当前实现分析

### 1. 组件渲染逻辑

目前在 `src/pages/consultation/MessageList/index.jsx` 中，`MessageBubble` 组件的实现如下：

```javascript
// src/pages/consultation/MessageList/index.jsx L6-L15
function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`message-bubble ${isUser ? 'user' : 'ai'}`}>
      <div className="bubble-content">{message.content}</div>
      <div className="bubble-meta">{message.time}</div>
    </div>
  );
}
```

代码直接将 `message.content` 作为子节点渲染。这意味着如果后端返回：
`"Here is a list:\n- Item 1\n- Item 2"`
前端将直接显示这一串字符，而不会渲染为列表。

### 2. 依赖现状

读取 `package.json` 发现，当前依赖列表（`dependencies`）中仅包含：
- `@vant/icons`
- `antd-mobile`
- `js-cookie`
- `prop-types`
- `react`, `react-dom`, `react-router-dom`

**缺少 Markdown 解析库**。

## 架构洞察与改进建议

### 1. 引入 React Markdown

推荐使用生态最成熟的 `react-markdown`。

**Action**:
```bash
npm install react-markdown remark-gfm
```

### 2. 代码改造示例

改造后的 `MessageBubble` 应该如下所示：

```javascript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
  // 用户消息通常保持纯文本渲染即可，或者也支持 Markdown
  // 重点是 AI 消息（role !== 'user'）需要 Markdown 渲染
  
  return (
    <div className={`message-bubble ${isUser ? 'user' : 'ai'}`}>
      <div className="bubble-content markdown-body">
         {/* 使用 ReactMarkdown 包裹内容 */}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
      <div className="bubble-meta">{message.time}</div>
    </div>
  );
}
```

### 3. 样式隔离与适配

Markdown 渲染会生成 `<p>`, `<ul>`, `<ol>`, `<code>`, `<pre>` 等标签。
由于 `antd-mobile` 或全局 CSS 重置（`normalize.css` 等）可能会影响这些标签的默认样式，我们需要在 `.bubble-content` 或特定的 `.markdown-body` 类下重新定义样式，确保它们在移动端气泡这样狭小的空间内显示正常。

**样式风险点**：
- **边距（Margin）**：默认的 `<p>` 标签往往有较大的上下 margin，会导致气泡被撑得很大。建议将 `.bubble-content p:last-child` 的 margin 设为 0。
- **特定标签**：`pre` 和 `code` 可能会超出气泡宽度，需设置 `white-space: pre-wrap; word-break: break-all;` 或允许横向滚动。

## 潜在风险和边缘情况

1.  **XSS 攻击**：`react-markdown` 默认会转义 HTML，相对安全。但如果后续需要支持原生 HTML（`rehype-raw`），则必须引入 `rehype-sanitize` 进行清洗。目前暂不需要。
2.  **不完整的 Markdown**：在流式输出（Streaming）过程中，Markdown 文本可能被截断（例如 `**加粗` 还没闭合）。`react-markdown` 通常能较好地处理截断文本，不会导致应用崩溃，但样式可能会跳变（从无样式变为有样式）。
3.  **Bundle Size**：`react-markdown` 及其依赖会增加几 KB 到几十 KB 的打包体积，但在可接受范围内。

## 开放问题

- **代码高亮**：是否需要引入 `react-syntax-highlighter` 实现代码块的语法高亮？这会显著增加包体积。鉴于目前是移动端 H5 项目，可能简单的背景色区分即可，暂不强制要求引入高亮库。
- **链接处理**：Markdown 中的链接 `[link](url)` 点击后是当前窗口跳转还是新窗口打开？通常建议用 `target="_blank"`。

## 下一步行动计划

1.  在此任务文件夹下确认方案。
2.  执行 `npm install react-markdown remark-gfm`。
3.  修改 `src/pages/consultation/MessageList/index.jsx`。
4.  更新 `src/pages/consultation/MessageList/index.css` 适配样式。
