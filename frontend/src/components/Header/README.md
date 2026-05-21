# Header 头部组件

基于 Ant Design Mobile NavBar 封装，统一主色、圆角、字体，支持主副标题、返回按钮、右侧操作区。

## Props
| 名称         | 类型                | 说明             |
| ------------ | ------------------- | ---------------- |
| title        | string（必填）      | 主标题           |
| subtitle     | string              | 副标题           |
| showBack     | boolean             | 是否显示返回按钮 |
| rightActions | ReactNode           | 右侧操作区       |
| children     | ReactNode           | 额外内容         |

## 用法示例
```jsx
import Header from './index';

<Header title="首页" subtitle="副标题" showBack rightActions={<span>设置</span>} />
```

## 注意事项
- 主色、圆角等通过 `src/styles/variables.css` 统一配置。
- 右侧操作区可自定义 ReactNode。
