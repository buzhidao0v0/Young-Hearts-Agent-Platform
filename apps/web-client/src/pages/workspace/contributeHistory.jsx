import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, ErrorBlock, DotLoading, Tag, Checkbox, Button, Dialog, Toast } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import SubLayout from '../../layouts/SubLayout';
import { knowledgeApi } from '../../api/knowledge';

export default function ContributeHistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 批量删除相关状态
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await knowledgeApi.getMyItems();
      // 假设返回的数据结构是 { items: [...] } 或者 { data: [...] } 或者直接是数组
      const dataList = Array.isArray(res) ? res : (res.items || res.data || []);
      
      // 按照最新更改的时间顺序排序
      const sortedList = dataList.sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      });
      
      setItems(sortedList);
    } catch (err) {
      setError(err.message || '获取历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'draft':
        return <Tag color="default">草稿</Tag>;
      case 'pending_review':
        return <Tag color="warning">待审核</Tag>;
      case 'published':
        return <Tag color="success">已发布</Tag>;
      case 'rejected':
        return <Tag color="danger">已驳回</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const toggleManageMode = () => {
    setIsManageMode(!isManageMode);
    setSelectedIds([]);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const result = await Dialog.confirm({
      content: `确定要删除选中的 ${selectedIds.length} 条记录吗？此操作不可恢复。`,
    });
    
    if (result) {
      setIsDeleting(true);
      try {
        await Promise.all(selectedIds.map(id => knowledgeApi.deleteItem(id)));
        Toast.show({ icon: 'success', content: '删除成功' });
        setIsManageMode(false);
        setSelectedIds([]);
        fetchMyItems();
      } catch (err) {
        Toast.show({ icon: 'fail', content: err.message || '部分或全部删除失败' });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const rightActions = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', paddingRight: '4px', minWidth: '60px' }}>
      {items.length > 0 && (
        <span 
          style={{ 
            fontSize: 15, 
            cursor: 'pointer', 
            color: isManageMode ? '#1890ff' : '#fff',
            fontWeight: isManageMode ? 500 : 'normal',
            transition: 'color 0.2s'
          }}
          onClick={toggleManageMode}
        >
          {isManageMode ? '取消' : '管理'}
        </span>
      )}
      {!isManageMode && (
        <div 
          style={{ 
            fontSize: 22, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center',
            color: '#fff'
          }}
          onClick={() => navigate('/workspace/contribute/edit')}
        >
          <AddOutline />
        </div>
      )}
    </div>
  );

  return (
    <SubLayout title="我的知识贡献" rightActions={rightActions}>
      <div style={{ padding: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <DotLoading color="primary" /> 加载中...
          </div>
        ) : error ? (
          <ErrorBlock status="default" title="加载失败" description={error} />
        ) : items.length === 0 ? (
          <ErrorBlock status="empty" title="暂无贡献记录" description="点击右上角 + 号开始贡献知识" />
        ) : (
          <div style={{ paddingBottom: isManageMode ? '60px' : '0' }}>
            <List>
              {items.map(item => (
                <List.Item
                  key={item.id}
                  prefix={
                    isManageMode ? (
                      <Checkbox 
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleToggleSelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : null
                  }
                  onClick={() => {
                    if (isManageMode) {
                      handleToggleSelect(item.id);
                    } else {
                      navigate(`/workspace/contribute/edit?id=${item.id}`);
                    }
                  }}
                  description={
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span>{formatDate(item.updated_at || item.created_at)}</span>
                      {getStatusTag(item.status)}
                    </div>
                  }
                >
                  {item.title}
                </List.Item>
              ))}
            </List>
            
            {isManageMode && (
              <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 16px',
                background: '#fff',
                boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 100
              }}>
                <Checkbox 
                  checked={selectedIds.length === items.length && items.length > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < items.length}
                  onChange={handleSelectAll}
                >
                  全选
                </Checkbox>
                <Button 
                  color="danger" 
                  disabled={selectedIds.length === 0}
                  loading={isDeleting}
                  onClick={handleBatchDelete}
                >
                  删除 ({selectedIds.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </SubLayout>
  );
}
