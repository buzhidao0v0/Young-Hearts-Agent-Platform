# BottomNav 底部导航栏组件

基于 Ant Design Mobile TabBar 封装，固定“首页”“我的”两项，支持主色、圆角、响应式。

## Props
| 名称       | 类型           | 说明                 |
| ---------- | -------------- | -------------------- |
| activeKey  | string（必填） | 当前激活 tab 的 key  |
| onTabChange| function（必填）| tab 切换回调         |
| safeArea   | boolean        | 是否适配安全区       |

## 用法示例
```jsx
import BottomNav from './index';

<BottomNav activeKey="home" onTabChange={key => setTab(key)} />
```

## 注意事项
- tabs 固定为“首页”“我的”，如需扩展请修改组件。
- 主色、圆角等通过 `src/styles/variables.css` 统一配置。
