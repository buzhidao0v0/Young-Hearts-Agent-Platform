import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SubLayout from '../../layouts/SubLayout';
import { useUser } from '../../store/useUser';
import { knowledgeApi } from '../../api/knowledge';
import Toast from '../../components/Toast';
import './contribute.css';

const DRAFT_KEY = 'knowledge_draft';

export default function ContributePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const { user, loading: userLoading } = useUser();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    risk_level: 'low',
    target_audience: [],
    applicable_age: [],
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const fileInputRef = useRef(null);

  // 预设选项
  const categoryOptions = ['心理', '教育', '生活', '健康', '其他'];
  const targetAudienceOptions = ['心青年', '家长', '志愿者', '专家', '公众'];
  const applicableAgeOptions = ['儿童 (0-12)', '青少年 (13-18)', '青年 (19-35)', '成年 (36+)', '全年龄段'];

  // 新增选项输入状态
  const [newAudience, setNewAudience] = useState('');
  const [newAge, setNewAge] = useState('');

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };

  // 权限拦截
  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        navigate('/auth/login', { replace: true });
        return;
      }
      const hasPermission = user.roles?.some(role => ['volunteer', 'expert', 'admin'].includes(role));
      if (!hasPermission) {
        showToast('您没有权限访问此页面', 'error');
        setTimeout(() => navigate('/home', { replace: true }), 1500);
      }
    }
  }, [user, userLoading, navigate]);

  // 初始化数据（草稿或重编）
  useEffect(() => {
    const initData = async () => {
      if (editId) {
        try {
          const data = await knowledgeApi.getItemById(editId);
          setFormData({
            title: data.title || '',
            category: data.category || '',
            content: data.content || '',
            risk_level: data.risk_level || 'low',
            target_audience: Array.isArray(data.target_audience) ? data.target_audience : (data.target_audience ? [data.target_audience] : []),
            applicable_age: Array.isArray(data.applicable_age) ? data.applicable_age : (data.applicable_age ? [data.applicable_age] : []),
          });
        } catch (error) {
          showToast(error.message || '获取原数据失败', 'error');
        }
      } else {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          if (window.confirm('检测到未提交的草稿，是否恢复？')) {
            try {
              setFormData(JSON.parse(draft));
            } catch (e) {
              console.error('解析草稿失败', e);
            }
          } else {
            localStorage.removeItem(DRAFT_KEY);
          }
        }
      }
    };
    initData();
  }, [editId]);

  // 监听表单变化保存草稿
  useEffect(() => {
    if (!editId && (formData.title || formData.category || formData.content)) {
      const timer = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => {
      const currentList = prev[field];
      if (currentList.includes(value)) {
        return { ...prev, [field]: currentList.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...currentList, value] };
      }
    });
  };

  const handleAddCustomOption = (field, value, setValue) => {
    if (!value.trim()) return;
    setFormData(prev => {
      const currentList = prev[field];
      if (!currentList.includes(value.trim())) {
        return { ...prev, [field]: [...currentList, value.trim()] };
      }
      return prev;
    });
    setValue('');
  };

  const handleRemoveOption = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFormData(prev => ({
      ...prev,
      content: `[已选择文件: ${file.name}]`
    }));
    showToast('文件已选择，将在提交时上传', 'success');
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      content: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (status) => {
    if (!formData.title.trim() || !formData.category.trim() || (!formData.content.trim() && !selectedFile)) {
      showToast('请填写完整信息', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editId) {
        // 更新操作 (PUT /api/knowledge/items/{id})
        // 注意：目前 PUT 接口只接受 JSON，不支持文件替换
        const updateData = {
          ...formData,
          status: status
        };
        await knowledgeApi.updateItem(editId, updateData);
        showToast(status === 'draft' ? '已存为草稿' : '重新提交成功', 'success');
      } else {
        // 新建操作 (POST /api/knowledge/upload)
        const uploadData = new FormData();
        uploadData.append('title', formData.title);
        uploadData.append('category', formData.category);
        uploadData.append('risk_level', formData.risk_level);
        uploadData.append('target_audience', JSON.stringify(formData.target_audience));
        uploadData.append('applicable_age', JSON.stringify(formData.applicable_age));
        uploadData.append('status', status);
        
        if (selectedFile) {
          uploadData.append('file', selectedFile);
        } else {
          uploadData.append('text_content', formData.content);
        }
        
        await knowledgeApi.uploadFile(uploadData);
        showToast(status === 'draft' ? '已存为草稿' : '提交成功', 'success');
        localStorage.removeItem(DRAFT_KEY);
      }
      
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error) {
      showToast(error.message || '提交失败', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editId) return;
    if (!window.confirm('确认要删除此知识条目吗？此操作不可恢复。')) return;
    setIsSubmitting(true);
    try {
      await knowledgeApi.deleteItem(editId);
      showToast('删除成功', 'success');
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      showToast(err.message || '删除失败', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return <div style={{ padding: 32, textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <SubLayout title={editId ? "重新编辑知识" : "贡献知识"}>
      <div className="contribute-container">
        <form onSubmit={(e) => e.preventDefault()} className="contribute-form">
          <div className="form-group">
            <label htmlFor="title">标题</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="请输入知识标题"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">分类</label>
            <div className="input-with-options">
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="请输入或选择分类"
                required
              />
              <select 
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                value={categoryOptions.includes(formData.category) ? formData.category : ''}
              >
                <option value="" disabled>选择已有分类</option>
                {categoryOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>风险等级</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="risk_level"
                  value="low"
                  checked={formData.risk_level === 'low'}
                  onChange={handleChange}
                />
                低风险
              </label>
              <label>
                <input
                  type="radio"
                  name="risk_level"
                  value="medium"
                  checked={formData.risk_level === 'medium'}
                  onChange={handleChange}
                />
                中风险
              </label>
              <label>
                <input
                  type="radio"
                  name="risk_level"
                  value="high"
                  checked={formData.risk_level === 'high'}
                  onChange={handleChange}
                />
                高风险
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>目标受众</label>
            <div className="checkbox-group">
              {targetAudienceOptions.map(opt => (
                <label key={opt}>
                  <input
                    type="checkbox"
                    checked={formData.target_audience.includes(opt)}
                    onChange={() => handleCheckboxChange('target_audience', opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
            <div className="custom-tags">
              {formData.target_audience.filter(item => !targetAudienceOptions.includes(item)).map(tag => (
                <span key={tag} className="tag">
                  {tag}
                  <button type="button" onClick={() => handleRemoveOption('target_audience', tag)}>×</button>
                </span>
              ))}
            </div>
            <div className="add-custom-option">
              <input
                type="text"
                value={newAudience}
                onChange={(e) => setNewAudience(e.target.value)}
                placeholder="输入自定义受众"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomOption('target_audience', newAudience, setNewAudience);
                  }
                }}
              />
              <button 
                type="button" 
                onClick={() => handleAddCustomOption('target_audience', newAudience, setNewAudience)}
              >
                添加
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>适用年龄</label>
            <div className="checkbox-group">
              {applicableAgeOptions.map(opt => (
                <label key={opt}>
                  <input
                    type="checkbox"
                    checked={formData.applicable_age.includes(opt)}
                    onChange={() => handleCheckboxChange('applicable_age', opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
            <div className="custom-tags">
              {formData.applicable_age.filter(item => !applicableAgeOptions.includes(item)).map(tag => (
                <span key={tag} className="tag">
                  {tag}
                  <button type="button" onClick={() => handleRemoveOption('applicable_age', tag)}>×</button>
                </span>
              ))}
            </div>
            <div className="add-custom-option">
              <input
                type="text"
                value={newAge}
                onChange={(e) => setNewAge(e.target.value)}
                placeholder="输入自定义年龄段"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomOption('applicable_age', newAge, setNewAge);
                  }
                }}
              />
              <button 
                type="button" 
                onClick={() => handleAddCustomOption('applicable_age', newAge, setNewAge)}
              >
                添加
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content">正文 (Markdown) 或 上传文件</label>
            <div className="upload-toolbar">
              {editId ? (
                <div className="selected-file-info" style={{ color: '#909399' }}>
                  <span>编辑模式下不支持修改文件，仅支持修改文本内容和元数据</span>
                </div>
              ) : selectedFile ? (
                <div className="selected-file-info">
                  <span>已选择: {selectedFile.name}</span>
                  <button type="button" className="remove-file-btn" onClick={handleRemoveFile}>
                    移除文件
                  </button>
                </div>
              ) : (
                <button 
                  type="button" 
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  选择文件上传
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                accept=".txt,.md,.pdf,.doc,.docx"
                disabled={!!editId}
              />
            </div>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder={selectedFile ? "已选择文件，正文输入已锁定" : "支持 Markdown 格式..."}
              rows={15}
              required={!selectedFile && !editId}
              disabled={!!selectedFile}
              className={selectedFile ? 'disabled-textarea' : ''}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
              取消
            </button>
            {editId && (
              <button
                type="button"
                className="delete-btn"
                disabled={isSubmitting}
                onClick={handleDelete}
              >
                删除
              </button>
            )}
            <button 
              type="button" 
              className="draft-btn" 
              disabled={isSubmitting}
              onClick={() => handleSubmit('draft')}
            >
              存为草稿
            </button>
            <button 
              type="button" 
              className="submit-btn" 
              disabled={isSubmitting}
              onClick={() => handleSubmit('pending_review')}
            >
              {isSubmitting ? '提交中...' : '提交审核'}
            </button>
          </div>
        </form>
      </div>
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onClose={() => setToast({ ...toast, visible: false })}
        />
      )}
    </SubLayout>
  );
}
