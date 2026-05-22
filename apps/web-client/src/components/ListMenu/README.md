# ListMenu 通用组件

## 组件简介
ListMenu 是一个配置驱动的功能列表组件，支持分组（仅间隔）、图标（Antd 图标库）、描述、右侧箭头、点击事件。适用于个人中心等页面功能项的统一展示。

## Props
| 名称         | 类型           | 说明                       |
| ------------ | -------------- | -------------------------- |
| items        | Array          | 功能项配置，见下方结构     |
| onItemClick  | Function       | 点击项时回调，参数为 item  |
| className    | String         | 自定义样式类名（可选）     |

### items 配置结构
```js
[
  [ // 第一组
    {
      key: 'history',
      icon: <ClockCircleOutlined />,
      title: '历史记录',
      desc: '查看历史操作',
    },
    {
      key: 'star',
      icon: <StarOutlined />,
      title: '收藏知识库条目',
      desc: '已收藏内容',
    }
  ],
  [ // 第二组
    {
      key: 'setting',
      icon: <SettingOutlined />,
      title: '设置',
      desc: '个人偏好设置',
    }
  ]
]
```

## 示例代码
```jsx
import { ClockCircleOutlined, StarOutlined, SettingOutlined } from '@ant-design/icons';
import ListMenu from './index';

const items = [
  [
    {
      key: 'history',
      icon: <ClockCircleOutlined />,
      title: '历史记录',
      desc: '查看历史操作',
    },
    {
      key: 'star',
      icon: <StarOutlined />,
      title: '收藏知识库条目',
      desc: '已收藏内容',
    }
  ],
  [
    {
      key: 'setting',
      icon: <SettingOutlined />,
      title: '设置',
      desc: '个人偏好设置',
    }
  ]
];

<ListMenu
  items={items}
  onItemClick={item => {
    // 处理点击逻辑
    console.log(item.key);
  }}
/>
```

## 注意事项
- 图标建议统一使用 Antd 图标库，保证风格一致。
- 分组仅做间隔，不支持分组标题。
- 所有项默认展示右箭头，无需额外配置。
- items 支持多组，每组为一个数组，组间自动添加浅灰色分割线和适当间距，视觉更清晰。
- 分割线和间距在移动端和桌面端均有适配。
- 点击事件通过 onItemClick 回调处理。

## 版本记录
- 2026-01-13 v1.0 初版，支持分组、图标、描述、右箭头、点击。
