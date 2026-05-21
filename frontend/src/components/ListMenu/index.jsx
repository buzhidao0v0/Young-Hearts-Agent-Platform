import React from 'react';
import './index.css';

// 支持 items 为一组或多组
// 单组：[{key, label, value, ...}]，多组：[[...], [...]]
const ListMenu = ({ items = [], align = 'split' }) => {
  // 判断是否为分组
  const isGrouped = Array.isArray(items[0]);
  const groups = isGrouped ? items : [items];
  // 处理对齐方式 class
  const getAlignClass = () => {
    switch (align) {
      case 'left':
        return 'list-menu-align-left';
      case 'split':
        return 'list-menu-align-split';
      case 'custom':
        return 'list-menu-align-custom';
      default:
        return '';
    }
  };
  return (
    <div className={`list-menu ${getAlignClass()}`}>
      {groups.map((group, groupIdx) => (
        <div key={groupIdx} className="list-menu-group">
          {group.map((item, idx) => (
            <div
              key={item.key || idx}
              className="list-menu-item"
              onClick={item.onClick}
              style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: item.onClick ? 'pointer' : 'default' }}
            >
              {item.icon && (
                <span className="list-menu-icon">{item.icon}</span>
              )}
              <div className="list-menu-content">
                {/* 兼容 label/title, value/desc 字段，优先 label/value，无则回退 title/desc */}
                <span className="list-menu-title">{item.label !== undefined ? item.label : item.title}</span>
                <span className="list-menu-value">{item.value !== undefined ? item.value : item.desc}</span>
              </div>
              {item.arrow !== false && (
                <span className="list-menu-arrow">&gt;</span>
              )}
            </div>
          ))}
          {/* 分组间隔，仅视觉分隔，无标题 */}
          {groupIdx !== groups.length - 1 && (
            <div className="list-menu-divider" />
          )}
        </div>
      ))}
    </div>
  );
};

export { ListMenu };
export default ListMenu;
