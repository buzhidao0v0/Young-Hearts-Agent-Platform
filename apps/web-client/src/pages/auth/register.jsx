

import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import SubLayout from '../../layouts/SubLayout';
import './register.css';

const ROLE_OPTIONS = [
  { value: 'family', label: '家属' },
  { value: 'volunteer', label: '志愿者' },
  { value: 'expert', label: '专家' },
];

const initialForm = {
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  email: '',
  nickname: '',
  gender: 'hidden',
  roles: [],
  volunteer_profile: {
    is_public_visible: false,
  },
  expert_profile: {},
};

function validate(form) {
  const errors = {};
  if (!form.username) {
    errors.username = '用户名必填';
  } else if (/[\u4e00-\u9fa5]/.test(form.username)) {
    errors.username = '用户名不能为中文';
  }
  if (!form.password) errors.password = '密码必填';
  if (form.password !== form.confirmPassword) errors.confirmPassword = '两次密码不一致';
  if (!form.phone) errors.phone = '手机号必填';
  if (!form.roles.length) errors.roles = '至少选择一个角色';
  
  if (form.roles.includes('volunteer')) {
    if (!form.volunteer_profile?.full_name) errors.volunteer_fullname = '志愿者真实姓名必填';
  }
  if (form.roles.includes('expert')) {
    if (!form.expert_profile?.full_name) errors.expert_fullname = '专家真实姓名必填';
  }
  return errors;
}

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setForm((prev) => {
      let roles = prev.roles;
      let profileUpdates = {};

      if (checked) {
        roles = [...roles, value];
        // 若同时选中志愿者和专家，同步真实姓名
        if (value === 'expert' && roles.includes('volunteer')) {
          profileUpdates.expert_profile = {
            ...prev.expert_profile,
            full_name: prev.volunteer_profile.full_name,
            public_email: prev.volunteer_profile.public_email,
            skills: prev.volunteer_profile.skills || prev.expert_profile.skills || [],
          };
        } else if (value === 'volunteer' && roles.includes('expert')) {
          profileUpdates.volunteer_profile = {
            ...prev.volunteer_profile,
            full_name: prev.expert_profile.full_name,
            public_email: prev.expert_profile.public_email,
            skills: prev.expert_profile.skills || prev.volunteer_profile.skills || [],
          };
        }
      } else {
        roles = roles.filter((r) => r !== value);
      }
      return { ...prev, roles, ...profileUpdates };
    });
  };

  const handleProfileChange = (role, field, value) => {
    setForm((prev) => {
      const newState = {
        ...prev,
        [`${role}_profile`]: {
          ...prev[`${role}_profile`],
          [field]: value,
        },
      };

      // 若同时存在志愿者和专家角色，修改真实姓名时同步更新
      if (prev.roles.includes('volunteer') && prev.roles.includes('expert')) {
        const otherRole = role === 'volunteer' ? 'expert' : 'volunteer';
        // 同步 full_name
        if (field === 'full_name') {
          newState[`${otherRole}_profile`] = {
            ...newState[`${otherRole}_profile`],
            full_name: value,
          };
        }
        // 同步 public_email
        if (field === 'public_email') {
          newState[`${otherRole}_profile`] = {
            ...newState[`${otherRole}_profile`],
            public_email: value,
          };
        }
        // 同步 skills（保证数组复制）
        if (field === 'skills') {
          newState[`${otherRole}_profile`] = {
            ...newState[`${otherRole}_profile`],
            skills: Array.isArray(value) ? [...value] : (value ? [...value] : []),
          };
        }
      }

      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setSubmitError('');
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      // 假设有 register API
      const { register } = await import('../../api/auth');
      
      const payload = {
        username: form.username,
        password: form.password,
        roles: form.roles,
        ...(form.email && { email: form.email }),
        ...(form.nickname && { nickname: form.nickname }),
        ...(form.gender && { gender: form.gender }),
      };

      if (form.roles.includes('volunteer')) {
        payload.volunteer_info = {
          full_name: form.volunteer_profile.full_name,
          phone: form.phone, // Linked from basic info
          skills: form.volunteer_profile.skills || [],
          ...(form.volunteer_profile.public_email && { public_email: form.volunteer_profile.public_email }),
          is_public_visible: form.volunteer_profile.is_public_visible || false,
        };
      }

      if (form.roles.includes('expert')) {
        payload.expert_info = {
          full_name: form.expert_profile.full_name,
          phone: form.phone, // Linked from basic info
          skills: form.expert_profile.skills || [],
          ...(form.expert_profile.public_email && { public_email: form.expert_profile.public_email }),
          ...(form.expert_profile.title && { title: form.expert_profile.title }),
          ...(form.expert_profile.org && { org: form.expert_profile.org }),
        };
      }

      await register(payload);
      navigate('/auth/login', { replace: true });
    } catch (err) {
      console.error(err);
      setSubmitError(err?.response?.data?.detail?.[0]?.msg || err?.message || '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SubLayout title="注册" subtitle="欢迎加入心青年平台">
      <div className="register-container">
        <form className="register-form" onSubmit={handleSubmit} autoComplete="off">
          <h2 className="register-title">注册“心青年”平台账号</h2>
          
          <div className="register-section">
            <div className="register-section-title">基本信息</div>
            <div className="form-group">
              <label className="required">用户名</label>
              <input name="username" value={form.username} onChange={handleChange} />
              {errors.username && <div className="form-error">{errors.username}</div>}
            </div>
            <div className="form-group">
              <label className="required">密码</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>
            <div className="form-group">
              <label className="required">确认密码</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} />
              {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
            </div>
            <div className="form-group">
              <label className="required">手机号</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="将被用于角色资料联系方式" />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>
            <div className="form-group">
              <label>邮箱 (选填)</label>
              <input name="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>昵称 (选填)</label>
              <input name="nickname" value={form.nickname} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>性别 (选填)</label>
              <select name="gender" value={form.gender} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="hidden">保密</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
          </div>

          <div className="register-section">
            <div className="register-section-title">选择角色</div>
            <div className="form-group">
              {ROLE_OPTIONS.map((role) => (
                <label key={role.value} style={{ marginRight: 16 }}>
                  <input
                    type="checkbox"
                    value={role.value}
                    checked={form.roles.includes(role.value)}
                    onChange={handleRoleChange}
                  />
                  {role.label}
                </label>
              ))}
              {errors.roles && <div className="form-error">{errors.roles}</div>}
            </div>
          </div>

          {form.roles.includes('volunteer') && (
            <div className="register-section">
              <div className="register-section-title">志愿者信息</div>
              <div className="form-group">
                <label className="required">真实姓名</label>
                <input
                  value={form.volunteer_profile.full_name || ''}
                  onChange={e => handleProfileChange('volunteer', 'full_name', e.target.value)}
                />
                {errors.volunteer_fullname && <div className="form-error">{errors.volunteer_fullname}</div>}
              </div>
              <div className="form-group">
                <label className="required">手机号</label>
                <input
                  value={form.phone || ''}
                  disabled
                  title="关联基本信息中的手机号"
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <div style={{ fontSize: '12px', color: '#666' }}>已关联基本信息手机号</div>
              </div>
              <div className="form-group">
                <label>公开邮箱 (选填)</label>
                <input
                  value={form.volunteer_profile.public_email || ''}
                  onChange={e => handleProfileChange('volunteer', 'public_email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>擅长领域 (选填)</label>
                <input
                  value={form.volunteer_profile.skills?.join(',') || ''}
                  onChange={e => handleProfileChange('volunteer', 'skills', e.target.value.split(','))}
                  placeholder="用逗号分隔"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.volunteer_profile.is_public_visible || false}
                    onChange={e => handleProfileChange('volunteer', 'is_public_visible', e.target.checked)}
                  />
                  {' '}是否公开可见 (选填)
                </label>
              </div>
            </div>
          )}

          {form.roles.includes('expert') && (
            <div className="register-section">
              <div className="register-section-title">专家信息</div>
              <div className="form-group">
                <label className="required">真实姓名</label>
                <input
                  value={form.expert_profile.full_name || ''}
                  onChange={e => handleProfileChange('expert', 'full_name', e.target.value)}
                />
                {errors.expert_fullname && <div className="form-error">{errors.expert_fullname}</div>}
              </div>
              <div className="form-group">
                <label className="required">手机号</label>
                <input
                  value={form.phone || ''}
                  disabled
                  title="关联基本信息中的手机号"
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <div style={{ fontSize: '12px', color: '#666' }}>已关联基本信息手机号</div>
              </div>
              <div className="form-group">
                <label>职称 (选填)</label>
                <input
                  value={form.expert_profile.title || ''}
                  onChange={e => handleProfileChange('expert', 'title', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>所属机构 (选填)</label>
                <input
                  value={form.expert_profile.org || ''}
                  onChange={e => handleProfileChange('expert', 'org', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>公开邮箱 (选填)</label>
                <input
                  value={form.expert_profile.public_email || ''}
                  onChange={e => handleProfileChange('expert', 'public_email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>擅长领域 (选填)</label>
                <input
                  value={form.expert_profile.skills?.join(',') || ''}
                  onChange={e => handleProfileChange('expert', 'skills', e.target.value.split(','))}
                  placeholder="用逗号分隔"
                />
              </div>
            </div>
          )}

          {submitError && <div className="form-error" style={{ margin: '12px 0' }}>{submitError}</div>}
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? '注册中...' : '注册'}
            </button>
          </div>
        </form>
      </div>
    </SubLayout>
  );
}
