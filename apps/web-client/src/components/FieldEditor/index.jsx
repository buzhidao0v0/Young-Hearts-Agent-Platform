import React from 'react';
import PropTypes from 'prop-types';
import { Input, Switch, Segmented } from 'antd-mobile';
import { FIELD_TYPE_MAP } from './types';
import './index.css';

/**
 * 通用字段编辑组件 FieldEditor
 * @param {string} type 字段类型（input/segmented/switch）
 * @param {object} config 字段配置（如 options、placeholder 等）
 * @param {any} value 当前值
 * @param {function} onChange 值变更回调
 * @param {string} error 错误提示
 */
const FieldEditor = ({ type, config = {}, value, onChange, error }) => {
  const renderEditor = () => {
    const EditorComponent = FIELD_TYPE_MAP[type];
    if (!EditorComponent) return null;
    // input、segmented、switch 分别处理
    switch (type) {
      case 'input':
        return (
          <Input
            {...config}
            value={value}
            onChange={onChange}
            clearable
          />
        );
      case 'segmented':
        return (
          <Segmented
            {...config}
            value={value}
            onChange={onChange}
          />
        );
      case 'switch':
        return (
          <Switch
            {...config}
            checked={!!value}
            onChange={onChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="field-editor">
      {renderEditor()}
      {error && <div className="field-editor-error">{error}</div>}
    </div>
  );
};

FieldEditor.propTypes = {
  type: PropTypes.string.isRequired,
  config: PropTypes.object,
  value: PropTypes.any,
  onChange: PropTypes.func,
  error: PropTypes.string,
};

export default FieldEditor;
