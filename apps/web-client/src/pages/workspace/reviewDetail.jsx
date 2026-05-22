import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import SubLayout from '../../layouts/SubLayout';
import { knowledgeApi } from '../../api/knowledge';
import { UserContext } from '../../store/UserContext';
import './reviewDetail.css';

export default function ReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useContext(UserContext);
  
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userLoading) return;

    // 权限拦截：仅 expert, admin, maintainer 角色可访问
    const hasPermission = user?.roles?.includes('expert') || user?.roles?.includes('admin') || user?.roles?.includes('maintainer');
    if (!hasPermission) {
      navigate('/home', { replace: true });
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await knowledgeApi.getItemById(id);
        setDetail(res.data || res);
      } catch (err) {
        setError(err.message || '获取详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, user, userLoading, navigate]);

  const handlePass = async () => {
    if (!window.confirm('确定通过该知识条目吗？')) return;
    
    try {
      setSubmitting(true);
      await knowledgeApi.auditItem(id, { status: 'published' });
      alert('审核通过成功');
      navigate('/workspace/review', { replace: true });
    } catch (err) {
      alert(err.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      alert('请输入驳回理由');
      return;
    }

    try {
      setSubmitting(true);
      await knowledgeApi.auditItem(id, { status: 'rejected', review_comments: rejectReason });
      alert('已驳回该条目');
      setShowRejectModal(false);
      navigate('/workspace/review', { replace: true });
    } catch (err) {
      alert(err.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading || loading) {
    return (
      <SubLayout title="审核详情">
        <div className="review-detail-loading">加载中...</div>
      </SubLayout>
    );
  }

  if (error || !detail) {
    return (
      <SubLayout title="审核详情">
        <div className="review-detail-error">{error || '未找到该条目'}</div>
      </SubLayout>
    );
  }

  return (
    <SubLayout title="审核详情">
      <div className="review-detail-container">
        <div className="review-detail-header">
          <h1 className="review-detail-title">{detail.title}</h1>
          <div className="review-detail-meta">
            <span>提交人：{detail.author_name || detail.author_id}</span>
            <span>分类：{detail.category || '未分类'}</span>
            <span>状态：{detail.status === 'pending_review' ? '待审核' : detail.status}</span>
          </div>
        </div>
        
        <div className="review-detail-content markdown-body">
          <ReactMarkdown>{detail.content || ''}</ReactMarkdown>
        </div>

        {detail.status === 'pending_review' && (
          <div className="review-detail-actions">
            <button 
              className="btn-reject" 
              onClick={handleRejectClick}
              disabled={submitting}
            >
              驳回 (Reject)
            </button>
            <button 
              className="btn-pass" 
              onClick={handlePass}
              disabled={submitting}
            >
              通过 (Pass)
            </button>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="reject-modal-overlay">
          <div className="reject-modal">
            <h3>请输入驳回理由</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请详细说明驳回原因，以便提交人修改..."
              rows={4}
              autoFocus
            />
            <div className="reject-modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowRejectModal(false)}
                disabled={submitting}
              >
                取消
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleRejectSubmit}
                disabled={submitting || !rejectReason.trim()}
              >
                {submitting ? '提交中...' : '确认驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SubLayout>
  );
}
