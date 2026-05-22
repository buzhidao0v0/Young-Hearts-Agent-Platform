
# SectionContainer 分区容器组件

SectionContainer 用于页面分区、分组和结构化承载功能模块，强调分区逻辑、弱化装饰，支持可选标题、描述、嵌套。适合首页、知识库、个人中心等页面的结构分组。

---

## 组件 API

| Prop         | 类型         | 说明                         |
| ------------ | ------------ | ---------------------------- |
| title        | ReactNode    | 分区标题（可选）             |
| description  | ReactNode    | 分区描述（可选）             |
| children     | ReactNode    | 分区内容                     |
| className    | string       | 自定义类名（可选）           |

---

## 用法示例

### 基本用法
```jsx
import SectionContainer from './SectionContainer';

<SectionContainer title="分区标题" description="分区描述">
  <div>内容区域</div>
</SectionContainer>
```

### 嵌套用法
```jsx
<SectionContainer title="外部分区" description="外部分区描述">
  <SectionContainer title="内部分区">嵌套内容</SectionContainer>
</SectionContainer>
```

### 结合 Card 组件
```jsx
<SectionContainer title="功能区">
  <Card title="功能1" />
  <Card title="功能2" />
</SectionContainer>
```

---

## 设计理念与典型场景

- **结构分区**：用于页面主结构分组、功能区块承载，提升页面层次感。
- **弱化装饰**：相比 Card，SectionContainer 更强调分区逻辑，弱化阴影和装饰。
- **嵌套支持**：可多层嵌套，适合复杂页面结构。
- **样式局部定义**：所有样式均为局部作用域，未引入全局变量。

### 典型场景
- 首页功能入口分区
- 个人中心信息分组
- 知识库/专家墙等结构化内容区块

---

## 注意事项

- 建议用于页面主结构分区，不建议用于强调内容。
- 可与 Card 组件组合使用，Card 适合内容强调与卡片化展示。
- 支持自定义 className 进行样式扩展。
- 分区间自动有分隔线，嵌套时注意内外间距。

---

## 版本记录

- 2026-01-12 v1.0 初版实现与文档
