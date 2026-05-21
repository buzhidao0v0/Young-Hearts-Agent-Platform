// 字段类型与控件映射表
import { Input, Switch, Segmented } from 'antd-mobile';

export const FIELD_TYPE_MAP = {
  input: Input,
  segmented: Segmented,
  switch: Switch,
};

// 字段配置类型示例
// export const FIELD_CONFIGS = {
//   nickname: { type: 'input', config: { placeholder: '请输入昵称' } },
//   gender: { type: 'segmented', config: { options: ['男', '女'] } },
//   notify: { type: 'switch', config: { } },
// };
