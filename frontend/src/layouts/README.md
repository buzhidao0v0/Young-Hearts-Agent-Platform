# 布局组件 HomeLayout / SubLayout

统一页面结构，组合通用头部、底部导航与主内容区。

## HomeLayout
- 用于首页、个人中心等一级页面。
- 顶部为 Header，底部为 BottomNav，主内容区为 children。

### Props
| 名称         | 类型           | 说明                 |
| ------------ | -------------- | -------------------- |
| title        | string（必填） | 页面主标题           |
| subtitle     | string         | 副标题               |
| rightActions | ReactNode      | 头部右侧操作区       |
| children     | ReactNode      | 主内容区             |
| activeKey    | string（必填） | 当前激活 tab         |
| onTabChange  | function（必填）| tab 切换回调         |

## SubLayout
- 用于知识详情、设置等次级页面。
- 顶部为 Header（带返回），无底部导航，主内容区为 children。

### Props
| 名称         | 类型           | 说明                 |
| ------------ | -------------- | -------------------- |
| title        | string（必填） | 页面主标题           |
| subtitle     | string         | 副标题               |
| rightActions | ReactNode      | 头部右侧操作区       |
| children     | ReactNode      | 主内容区             |
| onBack       | function       | 返回按钮回调         |

## 用法示例
```jsx
import HomeLayout from './HomeLayout';
import SubLayout from './SubLayout';

<HomeLayout title="首页" activeKey="home" onTabChange={key => setTab(key)}>
  <div>内容</div>
</HomeLayout>

<SubLayout title="详情" onBack={() => navigate(-1)}>
  <div>内容</div>
</SubLayout>
```

## 注意事项
- 头部、底部样式由 `src/styles/variables.css` 控制。
- HomeLayout/ SubLayout 仅做结构组合，具体内容由业务页面传入。
