
# Card 组件

通用卡片组件，支持主卡/副卡/分类卡/专家卡多种风格，具备高度可复用性，适配首页、个人中心、知识库大厅、workplace 等页面入口卡片需求。支持插槽/props自定义内容、图标、按钮、状态、隐藏等，兼容响应式与无障碍，支持主题切换。

---

## Props
| 名称         | 类型     | 说明                       |
| ------------ | -------- | -------------------------- |
| type         | string   | 卡片类型：main/sub/category/expert，决定样式 |
| title        | node     | 标题内容                   |
| subtitle     | node     | 副标题内容                 |
| icon         | node     | 图标内容                   |
| buttonText   | string   | 按钮文本                   |
| onClick      | func     | 按钮点击事件               |
| disabled     | bool     | 是否禁用（禁用交互/样式变灰）|
| hidden       | bool     | 是否隐藏（不渲染）         |
| requiredRole | string/array | 需要的权限角色，未满足时不渲染 |
| children     | node     | 插槽/自定义内容            |

---

## 用法示例
```jsx
import Card from './index';


// 主卡片
<Card
  type="main"
  title="主卡片"
  subtitle="副标题"
  icon={<i className="iconfont icon-home" />}
  buttonText="操作"
  onClick={() => alert('点击')}
>
  <div>自定义内容</div>
</Card>

// 仅管理员可见的卡片
<Card
  title="仅管理员可见"
  requiredRole="admin"
>
  <div>只有 admin 角色用户能看到此卡片</div>
</Card>

// 禁用卡片
<Card
  type="sub"
  title="副卡片"
  disabled
  buttonText="禁用"
/>

// 分类卡片
<Card
  type="category"
  title="知识分类"
  subtitle="共12条"
  icon={<i className="iconfont icon-category" />}
/>

// 专家卡片
<Card
  type="expert"
  title="专家姓名"
  subtitle="心理咨询师"
  icon={<img src="/avatar.png" alt="avatar" style={{borderRadius: '50%'}} />}
  buttonText="预约"
  onClick={() => {}}
/>
```

---

## 交互与主题说明
- 支持 hover、active、focus、disabled 等交互状态，按钮与卡片均有视觉反馈。
- 支持响应式布局，移动端与 PC 端自适应。
- 支持无障碍：Tab 可聚焦，aria 属性友好，色彩对比度达标。
- 所有色彩、圆角、阴影等均通过 CSS 变量控制，便于主题切换。

## 注意事项
- type 决定卡片风格，默认 main。
- hidden 为 true 时组件不渲染。
- 支持 children 作为插槽扩展内容。
- 推荐配合全局 CSS 变量自定义主题。
