import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import KnowledgePage from './index';
import { knowledgeApi } from '../../api/knowledge';

// Mock API
vi.mock('../../api/knowledge', () => ({
  knowledgeApi: {
    getItems: vi.fn(),
  },
}));

// Mock Header component
vi.mock('../../components/Header', () => ({
  default: ({ title }) => <div data-testid="mock-header">{title}</div>,
}));

describe('KnowledgePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    knowledgeApi.getItems.mockReturnValue(new Promise(() => {})); // 永远 pending
    render(
      <BrowserRouter>
        <KnowledgePage />
      </BrowserRouter>
    );
    expect(screen.getByText('加载中...')).toBeDefined();
  });

  it('should render error state if API fails', async () => {
    knowledgeApi.getItems.mockRejectedValue(new Error('API Error'));
    render(
      <BrowserRouter>
        <KnowledgePage />
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('加载失败')).toBeDefined();
      expect(screen.getByText('API Error')).toBeDefined();
    });
  });

  it('should render list and dynamic categories on success', async () => {
    const mockData = [
      { id: 1, title: '文章1', category: '心理' },
      { id: 2, title: '文章2', category: '教育' },
      { id: 3, title: '文章3', category: '心理' },
    ];
    knowledgeApi.getItems.mockResolvedValue(mockData);

    render(
      <BrowserRouter>
        <KnowledgePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      // 检查标题
      expect(screen.getByTestId('mock-header').textContent).toBe('知识库大厅');
      
      // 检查分类标签是否正确提取（全部、心理、教育）
      expect(screen.getAllByText('全部').length).toBeGreaterThan(0);
      expect(screen.getAllByText('心理').length).toBeGreaterThan(0);
      expect(screen.getAllByText('教育').length).toBeGreaterThan(0);

      // 检查列表项是否渲染
      expect(screen.getByText('文章1')).toBeDefined();
      expect(screen.getByText('文章2')).toBeDefined();
      expect(screen.getByText('文章3')).toBeDefined();
    });
  });

  it('should render empty state if no data', async () => {
    knowledgeApi.getItems.mockResolvedValue([]);
    render(
      <BrowserRouter>
        <KnowledgePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('暂无数据')).toBeDefined();
    });
  });
});
