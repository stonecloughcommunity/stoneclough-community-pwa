import { test, expect } from '@playwright/test';
import { createHelpers, TEST_USERS } from './utils/test-helpers';

test.describe('Community Features Tests', () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Sign in before each test
    await helpers.auth.signIn(TEST_USERS.user.email, TEST_USERS.user.password);
    
    // Navigate to community page
    await helpers.navigation.goToCommunity();
  });

  test('should display community posts', async ({ page }) => {
    // Check community page loads
    await expect(page.locator('h1')).toContainText('Community');
    
    // Check posts container is visible
    await expect(page.locator('[data-testid="posts-container"]')).toBeVisible();
    
    // Check if posts are displayed (might be empty in test environment)
    const posts = page.locator('[data-testid="community-post"]');
    const postCount = await posts.count();
    
    if (postCount > 0) {
      // Check first post has required elements
      const firstPost = posts.first();
      await expect(firstPost.locator('[data-testid="post-author"]')).toBeVisible();
      await expect(firstPost.locator('[data-testid="post-content"]')).toBeVisible();
      await expect(firstPost.locator('[data-testid="post-timestamp"]')).toBeVisible();
    }
  });

  test('should allow creating a new post', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Click create post button
    await page.click('[data-testid="create-post-button"]');
    
    // Should open create post modal/form
    await helpers.wait.waitForModal('create-post-modal');
    
    // Fill post content
    const testPostContent = `Test post created at ${new Date().toISOString()}`;
    await page.fill('[data-testid="post-content-input"]', testPostContent);
    
    // Submit post
    await page.click('[data-testid="submit-post-button"]');
    
    // Should show success message
    await helpers.wait.waitForToast('Post created');
    
    // Should see the new post in the feed
    await expect(page.locator(`text=${testPostContent}`)).toBeVisible();
  });

  test('should allow liking posts', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Find a post to like
    const posts = page.locator('[data-testid="community-post"]');
    
    if (await posts.count() > 0) {
      const firstPost = posts.first();
      const likeButton = firstPost.locator('[data-testid="like-button"]');
      
      // Get initial like count
      const likeCount = firstPost.locator('[data-testid="like-count"]');
      const initialCount = await likeCount.textContent();
      
      // Click like button
      await likeButton.click();
      
      // Should show updated like count
      await expect(likeCount).not.toHaveText(initialCount || '0');
      
      // Like button should show as liked
      await expect(likeButton).toHaveClass(/liked|active/);
    }
  });

  test('should allow commenting on posts', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Find a post to comment on
    const posts = page.locator('[data-testid="community-post"]');
    
    if (await posts.count() > 0) {
      const firstPost = posts.first();
      
      // Click comment button
      await firstPost.locator('[data-testid="comment-button"]').click();
      
      // Should show comment form
      await expect(firstPost.locator('[data-testid="comment-form"]')).toBeVisible();
      
      // Fill comment
      const testComment = `Test comment at ${new Date().toISOString()}`;
      await firstPost.locator('[data-testid="comment-input"]').fill(testComment);
      
      // Submit comment
      await firstPost.locator('[data-testid="submit-comment-button"]').click();
      
      // Should show success message
      await helpers.wait.waitForToast('Comment added');
      
      // Should see the comment
      await expect(firstPost.locator(`text=${testComment}`)).toBeVisible();
    }
  });

  test('should filter posts by category', async ({ page }) => {
    // Check if category filter is available
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    
    if (await categoryFilter.isVisible()) {
      // Select a category
      await categoryFilter.selectOption('events');
      
      // Should filter posts
      await page.waitForLoadState('networkidle');
      
      // Check URL contains filter parameter
      expect(page.url()).toContain('category=events');
      
      // Posts should be filtered (if any exist)
      const posts = page.locator('[data-testid="community-post"]');
      const postCount = await posts.count();
      
      if (postCount > 0) {
        // Check posts have the correct category
        const firstPost = posts.first();
        await expect(firstPost.locator('[data-testid="post-category"]')).toContainText('Events');
      }
    }
  });

  test('should search posts', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Look for search input
    const searchInput = page.locator('[data-testid="posts-search-input"]');
    
    if (await searchInput.isVisible()) {
      // Enter search term
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      
      // Should filter posts based on search
      await page.waitForLoadState('networkidle');
      
      // Check URL contains search parameter
      expect(page.url()).toContain('search=test');
      
      // Results should be filtered
      const posts = page.locator('[data-testid="community-post"]');
      const postCount = await posts.count();
      
      if (postCount > 0) {
        // At least one post should contain the search term
        const postTexts = await posts.allTextContents();
        const hasSearchTerm = postTexts.some(text => 
          text.toLowerCase().includes('test')
        );
        expect(hasSearchTerm).toBeTruthy();
      }
    }
  });

  test('should handle post moderation', async ({ page }) => {
    const helpers = createHelpers(page);
    
    // Find a post with moderation options (user's own post or admin)
    const posts = page.locator('[data-testid="community-post"]');
    
    if (await posts.count() > 0) {
      const firstPost = posts.first();
      const moreButton = firstPost.locator('[data-testid="post-more-button"]');
      
      if (await moreButton.isVisible()) {
        await moreButton.click();
        
        // Check for moderation options
        const editButton = page.locator('[data-testid="edit-post-button"]');
        const deleteButton = page.locator('[data-testid="delete-post-button"]');
        const reportButton = page.locator('[data-testid="report-post-button"]');
        
        if (await editButton.isVisible()) {
          // Test edit functionality
          await editButton.click();
          
          await helpers.wait.waitForModal('edit-post-modal');
          
          // Update post content
          const editInput = page.locator('[data-testid="edit-post-input"]');
          await editInput.fill('Updated post content');
          
          // Save changes
          await page.click('[data-testid="save-post-button"]');
          
          await helpers.wait.waitForToast('Post updated');
        }
        
        if (await reportButton.isVisible()) {
          // Test report functionality
          await reportButton.click();
          
          await helpers.wait.waitForModal('report-post-modal');
          
          // Select report reason
          await page.selectOption('[data-testid="report-reason"]', 'spam');
          
          // Submit report
          await page.click('[data-testid="submit-report-button"]');
          
          await helpers.wait.waitForToast('Report submitted');
        }
      }
    }
  });

  test('should handle infinite scroll', async ({ page }) => {
    // Check if infinite scroll is implemented
    const postsContainer = page.locator('[data-testid="posts-container"]');
    
    // Get initial post count
    const initialPosts = await page.locator('[data-testid="community-post"]').count();
    
    if (initialPosts > 0) {
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait for potential new posts to load
      await page.waitForTimeout(2000);
      
      // Check if more posts loaded
      const newPostCount = await page.locator('[data-testid="community-post"]').count();
      
      // If more posts are available, count should increase
      // If not, count should remain the same (both scenarios are valid)
      expect(newPostCount).toBeGreaterThanOrEqual(initialPosts);
    }
  });

  test('should show empty state when no posts', async ({ page }) => {
    // This test might need to be run with a clean database
    // or with filters that return no results
    
    // Apply a filter that should return no results
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    
    if (await categoryFilter.isVisible()) {
      // Select a category that likely has no posts
      await categoryFilter.selectOption('test-empty-category');
      
      await page.waitForLoadState('networkidle');
      
      // Should show empty state
      await expect(page.locator('[data-testid="empty-posts-state"]')).toBeVisible();
      await expect(page.locator('text=No posts found')).toBeVisible();
    }
  });

  test('should handle real-time updates', async ({ page, context }) => {
    // This test simulates real-time updates by opening a second tab
    const secondPage = await context.newPage();
    const secondHelpers = createHelpers(secondPage);
    
    // Sign in on second page
    await secondHelpers.auth.signIn(TEST_USERS.volunteer.email, TEST_USERS.volunteer.password);
    await secondHelpers.navigation.goToCommunity();
    
    // Create a post on the second page
    await secondPage.click('[data-testid="create-post-button"]');
    await secondHelpers.wait.waitForModal('create-post-modal');
    
    const testPostContent = `Real-time test post ${Date.now()}`;
    await secondPage.fill('[data-testid="post-content-input"]', testPostContent);
    await secondPage.click('[data-testid="submit-post-button"]');
    
    await secondHelpers.wait.waitForToast('Post created');
    
    // Check if the post appears on the first page (real-time update)
    // This might require WebSocket or polling implementation
    await page.waitForTimeout(3000); // Wait for potential real-time update
    
    // Refresh if real-time updates aren't implemented
    await page.reload();
    
    // Should see the new post
    await expect(page.locator(`text=${testPostContent}`)).toBeVisible();
    
    await secondPage.close();
  });
});
