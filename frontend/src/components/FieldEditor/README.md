# FieldEditor 通用字段编辑组件

## 功能简介
- 支持 input、segmented、switch 三种类型字段的编辑
- 通过 type/config/value/onChange/error 统一接口驱动
- 便于扩展更多字段类型

## 用法示例

### 在组件中引入
```jsx
import FieldEditor from '../../components/FieldEditor';
```

### Input 类型
```jsx
<FieldEditor
  type="input"
  config={{ placeholder: '请输入昵称' }}
  value={nickname}
  onChange={setNickname}
  error={errorMsg}
/>
```

### Segmented 类型
```jsx
<FieldEditor
  type="segmented"
  config={{ 
    options: [
      { label: '男', value: 'male' }, 
      { label: '女', value: 'female' }
    ] 
  }}
  value={gender}
  onChange={setGender}
/>
```

### Switch 类型
```jsx
<FieldEditor
  type="switch"
  config={{ 
    checkedText: '开启', 
    uncheckedText: '关闭' 
  }}
  value={isPublic}
  onChange={setIsPublic}
/>
```

## Props
| 名称    | 类型     | 说明           |
| ------- | -------- | -------------- |
| type    | string   | 字段类型 (input, segmented, switch) |
| config  | object   | 控件配置参数，直接传递给底层 antd-mobile 组件 |
| value   | any      | 当前值         |
| onChange| function | 值变更回调     |
| error   | string   | 错误提示消息，为空时不显示 |

## 扩展说明
如需支持更多类型：
1. 在 `src/components/FieldEditor/types.js` 中引入新组件并添加到 `FIELD_TYPE_MAP`。
2. 在 `src/components/FieldEditor/index.jsx` 的 `renderEditor` 方法中处理新类型的渲染逻辑（如果标准属性不兼容）。
