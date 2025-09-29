/**
 * Database Test Setup Utilities
 * 
 * This module provides Jest setup and teardown utilities for database testing.
 * It integrates with the test fixtures to provide consistent test environments.
 */

import { setupTestDatabase, teardownTestDatabase, testSupabase } from '../fixtures/database';

/**
 * Global test database setup
 * Called once before all tests in a test suite
 */
export async function setupTestDatabaseGlobal(): Promise<void> {
  try {
    console.log('🗄️  Setting up test database...');
    
    // Verify database connection
    const { data, error } = await testSupabase.from('profiles').select('count').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Test database connection verified');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

/**
 * Global test database teardown
 * Called once after all tests in a test suite
 */
export async function teardownTestDatabaseGlobal(): Promise<void> {
  try {
    console.log('🧹 Cleaning up test database...');
    await teardownTestDatabase();
    console.log('✅ Test database cleanup complete');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
    // Don't throw here to avoid masking test failures
  }
}

/**
 * Setup database for individual test
 * Use this in beforeEach hooks for tests that need fresh data
 */
export async function setupTestDatabaseForTest(options?: {
  clean?: boolean;
  seed?: 'full' | 'minimal' | 'none';
}): Promise<void> {
  await setupTestDatabase(options);
}

/**
 * Cleanup database after individual test
 * Use this in afterEach hooks for tests that modify data
 */
export async function cleanupTestDatabaseAfterTest(): Promise<void> {
  await teardownTestDatabase();
}

/**
 * Jest setup helper for database tests
 * Use this in test files that need database access
 */
export function setupDatabaseTests(options?: {
  globalSetup?: boolean;
  perTestSetup?: boolean;
  seedData?: 'full' | 'minimal' | 'none';
}): void {
  const {
    globalSetup = true,
    perTestSetup = false,
    seedData = 'minimal'
  } = options || {};

  if (globalSetup) {
    beforeAll(async () => {
      await setupTestDatabaseGlobal();
    });

    afterAll(async () => {
      await teardownTestDatabaseGlobal();
    });
  }

  if (perTestSetup) {
    beforeEach(async () => {
      await setupTestDatabaseForTest({ seed: seedData });
    });

    afterEach(async () => {
      await cleanupTestDatabaseAfterTest();
    });
  }
}

/**
 * Create a test user and return authentication session
 */
export async function createTestUserSession(userKey: 'admin' | 'regularUser' | 'seniorUser' | 'volunteer' = 'regularUser') {
  const { testUsers } = await import('../fixtures/database');
  const userData = testUsers[userKey];
  
  // Sign in the test user
  const { data, error } = await testSupabase.auth.signInWithPassword({
    email: userData.email,
    password: userData.password,
  });

  if (error) {
    throw new Error(`Failed to create test user session: ${error.message}`);
  }

  return {
    user: data.user,
    session: data.session,
    profile: userData.profile,
  };
}

/**
 * Sign out current test user
 */
export async function signOutTestUser(): Promise<void> {
  await testSupabase.auth.signOut();
}

/**
 * Wait for database operations to complete
 * Useful for tests that need to wait for triggers or async operations
 */
export async function waitForDatabaseOperations(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verify test data exists in database
 */
export async function verifyTestDataExists(): Promise<boolean> {
  try {
    const { data: profiles, error: profilesError } = await testSupabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError) return false;

    const { data: departments, error: deptError } = await testSupabase
      .from('departments')
      .select('id')
      .limit(1);

    if (deptError) return false;

    return profiles.length > 0 && departments.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get test database statistics
 */
export async function getTestDatabaseStats(): Promise<{
  profiles: number;
  posts: number;
  events: number;
  directoryEntries: number;
  jobPostings: number;
}> {
  const [profiles, posts, events, directoryEntries, jobPostings] = await Promise.all([
    testSupabase.from('profiles').select('id', { count: 'exact', head: true }),
    testSupabase.from('posts').select('id', { count: 'exact', head: true }),
    testSupabase.from('events').select('id', { count: 'exact', head: true }),
    testSupabase.from('directory_entries').select('id', { count: 'exact', head: true }),
    testSupabase.from('job_postings').select('id', { count: 'exact', head: true }),
  ]);

  return {
    profiles: profiles.count || 0,
    posts: posts.count || 0,
    events: events.count || 0,
    directoryEntries: directoryEntries.count || 0,
    jobPostings: jobPostings.count || 0,
  };
}

/**
 * Database test utilities for common operations
 */
export const dbTestUtils = {
  /**
   * Create a test post and return its ID
   */
  async createTestPost(authorId: string, departmentId: string, overrides?: any): Promise<string> {
    const { testDataFactories } = await import('../fixtures/database');
    const postData = testDataFactories.createRandomPost(authorId, departmentId, overrides);
    
    const { data, error } = await testSupabase
      .from('posts')
      .insert(postData)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  /**
   * Create a test event and return its ID
   */
  async createTestEvent(organizerId: string, departmentId: string, overrides?: any): Promise<string> {
    const { testDataFactories } = await import('../fixtures/database');
    const eventData = testDataFactories.createRandomEvent(organizerId, departmentId, overrides);
    
    const { data, error } = await testSupabase
      .from('events')
      .insert(eventData)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  /**
   * Create a test directory entry and return its ID
   */
  async createTestDirectoryEntry(ownerId: string, overrides?: any): Promise<string> {
    const { testDataFactories } = await import('../fixtures/database');
    const entryData = testDataFactories.createRandomDirectoryEntry(ownerId, overrides);
    
    const { data, error } = await testSupabase
      .from('directory_entries')
      .insert(entryData)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  /**
   * Create a test job posting and return its ID
   */
  async createTestJobPosting(posterId: string, overrides?: any): Promise<string> {
    const { testDataFactories } = await import('../fixtures/database');
    const jobData = testDataFactories.createRandomJobPosting(posterId, overrides);
    
    const { data, error } = await testSupabase
      .from('job_postings')
      .insert(jobData)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  /**
   * Get a test user ID by key
   */
  async getTestUserId(userKey: 'admin' | 'regularUser' | 'seniorUser' | 'volunteer'): Promise<string> {
    const { testUsers } = await import('../fixtures/database');
    const userData = testUsers[userKey];
    
    const { data, error } = await testSupabase
      .from('profiles')
      .select('id')
      .eq('display_name', userData.profile.display_name)
      .single();

    if (error) throw error;
    return data.id;
  },

  /**
   * Get a test department ID by slug
   */
  async getTestDepartmentId(slug: string): Promise<string> {
    const { data, error } = await testSupabase
      .from('departments')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data.id;
  },
};

/**
 * Mock database responses for unit tests
 */
export const mockDatabaseResponses = {
  /**
   * Mock successful database response
   */
  success: (data: any) => ({
    data,
    error: null,
    status: 200,
    statusText: 'OK',
  }),

  /**
   * Mock database error response
   */
  error: (message: string, code?: string) => ({
    data: null,
    error: {
      message,
      code: code || 'PGRST000',
      details: null,
      hint: null,
    },
    status: 400,
    statusText: 'Bad Request',
  }),

  /**
   * Mock empty database response
   */
  empty: () => ({
    data: [],
    error: null,
    status: 200,
    statusText: 'OK',
  }),
};
