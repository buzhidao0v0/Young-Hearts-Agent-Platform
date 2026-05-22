import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './index.css';

/**
 * ReferenceCard 组件
 * @param {Object} props
 * @param {Array} props.sources - 引用来源数组，每项应包含 id、title、summary 等字段
 */
const ReferenceCard = ({ sources = [] }) => {
  const navigate = useNavigate();

  if (!sources.length) return null;

  return (
    <div className="reference-card-list">
      <div className="reference-card-title">引用内容</div>
      <div className="reference-card-items">
        {sources.map((item, index) => {
          const id = item.id || item.metadata?.source_id || index;
          const title = item.title || item.metadata?.title || '未知来源';
          const summary = item.summary || item.content || '';
          
          return (
            <div
              className="reference-card-item"
              key={id}
              onClick={() => navigate(`/knowledge/${id}`)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') navigate(`/knowledge/${id}`);
              }}
            >
              <div className="reference-card-item-title">{title}</div>
              {summary && (
                <div className="reference-card-item-summary">{summary}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

ReferenceCard.propTypes = {
  sources: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      summary: PropTypes.string,
      content: PropTypes.string,
      metadata: PropTypes.object,
    })
  ),
};

export default ReferenceCard;
