import React, { useState, useEffect } from 'react';
import { Tabs, ErrorBlock, DotLoading } from 'antd-mobile';
import SubLayout from '../../layouts/SubLayout';
import KnowledgeCard from './components/KnowledgeCard';
import { knowledgeApi } from '../../api/knowledge';
import './index.css';

export default function KnowledgePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(['全部']);
  const [activeCategory, setActiveCategory] = useState('全部');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await knowledgeApi.getItems({ status: 'published' });
        // 根据截图，后端返回的数据结构是 { total: 2, items: [...] }
        const list = Array.isArray(data) ? data : (data.items || data.data || []);
        setItems(list);
        
        // 提取动态分类
        const uniqueCategories = [...new Set(list.map(item => item.category).filter(Boolean))];
        setCategories(['全部', ...uniqueCategories]);
      } catch (err) {
        setError(err.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const filteredItems = activeCategory === '全部' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  return (
    <SubLayout title="知识库大厅" showBack={true}>
      <div className="knowledge-content">
        {loading ? (
          <div className="loading-container">
            <DotLoading color="primary" />
            <span>加载中...</span>
          </div>
        ) : error ? (
          <ErrorBlock status="default" title="加载失败" description={error} />
        ) : (
          <>
            {categories.length > 1 && (
              <div className="knowledge-tabs">
                <Tabs activeKey={activeCategory} onChange={setActiveCategory}>
                  {categories.map(cat => (
                    <Tabs.Tab title={cat} key={cat} />
                  ))}
                </Tabs>
              </div>
            )}
            
            <div className="knowledge-list">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <KnowledgeCard key={item.id} item={item} />
                ))
              ) : (
                <ErrorBlock status="empty" title="暂无数据" />
              )}
            </div>
          </>
        )}
      </div>
    </SubLayout>
  );
}
