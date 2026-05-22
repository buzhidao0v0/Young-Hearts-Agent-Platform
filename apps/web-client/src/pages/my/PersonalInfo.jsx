import React, { useContext, useState } from 'react';
import { ListMenu } from '../../components/ListMenu';
import { UserContext } from '../../store/UserContext';
// import defaultAvatar from '../../assets/user.png';
import { Toast, Button, Dialog, Popup } from 'antd-mobile';
import FieldEditor from '../../components/FieldEditor';
import './PersonalInfo.css';

import { useNavigate } from 'react-router-dom';
import SubLayout from '../../layouts/SubLayout';

// 校验函数集合
const validators = {
  required: (val) => (!val || val.trim() === '' ? '该项不能为空' : null),
  email: (val) => {
    if (!val) return null; // 非必填时允许为空
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(val) ? '邮箱格式不正确' : null;
  },
  // 组合校验器：必填且格式正确
  requiredEmail: (val) => {
    if (!val || val.trim() === '') return '邮箱不能为空';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(val) ? '邮箱格式不正确' : null;
  }
};

// 字段分组配置
const baseFields = [
  {
    key: 'avatar',
    label: '头像',
    type: 'avatar',
    render: (user) => (
      <img
        src={user.avatar}
        alt="avatar"
        style={{ width: 48, height: 48, borderRadius: '50%' }}
      />
    ),
    onClick: () => Toast.show({ content: '暂不支持头像修改', position: 'bottom' }),
    editable: false,
  },
  // type 可扩展为 'input' | 'segmented' | 'switch' | 'multi-select' | 'date' | 'verify' 等
  { key: 'nickname', label: '昵称', editable: true, type: 'input', validator: validators.required },
  { key: 'gender', label: '性别', editable: true, type: 'segmented', config: {
    options: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
      { label: '保密', value: 'unknown' },
    ]
  } },
  { key: 'public_email', label: '公开邮箱', editable: true, type: 'input',
    // type: 'verify' 可用于邮箱验证，verify: true 预留
    verify: true, validator: validators.email },
  { key: 'status', label: '状态', editable: false },
  { key: 'roles', label: '角色', editable: false, render: (user) => user.roles.join('、') },
  { key: 'created_at', label: '注册时间', editable: false },
];

const volunteerFields = [
  { key: 'public_email', label: '公开邮箱', editable: true, type: 'input', verify: true, validator: validators.email }, // type: 'verify' 可扩展
  { key: 'is_public_visible', label: '是否公开', editable: true, type: 'switch' },
  { key: 'skills', label: '擅长领域', editable: true, type: 'input' }, // type: 'multi-select' 可扩展
  { key: 'service_hours', label: '服务时长', editable: false },
  { key: 'work_status', label: '服务状态', editable: true, type: 'segmented', config: {
    options: [
      { label: '在线', value: 'online' },
      { label: '忙碌', value: 'busy' },
      { label: '离线', value: 'offline' },
    ]
  } },
  { key: 'status', label: '审核状态', editable: false },
];

const expertFields = [
  { key: 'public_email', label: '公开邮箱', editable: true, type: 'input', verify: true, validator: validators.email }, // type: 'verify' 可扩展
  { key: 'is_public_visible', label: '是否公开', editable: true, type: 'switch' },
  { key: 'title', label: '头衔', editable: true, type: 'input', validator: validators.required },
  { key: 'organization', label: '组织', editable: true, type: 'input', validator: validators.required },
  { key: 'specialties', label: '擅长领域', editable: true, type: 'input', validator: validators.required },
  { key: 'status', label: '审核状态', editable: false },
];

import { updateUserProfile } from '../../api/auth';


