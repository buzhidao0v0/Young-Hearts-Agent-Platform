import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import KnowledgeCard from './KnowledgeCard';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('KnowledgeCard', () => {
  const mockItem = {
    id: 1,
    title: '测试标题',
    summary: '测试摘要',
    category: '心理',
    author: '张三',
    publishTime: '2026-02-23T10:00:00Z',
  };

  it('should render correctly with all props', () => {
    render(
      <BrowserRouter>
        <KnowledgeCard item={mockItem} />
      </BrowserRouter>
    );

    expect(screen.getByText('测试标题')).toBeDefined();
    expect(screen.getByText('测试摘要')).toBeDefined();
    expect(screen.getByText('心理')).toBeDefined();
    expect(screen.getByText('张三')).toBeDefined();
    // 检查日期是否渲染（格式可能因本地化而异，这里只检查是否包含年份）
    expect(screen.getByText(/2026/)).toBeDefined();
  });

  it('should navigate to detail page on click', () => {
    render(
      <BrowserRouter>
        <KnowledgeCard item={mockItem} />
      </BrowserRouter>
    );

    const card = screen.getByText('测试标题').closest('.knowledge-card');
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/knowledge/1');
  });

  it('should not render if item is null', () => {
    const { container } = render(
      <BrowserRouter>
        <KnowledgeCard item={null} />
      </BrowserRouter>
    );
    expect(container.firstChild).toBeNull();
  });
});
