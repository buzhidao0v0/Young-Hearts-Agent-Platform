import { describe, it, expect, vi, beforeEach } from 'vitest';
import { knowledgeApi } from './knowledge';

// Mock global fetch
global.fetch = vi.fn();

describe('knowledgeApi', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('getItems should call correct URL with params', async () => {
    const mockData = [{ id: 1, title: 'Test' }];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await knowledgeApi.getItems({ status: 'published' });
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/knowledge/items?status=published'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual(mockData);
  });

  it('getItemById should call correct URL', async () => {
    const mockData = { id: 123, title: 'Test Detail' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await knowledgeApi.getItemById(123);
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/knowledge/items/123'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual(mockData);
  });

  it('getMyItems should call correct URL with params', async () => {
    const mockData = [{ id: 1, title: 'My Item' }];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await knowledgeApi.getMyItems({ status: 'draft' });
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/knowledge/my-items?status=draft'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual(mockData);
  });

  it('getAuditList should call correct URL', async () => {
    const mockData = [{ id: 1, status: 'pending' }];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await knowledgeApi.getAuditList();
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/knowledge/audit-list'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual(mockData);
  });

  it('auditItem should send POST request with action', async () => {
    const mockData = { success: true };
    const auditData = { action: 'pass' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await knowledgeApi.auditItem(123, auditData);
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/knowledge/123/audit'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(auditData),
      })
    );
    expect(result).toEqual(mockData);
  });

  it('uploadFile should send POST request with FormData', async () => {
    const mockData = { url: 'http://example.com/file.pdf' };
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }));
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await knowledgeApi.uploadFile(formData);
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/knowledge/upload'),
      expect.objectContaining({
        method: 'POST',
        body: formData,
      })
    );
    expect(result).toEqual(mockData);
  });

  it('should throw error when response is not ok', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Custom Error' }),
    });

    await expect(knowledgeApi.getItems()).rejects.toThrow('Custom Error');
  });
});
