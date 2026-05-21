import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './KnowledgeCard.css';

const KnowledgeCard = ({ item }) => {
  const navigate = useNavigate();

  if (!item) return null;

  const { id, title, summary, category, author, publishTime } = item;

  const handleClick = () => {
    navigate(`/knowledge/${id}`);
  };

  return (
    <div className="knowledge-card" onClick={handleClick}>
      <div className="knowledge-card-header">
        <h3 className="knowledge-card-title">{title}</h3>
        {category && <span className="knowledge-card-category">{category}</span>}
      </div>
      {summary && <p className="knowledge-card-summary">{summary}</p>}
      <div className="knowledge-card-footer">
        {author && <span className="knowledge-card-author">{author}</span>}
        {publishTime && <span className="knowledge-card-time">{new Date(publishTime).toLocaleDateString()}</span>}
      </div>
    </div>
  );
};

KnowledgeCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string,
    category: PropTypes.string,
    author: PropTypes.string,
    publishTime: PropTypes.string,
  }),
};

export default KnowledgeCard;
