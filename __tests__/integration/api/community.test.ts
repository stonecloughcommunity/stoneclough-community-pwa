/**
 * Integration tests for community API routes
 */

import { NextRequest } from 'next/server';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  rpc: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock authentication middleware
jest.mock('@/lib/auth/middleware', () => ({
  withAuth: jest.fn((handler) => handler),
  requireAuth: jest.fn((handler) => handler),
}));

// Import API handlers after mocking
import { GET as getPostsHandler, POST as createPostHandler } from '@/app/api/community/posts/route';
import { POST as likePostHandler } from '@/app/api/community/posts/[id]/like/route';
import { POST as commentHandler } from '@/app/api/community/posts/[id]/comments/route';

describe('Community API Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('GET /api/community/posts', () => {
    it('should fetch community posts', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          content: 'Test post 1',
          author_id: 'user-123',
          created_at: new Date().toISOString(),
          profiles: {
            display_name: 'Test User',
            village: 'Stoneclough',
          },
          likes_count: 5,
          comments_count: 2,
          user_has_liked: false,
        },
        {
          id: 'post-2',
          content: 'Test post 2',
          author_id: 'user-456',
          created_at: new Date().toISOString(),
          profiles: {
            display_name: 'Another User',
            village: 'Stoneclough',
          },
          likes_count: 3,
          comments_count: 1,
          user_has_liked: true,
        },
      ];

      mockSupabaseClient.from().select.mockResolvedValue({
        data: mockPosts,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/community/posts');
      const response = await getPostsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.posts).toHaveLength(2);
      expect(data.posts[0].content).toBe('Test post 1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('posts');
    });

    it('should handle pagination', async () => {
      const request = new NextRequest('http://localhost:3000/api/community/posts?page=2&limit=10');
      
      mockSupabaseClient.from().select.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await getPostsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabaseClient.from().range).toHaveBeenCalledWith(10, 19);
    });

    it('should filter posts by category', async () => {
      const request = new NextRequest('http://localhost:3000/api/community/posts?category=events');
      
      mockSupabaseClient.from().select.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await getPostsHandler(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('category', 'events');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from().select.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/community/posts');
      const response = await getPostsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
    });
  });

  describe('POST /api/community/posts', () => {
    it('should create a new post', async () => {
      const newPost = {
        id: 'post-new',
        content: 'New test post',
        author_id: 'user-123',
        created_at: new Date().toISOString(),
      };

      mockSupabaseClient.from().insert.mockResolvedValue({
        data: [newPost],
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer access-token',
        },
        body: JSON.stringify({
          content: 'New test post',
          category: 'general',
        }),
      });

      const response = await createPostHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.post.content).toBe('New test post');
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        content: 'New test post',
        category: 'general',
        author_id: 'user-123',
      });
    });

    it('should validate post content', async () => {
      const request = new NextRequest('http://localhost:3000/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer access-token',
        },
        body: JSON.stringify({
          content: '', // Empty content
        }),
      });

      const response = await createPostHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Content is required');
    });

    it('should validate post content length', async () => {
      const longContent = 'a'.repeat(5001); // Assuming 5000 char limit

      const request = new NextRequest('http://localhost:3000/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer access-token',
        },
        body: JSON.stringify({
          content: longContent,
        }),
      });

      const response = await createPostHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('too long');
    });

    it('should require authentication', async () => {
      // Mock unauthenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest('http://localhost:3000/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Test post',
        }),
      });

      const response = await createPostHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('authentication');
    });
  });

  describe('POST /api/community/posts/[id]/like', () => {
    it('should like a post', async () => {
      // Mock checking if user already liked
      mockSupabaseClient.from().select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock inserting like
      mockSupabaseClient.from().insert.mockResolvedValue({
        data: [{ post_id: 'post-1', user_id: 'user-123' }],
        error: null,
      });

      // Mock updating like count
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/community/posts/post-1/like', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer access-token',
        },
      });

      const response = await likePostHandler(request, { params: { id: 'post-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.liked).toBe(true);
      expect(mockSupabaseClient.from().insert).toHaveBeenCalled();
    });

    it('should unlike a post', async () => {
      // Mock existing like
      mockSupabaseClient.from().select.mockResolvedValueOnce({
        data: [{ post_id: 'post-1', user_id: 'user-123' }],
        error: null,
      });

      // Mock deleting like
      mockSupabaseClient.from().delete.mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock updating like count
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/community/posts/post-1/like', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer access-token',
        },
      });

      const response = await likePostHandler(request, { params: { id: 'post-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.liked).toBe(false);
      expect(mockSupabaseClient.from().delete).toHaveBeenCalled();
    });

    it('should handle non-existent post', async () => {
      mockSupabaseClient.from().select.mockResolvedValue({
        data: null,
        error: { message: 'Post not found' },
      });

      const request = new NextRequest('http://localhost:3000/api/community/posts/non-existent/like', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer access-token',
        },
      });

      const response = await likePostHandler(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('POST /api/community/posts/[id]/comments', () => {
    it('should add a comment to a post', async () => {
      const newComment = {
        id: 'comment-1',
        content: 'Test comment',
        post_id: 'post-1',
        author_id: 'user-123',
        created_at: new Date().toISOString(),
      };

      mockSupabaseClient.from().insert.mockResolvedValue({
        data: [newComment],
        error: null,
      });

      // Mock updating comment count
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/community/posts/post-1/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer access-token',
        },
        body: JSON.stringify({
          content: 'Test comment',
        }),
      });

      const response = await commentHandler(request, { params: { id: 'post-1' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.comment.content).toBe('Test comment');
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        content: 'Test comment',
        post_id: 'post-1',
        author_id: 'user-123',
      });
    });

    it('should validate comment content', async () => {
      const request = new NextRequest('http://localhost:3000/api/community/posts/post-1/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer access-token',
        },
        body: JSON.stringify({
          content: '', // Empty content
        }),
      });

      const response = await commentHandler(request, { params: { id: 'post-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Content is required');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting for post creation', async () => {
      // This would test rate limiting middleware
      // Implementation depends on your rate limiting strategy
      
      const requests = Array.from({ length: 10 }, (_, i) => 
        new NextRequest('http://localhost:3000/api/community/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer access-token',
            'X-Forwarded-For': '192.168.1.1', // Same IP
          },
          body: JSON.stringify({
            content: `Test post ${i}`,
          }),
        })
      );

      // In a real implementation, you'd expect some requests to be rate limited
      // This is a placeholder for rate limiting tests
    });
  });
});
