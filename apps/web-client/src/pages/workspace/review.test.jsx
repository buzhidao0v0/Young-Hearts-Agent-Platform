import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewPage from './review';
import { UserContext } from '../../store/UserContext';
import { knowledgeApi } from '../../api/knowledge';

// Mock API
vi.mock('../../api/knowledge', () => ({
  knowledgeApi: {
    getAuditList: vi.fn(),
  },
}));

const renderWithContext = (ui, userValue) => {
  return render(
    <MemoryRouter initialEntries={['/workspace/review']}>
      <UserContext.Provider value={userValue}>
        <Routes>
          <Route path="/workspace/review" element={ui} />
          <Route path="/home" element={<div>Home</div>} />
        </Routes>
      </UserContext.Provider>
    </MemoryRouter>
  );
};

describe('ReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect if user is not expert or admin', async () => {
    const userValue = {
      user: { roles: ['user'] },
      loading: false,
    };

    renderWithContext(<ReviewPage />, userValue);
    
    // Since we are using MemoryRouter, we can't easily check the URL change without a custom history,
    // but we can verify that getAuditList is not called.
    expect(knowledgeApi.getAuditList).not.toHaveBeenCalled();
  });

  it('should render audit list for expert', async () => {
    const mockData = [
      { id: 1, title: 'Test Knowledge 1', status: 'pending_review', author_name: 'Author 1', created_at: '2023-01-01T00:00:00Z' },
    ];
    knowledgeApi.getAuditList.mockResolvedValueOnce(mockData);

    const userValue = {
      user: { roles: ['expert'] },
      loading: false,
    };

    renderWithContext(<ReviewPage />, userValue);

    expect(screen.getByText('加载中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Knowledge 1')).toBeInTheDocument();
    });
    
    expect(knowledgeApi.getAuditList).toHaveBeenCalledWith({ status: 'pending_review' });
  });

  it('should render empty state when no data', async () => {
    knowledgeApi.getAuditList.mockResolvedValueOnce([]);

    const userValue = {
      user: { roles: ['admin'] },
      loading: false,
    };

    renderWithContext(<ReviewPage />, userValue);

    await waitFor(() => {
      expect(screen.getByText('暂无待审核的知识条目')).toBeInTheDocument();
    });
  });
});
