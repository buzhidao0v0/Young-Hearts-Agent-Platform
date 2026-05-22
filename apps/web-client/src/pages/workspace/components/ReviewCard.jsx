import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './ReviewCard.css';

const ReviewCard = ({ item }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/workspace/review/${item.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_review':
        return '待审核';
      case 'published':
        return '已发布';
      case 'rejected':
        return '已驳回';
      default:
        return status;
    }
  };

  return (
    <div className="review-card" onClick={handleClick}>
      <div className="review-card-header">
        <h3 className="review-card-title">{item.title}</h3>
        <span className={`review-card-status status-${item.status}`}>
          {getStatusText(item.status)}
        </span>
      </div>
      <div className="review-card-body">
        <div className="review-card-info">
          <span className="info-label">提交人：</span>
          <span className="info-value">{item.author_name || item.author_id}</span>
        </div>
        <div className="review-card-info">
          <span className="info-label">提交时间：</span>
          <span className="info-value">{formatDate(item.created_at)}</span>
        </div>
        {item.category && (
          <div className="review-card-info">
            <span className="info-label">分类：</span>
            <span className="info-value">{item.category}</span>
          </div>
        )}
      </div>
    </div>
  );
};

ReviewCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string,
    author_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    author_name: PropTypes.string,
    created_at: PropTypes.string,
    category: PropTypes.string,
  }).isRequired,
};

export default ReviewCard;
