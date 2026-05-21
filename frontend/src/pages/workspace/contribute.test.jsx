import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ContributePage from './contribute';
import { useUser } from '../../store/useUser';
import { knowledgeApi } from '../../api/knowledge';

// Mock dependencies
vi.mock('../../store/useUser', () => ({
  useUser: vi.fn(),
}));

vi.mock('../../api/knowledge', () => ({
  knowledgeApi: {
    uploadFile: vi.fn(),
    getItemById: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  },
}));

// Mock window.confirm
window.confirm = vi.fn();

describe('ContributePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderWithRouter = (initialRoute = '/workspace/contribute') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/workspace/contribute" element={<ContributePage />} />
          <Route path="/home" element={<div>Home Page</div>} />
          <Route path="/auth/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should redirect to login if user is not logged in', async () => {
    useUser.mockReturnValue({ user: null, loading: false });
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('should redirect to home if user has no permission', async () => {
    useUser.mockReturnValue({ 
      user: { roles: ['family'] }, 
      loading: false 
    });
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    }, { timeout: 2000 }); // Wait for setTimeout in component
  });

  it('should render form for authorized users', () => {
    useUser.mockReturnValue({ 
      user: { roles: ['volunteer'] }, 
      loading: false 
    });
    renderWithRouter();
    
    expect(screen.getByLabelText('标题')).toBeInTheDocument();
    expect(screen.getByLabelText('分类')).toBeInTheDocument();
    expect(screen.getByLabelText('正文 (Markdown) 或 上传文件')).toBeInTheDocument();
    expect(screen.getByText('目标受众')).toBeInTheDocument();
    expect(screen.getByText('适用年龄')).toBeInTheDocument();
  });

  it('should save draft to localStorage on input change', async () => {
    useUser.mockReturnValue({ 
      user: { roles: ['expert'] }, 
      loading: false 
    });
    renderWithRouter();
    
    const titleInput = screen.getByLabelText('标题');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    await waitFor(() => {
      const draft = localStorage.getItem('knowledge_draft');
      expect(draft).toBeTruthy();
      expect(JSON.parse(draft).title).toBe('Test Title');
    }, { timeout: 1500 }); // Wait for debounce
  });

  it('should lock textarea and show file info after file selection', async () => {
    useUser.mockReturnValue({ 
      user: { roles: ['admin'] }, 
      loading: false 
    });
    
    renderWithRouter();
    
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      const contentTextarea = screen.getByLabelText('正文 (Markdown) 或 上传文件');
      expect(contentTextarea).toBeDisabled();
      expect(screen.getByText('已选择: test.txt')).toBeInTheDocument();
    });
  });
});
