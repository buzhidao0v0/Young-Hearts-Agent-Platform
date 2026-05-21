import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import SubLayout from '../../layouts/SubLayout';
import { knowledgeApi } from '../../api/knowledge';
import { UserContext } from '../../store/UserContext';
import ReviewCard from './components/ReviewCard';
import './review.css';

export default function ReviewPage() {
  const [auditList, setAuditList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: userLoading } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (userLoading) return;

    // 权限拦截：仅 expert, admin, maintainer 角色可访问
    const hasPermission = user?.roles?.includes('expert') || user?.roles?.includes('admin') || user?.roles?.includes('maintainer');
    if (!hasPermission) {
      navigate('/home', { replace: true });
      return;
    }

    const fetchAuditList = async () => {
      try {
        setLoading(true);
        const res = await knowledgeApi.getAuditList({ status: 'pending_review' });
        // 适配后端返回的数据结构 { items: [...] }, { data: [...] } 或直接是数组
        const list = Array.isArray(res) ? res : (res.items || res.data || []);
        setAuditList(list);
      } catch (err) {
        setError(err.message || '获取待审核列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditList();
  }, [user, userLoading, navigate]);

  if (userLoading) {
    return (
      <SubLayout title="知识审核">
        <div className="review-loading">加载中...</div>
      </SubLayout>
    );
  }

  return (
    <SubLayout title="知识审核">
      <div className="review-page-container">
        {loading ? (
          <div className="review-loading">加载中...</div>
        ) : error ? (
          <div className="review-error">{error}</div>
        ) : auditList.length === 0 ? (
          <div className="review-empty">暂无待审核的知识条目</div>
        ) : (
          <div className="review-list">
            {auditList.map((item) => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </SubLayout>
  );
}