function PersonalInfo() {
  const { user, refreshUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [editField, setEditField] = useState(null); // { field, value, group }
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <SubLayout title="个人信息">
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>请先登录</div>
          <Button color="primary" onClick={() => navigate('/auth/login')}>登录</Button>
        </div>
      </SubLayout>
    );
  }

  // 动态分组渲染，自动适配所有 roles
  const rolesArr = user.roles;

  // 基础信息分组
  const groups = [
    {
      title: '基础信息',
      fields: baseFields,
      data: user,
      groupKey: 'user',
    },
    // 动态扩展所有角色 profile 字段
    ...rolesArr.map((role) => {
      if (!role || role === 'user') return null;
      const profileKey = `${role}_profile`;
      // 角色字段映射
      let fields = null;
      if (role === 'volunteer') fields = volunteerFields;
      else if (role === 'expert') fields = expertFields;
      // 未来扩展角色可自定义 fields，否则降级为通用渲染
      return {
        title: `${role} 详细信息`,
        fields,
        data: user[profileKey],
        groupKey: profileKey,
      };
    }).filter(Boolean)
  ];

  // 处理字段点击
  const handleFieldClick = (field, value, group) => {
    if (field.key === 'avatar') {
      Toast.show({ content: '暂不支持头像修改', position: 'bottom' });
      return;
    }
    if (!field.editable) return;
    setEditField({ ...field, group });
    setEditValue(value);
    setError('');
  };

  // 处理值变更
  const handleValueChange = (val) => {
    setEditValue(val);
    if (editField && editField.validator) {
      const msg = editField.validator(val);
      setError(msg || '');
    } else {
      setError('');
    }
  };

  // 弹窗保存
  const handleSave = async () => {
    if (!editField) return;
    
    // 再次校验（防止用户未修改直接保存，或者实时校验有延迟）
    if (editField.validator) {
      const msg = editField.validator(editValue);
      if (msg) {
        setError(msg);
        return;
      }
    }
    if (error) return; // 如果还有错误未解决

    setLoading(true);
    try {
      // 构造 payload
      let payload = {};
      if (editField.group.groupKey === 'user') {
        payload[editField.key] = editValue;
      } else {
        payload[editField.group.groupKey] = {
          ...editField.group.data,
          [editField.key]: editValue,
        };
      }
      await updateUserProfile(payload);
      Toast.show({ content: '保存成功', position: 'bottom' });
      setEditField(null);
      setEditValue('');
      if (typeof refreshUser === 'function') refreshUser();
    } catch {
      Toast.show({ content: '保存失败', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  // 使用 FieldEditor 渲染编辑控件
  const renderEditInput = () => {
    if (!editField) return null;
    
    const { type, label, config = {} } = editField;
    const finalConfig = { ...config };

    if (type === 'input' && !finalConfig.placeholder) {
      finalConfig.placeholder = `请输入${label}`;
    }
    
    return (
      <FieldEditor
        type={type}
        config={finalConfig}
        value={editValue}
        onChange={handleValueChange}
        error={error}
      />
    );
  };

  return (
    <SubLayout title="个人信息">
      <div style={{ background: '#f7f8fa', minHeight: '100vh' }}>
        {groups.map((group) => (
          <div key={group.title} style={{ margin: '16px 0' }}>
            <div style={{ fontWeight: 600, fontSize: 16, padding: '8px 16px' }}>{group.title}</div>
            {group.fields ? (
              <ListMenu
                items={group.fields.map((field) => ({
                  key: field.key,
                  label: field.label,
                  value: field.render ? field.render(group.data) : (group.data?.[field.key] ?? '-') ,
                  arrow: field.key === 'avatar' ? false : field.editable,
                  onClick: field.key === 'avatar'
                    ? () => Dialog.alert({ content: '暂不支持头像修改' })
                    : () => handleFieldClick(field, group.data?.[field.key], group),
                }))}
                align="split"
              />
            ) : (
              group.data ? (
                // 通用渲染未知 profile 字段
                <ul style={{ padding: '8px 16px' }}>
                  {Object.entries(group.data).map(([k, v]) => (
                    <li key={k}><strong>{k}：</strong>{String(v)}</li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: '#999', padding: '8px 16px' }}>暂无该角色详细信息</div>
              )
            )}
          </div>
        ))}
        <Popup
          visible={!!editField}
          onMaskClick={() => !loading && setEditField(null)}
          bodyStyle={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
        >
          <div className="popup-container">
            <div className="popup-header">
              <button
                className="popup-action cancel"
                onClick={() => !loading && setEditField(null)}
              >
                取消
              </button>
              <div className="popup-title">{editField?.label}</div>
              <button
                className="popup-action"
                onClick={handleSave}
                disabled={loading}
              >
                保存
              </button>
            </div>
            <div className="popup-body">
              {renderEditInput()}
            </div>
          </div>
        </Popup>
      </div>
    </SubLayout>
  );
}

export default PersonalInfo;
