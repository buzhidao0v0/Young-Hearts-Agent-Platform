import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReviewDetailPage from './reviewDetail';
import { UserContext } from '../../store/UserContext';
import { knowledgeApi } from '../../api/knowledge';

// Mock API
vi.mock('../../api/knowledge', () => ({
  knowledgeApi: {
    getItemById: vi.fn(),
    auditItem: vi.fn(),
  },
}));

// Mock window.confirm and window.alert
window.confirm = vi.fn();
window.alert = vi.fn();

const renderWithContext = (ui, userValue, initialRoute = '/workspace/review/1') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <UserContext.Provider value={userValue}>
        <Routes>
          <Route path="/workspace/review/:id" element={ui} />
          <Route path="/home" element={<div>Home</div>} />
          <Route path="/workspace/review" element={<div>Review List</div>} />
        </Routes>
      </UserContext.Provider>
    </MemoryRouter>
  );
};

describe('ReviewDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect if user is not expert or admin', async () => {
    const userValue = {
      user: { roles: ['user'] },
      loading: false,
    };

    renderWithContext(<ReviewDetailPage />, userValue);
    
    expect(knowledgeApi.getItemById).not.toHaveBeenCalled();
  });

  it('should render detail and allow pass action', async () => {
    const mockData = {
      id: 1,
      title: 'Test Knowledge 1',
      content: 'Test Content',
      status: 'pending_review',
      author_name: 'Author 1',
    };
    knowledgeApi.getItemById.mockResolvedValueOnce(mockData);
    knowledgeApi.auditItem.mockResolvedValueOnce({});
    window.confirm.mockReturnValueOnce(true);

    const userValue = {
      user: { roles: ['expert'] },
      loading: false,
    };

    renderWithContext(<ReviewDetailPage />, userValue);

    await waitFor(() => {
      expect(screen.getByText('Test Knowledge 1')).toBeInTheDocument();
    });

    const passButton = screen.getByText('通过 (Pass)');
    fireEvent.click(passButton);

    expect(window.confirm).toHaveBeenCalledWith('确定通过该知识条目吗？');
    
    await waitFor(() => {
      expect(knowledgeApi.auditItem).toHaveBeenCalledWith('1', { status: 'published' });
    });
    expect(window.alert).toHaveBeenCalledWith('审核通过成功');
  });

  it('should show reject modal and require reason', async () => {
    const mockData = {
      id: 1,
      title: 'Test Knowledge 1',
      content: 'Test Content',
      status: 'pending_review',
      author_name: 'Author 1',
    };
    knowledgeApi.getItemById.mockResolvedValueOnce(mockData);
    knowledgeApi.auditItem.mockResolvedValueOnce({});

    const userValue = {
      user: { roles: ['admin'] },
      loading: false,
    };

    renderWithContext(<ReviewDetailPage />, userValue);

    await waitFor(() => {
      expect(screen.getByText('Test Knowledge 1')).toBeInTheDocument();
    });

    const rejectButton = screen.getByText('驳回 (Reject)');
    fireEvent.click(rejectButton);

    // Modal should appear
    expect(screen.getByText('请输入驳回理由')).toBeInTheDocument();

    const confirmRejectButton = screen.getByText('确认驳回');
    
    // Try to submit without reason
    expect(confirmRejectButton).toBeDisabled();
    fireEvent.click(confirmRejectButton);
    expect(knowledgeApi.auditItem).not.toHaveBeenCalled();

    // Enter reason and submit
    const textarea = screen.getByPlaceholderText('请详细说明驳回原因，以便提交人修改...');
    fireEvent.change(textarea, { target: { value: 'Needs more details' } });
    
    fireEvent.click(confirmRejectButton);

    await waitFor(() => {
      expect(knowledgeApi.auditItem).toHaveBeenCalledWith('1', { status: 'rejected', review_comments: 'Needs more details' });
    });
    expect(window.alert).toHaveBeenCalledWith('已驳回该条目');
  });
});
