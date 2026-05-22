import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ErrorBlock, DotLoading } from 'antd-mobile';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SubLayout from '../../layouts/SubLayout';
import { knowledgeApi } from '../../api/knowledge';
import './detail.css';

export default function KnowledgeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await knowledgeApi.getItemById(id);
        // 兼容后端可能返回的 { item: {...} } 或直接返回对象
        setItem(data.item || data.data || data);
      } catch (err) {
        setError(err.message || '加载详情失败');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id]);

  return (
    <SubLayout title="知识详情" onBack={() => navigate(-1)}>
      <div className="knowledge-detail-content">
        {loading ? (
          <div className="loading-container">
            <DotLoading color="primary" />
            <span>加载中...</span>
          </div>
        ) : error ? (
          <ErrorBlock status="default" title="加载失败" description={error} />
        ) : item ? (
          <div className="knowledge-article">
            <h1 className="article-title">{item.title}</h1>
            <div className="article-meta">
              {item.author && <span className="meta-author">{item.author}</span>}
              {item.publishTime && <span className="meta-time">{new Date(item.publishTime).toLocaleDateString()}</span>}
              {item.category && <span className="meta-category">{item.category}</span>}
            </div>
            <div className="article-body markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {item.content || '暂无内容'}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <ErrorBlock status="empty" title="未找到该知识条目" />
        )}
      </div>
    </SubLayout>
  );
}
