/**
 * Posts Database Integration Tests
 * 
 * Tests the posts functionality with real database operations
 * using test fixtures and database setup utilities.
 */

import { setupDatabaseTests, createTestUserSession, dbTestUtils } from '../../setup/database';
import { testSupabase } from '../../fixtures/database';

describe('Posts Database Integration', () => {
  // Setup database for this test suite
  setupDatabaseTests({
    globalSetup: true,
    perTestSetup: true,
    seedData: 'minimal',
  });

  describe('Post Creation', () => {
    it('should create a new post with valid data', async () => {
      // Create test user session
      const { user } = await createTestUserSession('admin');
      const departmentId = await dbTestUtils.getTestDepartmentId('community-wellbeing');

      // Create post data
      const postData = {
        title: 'Test Post Title',
        content: 'This is a test post content.',
        author_id: user.id,
        department_id: departmentId,
        status: 'published',
        is_faith_content: false,
        tags: ['test', 'community'],
      };

      // Insert post
      const { data, error } = await testSupabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe(postData.title);
      expect(data.content).toBe(postData.content);
      expect(data.author_id).toBe(user.id);
      expect(data.status).toBe('published');
    });

    it('should enforce required fields', async () => {
      const { user } = await createTestUserSession('regularUser');

      // Try to create post without required fields
      const { data, error } = await testSupabase
        .from('posts')
        .insert({
          author_id: user.id,
          // Missing title and content
        })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    it('should validate foreign key constraints', async () => {
      const { user } = await createTestUserSession('regularUser');

      // Try to create post with invalid department_id
      const { data, error } = await testSupabase
        .from('posts')
        .insert({
          title: 'Test Post',
          content: 'Test content',
          author_id: user.id,
          department_id: '00000000-0000-0000-0000-000000000999', // Invalid ID
          status: 'published',
        })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  describe('Post Retrieval', () => {
    it('should retrieve posts with author and department information', async () => {
      // Create test post
      const { user } = await createTestUserSession('admin');
      const departmentId = await dbTestUtils.getTestDepartmentId('community-wellbeing');
      const postId = await dbTestUtils.createTestPost(user.id, departmentId);

      // Retrieve post with joins
      const { data, error } = await testSupabase
        .from('posts')
        .select(`
          *,
          author:profiles(display_name, village),
          department:departments(name, slug)
        `)
        .eq('id', postId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.author).toBeDefined();
      expect(data.department).toBeDefined();
      expect(data.author.display_name).toBeDefined();
      expect(data.department.name).toBeDefined();
    });

    it('should filter posts by department', async () => {
      const { user } = await createTestUserSession('admin');
      const deptId1 = await dbTestUtils.getTestDepartmentId('community-wellbeing');
      const deptId2 = await dbTestUtils.getTestDepartmentId('faith-culture');

      // Create posts in different departments
      await dbTestUtils.createTestPost(user.id, deptId1, { title: 'Community Post' });
      await dbTestUtils.createTestPost(user.id, deptId2, { title: 'Faith Post' });

      // Filter by department
      const { data, error } = await testSupabase
        .from('posts')
        .select('*')
        .eq('department_id', deptId1)
        .eq('status', 'published');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
      expect(data.every(post => post.department_id === deptId1)).toBe(true);
    });

    it('should filter faith content based on user preferences', async () => {
      const { user } = await createTestUserSession('admin');
      const departmentId = await dbTestUtils.getTestDepartmentId('faith-culture');

      // Create faith and non-faith posts
      await dbTestUtils.createTestPost(user.id, departmentId, {
        title: 'Faith Post',
        is_faith_content: true,
      });
      await dbTestUtils.createTestPost(user.id, departmentId, {
        title: 'General Post',
        is_faith_content: false,
      });

      // Get non-faith content only
      const { data: nonFaithPosts, error: nonFaithError } = await testSupabase
        .from('posts')
        .select('*')
        .eq('is_faith_content', false)
        .eq('status', 'published');

      expect(nonFaithError).toBeNull();
      expect(nonFaithPosts.every(post => !post.is_faith_content)).toBe(true);

      // Get faith content only
      const { data: faithPosts, error: faithError } = await testSupabase
        .from('posts')
        .select('*')
        .eq('is_faith_content', true)
        .eq('status', 'published');

      expect(faithError).toBeNull();
      expect(faithPosts.every(post => post.is_faith_content)).toBe(true);
    });
  });

  describe('Post Updates', () => {
    it('should update post content', async () => {
      const { user } = await createTestUserSession('admin');
      const departmentId = await dbTestUtils.getTestDepartmentId('community-wellbeing');
      const postId = await dbTestUtils.createTestPost(user.id, departmentId);

      const updatedContent = 'Updated post content';

      // Update post
      const { data, error } = await testSupabase
        .from('posts')
        .update({ content: updatedContent })
        .eq('id', postId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.content).toBe(updatedContent);
    });

    it('should update post status', async () => {
      const { user } = await createTestUserSession('admin');
      const departmentId = await dbTestUtils.getTestDepartmentId('community-wellbeing');
      const postId = await dbTestUtils.createTestPost(user.id, departmentId, {
        status: 'draft',
      });

      // Publish post
      const { data, error } = await testSupabase
        .from('posts')
        .update({ status: 'published' })
        .eq('id', postId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.status).toBe('published');
    });
  });

  describe('Post Deletion', () => {
    it('should delete a post', async () => {
      const { user } = await createTestUserSession('admin');
      const departmentId = await dbTestUtils.getTestDepartmentId('community-wellbeing');
      const postId = await dbTestUtils.createTestPost(user.id, departmentId);

      // Delete post
      const { error } = await testSupabase
        .from('posts')
        .delete()
        .eq('id', postId);

      expect(error).toBeNull();

      // Verify post is deleted
      const { data, error: selectError } = await testSupabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      expect(selectError).toBeDefined();
      expect(data).toBeNull();
    });

    it('should cascade delete related data', async () => {
      const { user } = await createTestUserSession('admin');
      const departmentId = await dbTestUtils.getTestDepartmentId('community-wellbeing');
      const postId = await dbTestUtils.createTestPost(user.id, departmentId);

      // Create related data (likes, comments)
      await testSupabase.from('post_likes').insert({
        post_id: postId,
        user_id: user.id,
      });

      await testSupabase.from('comments').insert({
        post_id: postId,
        author_id: user.id,
        content: 'Test comment',
      });

      // Delete post
      await testSupabase.from('posts').delete().eq('id', postId);

      // Verify related data is deleted
      const { data: likes } = await testSupabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId);

      const { data: comments } = await testSupabase
        .from('comments')
        .select('*')
        .eq('post_id', postId);

      expect(likes).toHaveLength(0);
      expect(comments).toHaveLength(0);
    });
  });

  describe('Post Search and Filtering', () => {
    it('should search posts by title and content', async () => {
      const { user } = await createTestUserSession('admin');
      const departmentId = await dbTestUtils.getTestDepartmentId('community-wellbeing');

      // Create posts with searchable content
      await dbTestUtils.createTestPost(user.id, departmentId, {
        title: 'Community Garden Project',
        content: 'Join us for gardening activities',
      });
      await dbTestUtils.createTestPost(user.id, departmentId, {
        title: 'Local Business News',
        content: 'Updates from local businesses',
      });

      // Search for garden-related posts
      const { data, error } = await testSupabase
        .from('posts')
        .select('*')
        .or('title.ilike.%garden%,content.ilike.%garden%')
        .eq('status', 'published');

      expect(error).toBeNull();
      expect(data.length).toBeGreaterThan(0);
      expect(
        data.some(post => 
          post.title.toLowerCase().includes('garden') || 
          post.content.toLowerCase().includes('garden')
        )
      ).toBe(true);
    });

    it('should filter posts by tags', async () => {
      const { user } = await createTestUserSession('admin');
      const departmentId = await dbTestUtils.getTestDepartmentId('community-wellbeing');

      // Create posts with different tags
      await dbTestUtils.createTestPost(user.id, departmentId, {
        tags: ['volunteer', 'community'],
      });
      await dbTestUtils.createTestPost(user.id, departmentId, {
        tags: ['business', 'local'],
      });

      // Filter by tag
      const { data, error } = await testSupabase
        .from('posts')
        .select('*')
        .contains('tags', ['volunteer'])
        .eq('status', 'published');

      expect(error).toBeNull();
      expect(data.length).toBeGreaterThan(0);
      expect(data.every(post => post.tags.includes('volunteer'))).toBe(true);
    });
  });
});
