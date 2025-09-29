/**
 * Database Test Fixtures
 * 
 * This module provides test data fixtures and database seeding utilities
 * for consistent testing environments across unit, integration, and E2E tests.
 */

import { createClient } from '@supabase/supabase-js';
// Mock faker to avoid ESM issues in Jest
const faker = {
  person: {
    fullName: () => 'John Doe',
    firstName: () => 'John',
    lastName: () => 'Doe',
  },
  lorem: {
    paragraph: () => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    sentence: () => 'Lorem ipsum dolor sit amet.',
    words: (count: number = 3) => Array(count).fill('lorem').join(' '),
  },
  internet: {
    email: () => 'test@example.com',
    url: () => 'https://example.com',
  },
  location: {
    city: () => 'Manchester',
    streetAddress: () => '123 Main St',
  },
  date: {
    recent: () => new Date(),
    past: () => new Date(Date.now() - 86400000), // 1 day ago
  },
  number: {
    int: (options?: { min?: number; max?: number }) => {
      const min = options?.min ?? 1;
      const max = options?.max ?? 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
  },
  helpers: {
    arrayElement: <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)],
  },
};

// Test database configuration
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const TEST_SUPABASE_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create test client with service role key for full access
export const testSupabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_KEY);

// Test user fixtures
export const testUsers = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@test.stoneclough.uk',
    password: 'TestPassword123!',
    profile: {
      display_name: 'Test Admin',
      village: 'Stoneclough',
      bio: 'Test administrator account',
      is_admin: true,
      is_volunteer: true,
      age_group: '35-44',
      faith_preference: 'christian',
      department_interests: ['faith-culture', 'governance-partnerships'],
      accessibility_needs: [],
      senior_mode_enabled: false,
    },
  },
  regularUser: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'user@test.stoneclough.uk',
    password: 'TestPassword123!',
    profile: {
      display_name: 'Test User',
      village: 'Prestolee',
      bio: 'Regular test user account',
      is_admin: false,
      is_volunteer: false,
      age_group: '25-34',
      faith_preference: 'none',
      department_interests: ['community-wellbeing', 'economy-enterprise'],
      accessibility_needs: ['large-text'],
      senior_mode_enabled: false,
    },
  },
  seniorUser: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'senior@test.stoneclough.uk',
    password: 'TestPassword123!',
    profile: {
      display_name: 'Test Senior',
      village: 'Ringley',
      bio: 'Senior test user account',
      is_admin: false,
      is_volunteer: true,
      age_group: '65+',
      faith_preference: 'christian',
      department_interests: ['faith-culture', 'community-wellbeing'],
      accessibility_needs: ['large-text', 'high-contrast'],
      senior_mode_enabled: true,
    },
  },
  volunteer: {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'volunteer@test.stoneclough.uk',
    password: 'TestPassword123!',
    profile: {
      display_name: 'Test Volunteer',
      village: 'Stoneclough',
      bio: 'Volunteer test user account',
      is_admin: false,
      is_volunteer: true,
      age_group: '45-54',
      faith_preference: 'other',
      department_interests: ['community-wellbeing', 'land-food-sustainability'],
      accessibility_needs: [],
      senior_mode_enabled: false,
    },
  },
};

// Test departments
export const testDepartments = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Faith & Culture',
    slug: 'faith-culture',
    description: 'Spiritual life, cultural events, and community traditions',
    color: '#8B5CF6',
    icon: 'church',
    is_active: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Community Wellbeing',
    slug: 'community-wellbeing',
    description: 'Health, social services, and community support',
    color: '#10B981',
    icon: 'heart',
    is_active: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Economy & Enterprise',
    slug: 'economy-enterprise',
    description: 'Local business, employment, and economic development',
    color: '#F59E0B',
    icon: 'briefcase',
    is_active: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: 'Land, Food & Sustainability',
    slug: 'land-food-sustainability',
    description: 'Environment, agriculture, and sustainable living',
    color: '#059669',
    icon: 'leaf',
    is_active: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    name: 'Technology & Platform',
    slug: 'technology-platform',
    description: 'Digital infrastructure and platform development',
    color: '#3B82F6',
    icon: 'computer',
    is_active: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    name: 'Governance & Partnerships',
    slug: 'governance-partnerships',
    description: 'Community governance and external partnerships',
    color: '#6366F1',
    icon: 'users',
    is_active: true,
  },
];

// Test posts
export const testPosts = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    title: 'Welcome to the Community',
    content: 'This is a test post to welcome everyone to our community platform.',
    author_id: testUsers.admin.id,
    department_id: testDepartments[1].id, // Community Wellbeing
    status: 'published',
    is_faith_content: false,
    tags: ['welcome', 'community'],
    like_count: 5,
    comment_count: 2,
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    title: 'Sunday Service Information',
    content: 'Information about upcoming Sunday services and special events.',
    author_id: testUsers.admin.id,
    department_id: testDepartments[0].id, // Faith & Culture
    status: 'published',
    is_faith_content: true,
    tags: ['service', 'faith', 'sunday'],
    like_count: 8,
    comment_count: 3,
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    title: 'Local Business Spotlight',
    content: 'Highlighting amazing local businesses in our community.',
    author_id: testUsers.volunteer.id,
    department_id: testDepartments[2].id, // Economy & Enterprise
    status: 'published',
    is_faith_content: false,
    tags: ['business', 'local', 'spotlight'],
    like_count: 12,
    comment_count: 5,
  },
];

// Test events
export const testEvents = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    title: 'Community Garden Workday',
    description: 'Join us for a community garden workday to prepare for spring planting.',
    organizer_id: testUsers.volunteer.id,
    department_id: testDepartments[3].id, // Land, Food & Sustainability
    location: 'Community Garden, Stoneclough',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 4 hours later
    max_participants: 20,
    current_participants: 8,
    status: 'active',
    is_faith_content: false,
    tags: ['garden', 'volunteer', 'environment'],
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    title: 'Prayer Meeting',
    description: 'Weekly prayer meeting for community members.',
    organizer_id: testUsers.admin.id,
    department_id: testDepartments[0].id, // Faith & Culture
    location: 'Community Hall',
    start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
    max_participants: 50,
    current_participants: 15,
    status: 'active',
    is_faith_content: true,
    tags: ['prayer', 'faith', 'weekly'],
  },
];

// Test directory entries
export const testDirectoryEntries = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    name: 'The Local Café',
    description: 'Cozy café serving fresh coffee and homemade pastries.',
    category: 'restaurant',
    address: '123 High Street, Stoneclough',
    phone: '01204 123456',
    email: 'info@localcafe.co.uk',
    website: 'https://localcafe.co.uk',
    owner_id: testUsers.regularUser.id,
    is_verified: true,
    status: 'active',
    opening_hours: {
      monday: '8:00-17:00',
      tuesday: '8:00-17:00',
      wednesday: '8:00-17:00',
      thursday: '8:00-17:00',
      friday: '8:00-17:00',
      saturday: '9:00-16:00',
      sunday: 'closed',
    },
    tags: ['coffee', 'pastries', 'local'],
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    name: 'Green Thumb Gardening',
    description: 'Professional gardening and landscaping services.',
    category: 'service',
    address: '456 Garden Lane, Prestolee',
    phone: '01204 654321',
    email: 'contact@greenthumb.co.uk',
    website: 'https://greenthumb.co.uk',
    owner_id: testUsers.volunteer.id,
    is_verified: true,
    status: 'active',
    opening_hours: {
      monday: '8:00-18:00',
      tuesday: '8:00-18:00',
      wednesday: '8:00-18:00',
      thursday: '8:00-18:00',
      friday: '8:00-18:00',
      saturday: '8:00-16:00',
      sunday: 'closed',
    },
    tags: ['gardening', 'landscaping', 'professional'],
  },
];

// Test job postings
export const testJobPostings = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    title: 'Community Coordinator',
    description: 'Full-time position coordinating community events and programs.',
    company_name: 'Stoneclough Community Centre',
    location: 'Stoneclough',
    job_type: 'full-time',
    salary_range: '£25,000 - £30,000',
    requirements: ['Experience in community work', 'Excellent communication skills', 'Driving license'],
    benefits: ['Pension scheme', 'Flexible working', 'Professional development'],
    contact_email: 'jobs@stoneclough.org.uk',
    posted_by: testUsers.admin.id,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    status: 'active',
    is_featured: true,
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    title: 'Volunteer Gardener',
    description: 'Part-time volunteer position helping with community gardens.',
    company_name: 'Community Gardens Initiative',
    location: 'Various locations',
    job_type: 'volunteer',
    salary_range: 'Volunteer position',
    requirements: ['Interest in gardening', 'Physical fitness', 'Reliability'],
    benefits: ['Training provided', 'Flexible hours', 'Community impact'],
    contact_email: 'gardens@stoneclough.org.uk',
    posted_by: testUsers.volunteer.id,
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    status: 'active',
    is_featured: false,
  },
];

// Test volunteer opportunities
export const testVolunteerOpportunities = [
  {
    id: '60000000-0000-0000-0000-000000000001',
    title: 'Community Event Helper',
    description: 'Help organize and run community events throughout the year.',
    organizer_id: testUsers.admin.id,
    department_id: testDepartments[1].id, // Community Wellbeing
    location: 'Various venues',
    time_commitment: '4-8 hours per month',
    skills_required: ['Organization', 'Communication', 'Teamwork'],
    benefits: ['Meet new people', 'Develop skills', 'Make a difference'],
    status: 'active',
    max_volunteers: 10,
    current_volunteers: 3,
    tags: ['events', 'organization', 'community'],
  },
];

/**
 * Clean all test data from the database
 */
export async function cleanTestData(): Promise<void> {
  const tables = [
    'volunteer_applications',
    'volunteer_opportunities',
    'job_applications',
    'job_postings',
    'business_reviews',
    'directory_entries',
    'event_registrations',
    'events',
    'prayer_responses',
    'prayer_requests',
    'comments',
    'post_likes',
    'posts',
    'profiles',
    'departments',
  ];

  for (const table of tables) {
    try {
      await testSupabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.warn(`Failed to clean table ${table}:`, error);
    }
  }

  // Clean auth users (requires admin API)
  try {
    const { data: users } = await testSupabase.auth.admin.listUsers();
    if (users?.users) {
      for (const user of users.users) {
        if (user.email?.includes('@test.stoneclough.uk')) {
          await testSupabase.auth.admin.deleteUser(user.id);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to clean auth users:', error);
  }
}

/**
 * Seed the database with test data
 */
export async function seedTestData(): Promise<void> {
  try {
    // Clean existing test data first
    await cleanTestData();

    // Create test users
    for (const [key, userData] of Object.entries(testUsers)) {
      try {
        const { data: authUser, error: authError } = await testSupabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          user_metadata: { display_name: userData.profile.display_name },
          email_confirm: true,
        });

        if (authError) {
          console.warn(`Failed to create auth user ${key}:`, authError);
          continue;
        }

        // Create profile
        const { error: profileError } = await testSupabase
          .from('profiles')
          .insert({
            id: authUser.user!.id,
            ...userData.profile,
          });

        if (profileError) {
          console.warn(`Failed to create profile for ${key}:`, profileError);
        }
      } catch (error) {
        console.warn(`Failed to create user ${key}:`, error);
      }
    }

    // Seed departments
    const { error: deptError } = await testSupabase
      .from('departments')
      .insert(testDepartments);

    if (deptError) {
      console.warn('Failed to seed departments:', deptError);
    }

    // Seed posts
    const { error: postsError } = await testSupabase
      .from('posts')
      .insert(testPosts);

    if (postsError) {
      console.warn('Failed to seed posts:', postsError);
    }

    // Seed events
    const { error: eventsError } = await testSupabase
      .from('events')
      .insert(testEvents);

    if (eventsError) {
      console.warn('Failed to seed events:', eventsError);
    }

    // Seed directory entries
    const { error: directoryError } = await testSupabase
      .from('directory_entries')
      .insert(testDirectoryEntries);

    if (directoryError) {
      console.warn('Failed to seed directory entries:', directoryError);
    }

    // Seed job postings
    const { error: jobsError } = await testSupabase
      .from('job_postings')
      .insert(testJobPostings);

    if (jobsError) {
      console.warn('Failed to seed job postings:', jobsError);
    }

    // Seed volunteer opportunities
    const { error: volunteerError } = await testSupabase
      .from('volunteer_opportunities')
      .insert(testVolunteerOpportunities);

    if (volunteerError) {
      console.warn('Failed to seed volunteer opportunities:', volunteerError);
    }

    console.log('Test data seeded successfully');
  } catch (error) {
    console.error('Failed to seed test data:', error);
    throw error;
  }
}

/**
 * Generate random test data using Faker
 */
export const testDataFactories = {
  /**
   * Generate a random user profile
   */
  createRandomProfile: (overrides: Partial<any> = {}) => ({
    display_name: faker.person.fullName(),
    village: faker.helpers.arrayElement(['Stoneclough', 'Prestolee', 'Ringley']),
    bio: faker.lorem.sentence(),
    is_admin: false,
    is_volunteer: faker.datatype.boolean(),
    age_group: faker.helpers.arrayElement(['18-24', '25-34', '35-44', '45-54', '55-64', '65+']),
    faith_preference: faker.helpers.arrayElement(['christian', 'muslim', 'jewish', 'hindu', 'buddhist', 'other', 'none']),
    department_interests: faker.helpers.arrayElements(
      ['faith-culture', 'community-wellbeing', 'economy-enterprise', 'land-food-sustainability', 'technology-platform', 'governance-partnerships'],
      { min: 1, max: 3 }
    ),
    accessibility_needs: faker.helpers.arrayElements(['large-text', 'high-contrast', 'screen-reader', 'keyboard-navigation'], { min: 0, max: 2 }),
    senior_mode_enabled: faker.datatype.boolean(),
    ...overrides,
  }),

  /**
   * Generate a random post
   */
  createRandomPost: (authorId: string, departmentId: string, overrides: Partial<any> = {}) => ({
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(2),
    author_id: authorId,
    department_id: departmentId,
    status: faker.helpers.arrayElement(['draft', 'published', 'archived']),
    is_faith_content: faker.datatype.boolean(),
    tags: faker.helpers.arrayElements(['community', 'local', 'news', 'event', 'volunteer', 'business'], { min: 1, max: 3 }),
    like_count: faker.number.int({ min: 0, max: 50 }),
    comment_count: faker.number.int({ min: 0, max: 20 }),
    ...overrides,
  }),

  /**
   * Generate a random event
   */
  createRandomEvent: (organizerId: string, departmentId: string, overrides: Partial<any> = {}) => {
    const startDate = faker.date.future();
    const endDate = new Date(startDate.getTime() + faker.number.int({ min: 1, max: 8 }) * 60 * 60 * 1000);

    return {
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraphs(1),
      organizer_id: organizerId,
      department_id: departmentId,
      location: faker.location.streetAddress(),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      max_participants: faker.number.int({ min: 10, max: 100 }),
      current_participants: faker.number.int({ min: 0, max: 50 }),
      status: faker.helpers.arrayElement(['draft', 'active', 'cancelled', 'completed']),
      is_faith_content: faker.datatype.boolean(),
      tags: faker.helpers.arrayElements(['event', 'community', 'volunteer', 'social', 'educational'], { min: 1, max: 3 }),
      ...overrides,
    };
  },

  /**
   * Generate a random directory entry
   */
  createRandomDirectoryEntry: (ownerId: string, overrides: Partial<any> = {}) => ({
    name: faker.company.name(),
    description: faker.company.catchPhrase(),
    category: faker.helpers.arrayElement(['restaurant', 'retail', 'service', 'healthcare', 'education', 'other']),
    address: faker.location.streetAddress(),
    phone: faker.phone.number(),
    email: faker.internet.email(),
    website: faker.internet.url(),
    owner_id: ownerId,
    is_verified: faker.datatype.boolean(),
    status: faker.helpers.arrayElement(['pending', 'active', 'suspended']),
    opening_hours: {
      monday: '9:00-17:00',
      tuesday: '9:00-17:00',
      wednesday: '9:00-17:00',
      thursday: '9:00-17:00',
      friday: '9:00-17:00',
      saturday: '10:00-16:00',
      sunday: 'closed',
    },
    tags: faker.helpers.arrayElements(['local', 'family', 'professional', 'affordable', 'quality'], { min: 1, max: 3 }),
    ...overrides,
  }),

  /**
   * Generate a random job posting
   */
  createRandomJobPosting: (posterId: string, overrides: Partial<any> = {}) => {
    const expiresAt = faker.date.future();

    return {
      title: faker.person.jobTitle(),
      description: faker.lorem.paragraphs(2),
      company_name: faker.company.name(),
      location: faker.helpers.arrayElement(['Stoneclough', 'Prestolee', 'Ringley', 'Remote']),
      job_type: faker.helpers.arrayElement(['full-time', 'part-time', 'contract', 'temporary', 'volunteer']),
      salary_range: faker.helpers.arrayElement(['£20,000 - £25,000', '£25,000 - £35,000', '£35,000 - £45,000', 'Competitive', 'Volunteer']),
      requirements: faker.helpers.arrayElements([
        'Excellent communication skills',
        'Team player',
        'Problem-solving abilities',
        'Attention to detail',
        'Computer literacy',
        'Driving license',
        'Previous experience preferred'
      ], { min: 2, max: 4 }),
      benefits: faker.helpers.arrayElements([
        'Pension scheme',
        'Flexible working',
        'Professional development',
        'Health insurance',
        'Paid holidays',
        'Training provided'
      ], { min: 1, max: 3 }),
      contact_email: faker.internet.email(),
      posted_by: posterId,
      expires_at: expiresAt.toISOString(),
      status: faker.helpers.arrayElement(['active', 'filled', 'expired', 'closed']),
      is_featured: faker.datatype.boolean(),
      ...overrides,
    };
  },
};

/**
 * Create a minimal test dataset for quick tests
 */
export async function seedMinimalTestData(): Promise<void> {
  try {
    // Create one admin user
    const { data: adminUser, error: adminError } = await testSupabase.auth.admin.createUser({
      email: testUsers.admin.email,
      password: testUsers.admin.password,
      user_metadata: { display_name: testUsers.admin.profile.display_name },
      email_confirm: true,
    });

    if (adminError) throw adminError;

    // Create admin profile
    await testSupabase.from('profiles').insert({
      id: adminUser.user!.id,
      ...testUsers.admin.profile,
    });

    // Create one regular user
    const { data: regularUser, error: regularError } = await testSupabase.auth.admin.createUser({
      email: testUsers.regularUser.email,
      password: testUsers.regularUser.password,
      user_metadata: { display_name: testUsers.regularUser.profile.display_name },
      email_confirm: true,
    });

    if (regularError) throw regularError;

    // Create regular user profile
    await testSupabase.from('profiles').insert({
      id: regularUser.user!.id,
      ...testUsers.regularUser.profile,
    });

    // Seed minimal departments
    await testSupabase.from('departments').insert(testDepartments.slice(0, 3));

    // Create one test post
    await testSupabase.from('posts').insert(testPosts[0]);

    console.log('Minimal test data seeded successfully');
  } catch (error) {
    console.error('Failed to seed minimal test data:', error);
    throw error;
  }
}

/**
 * Setup test database for a specific test suite
 */
export async function setupTestDatabase(options: {
  clean?: boolean;
  seed?: 'full' | 'minimal' | 'none';
} = {}): Promise<void> {
  const { clean = true, seed = 'minimal' } = options;

  if (clean) {
    await cleanTestData();
  }

  switch (seed) {
    case 'full':
      await seedTestData();
      break;
    case 'minimal':
      await seedMinimalTestData();
      break;
    case 'none':
    default:
      break;
  }
}

/**
 * Teardown test database after tests
 */
export async function teardownTestDatabase(): Promise<void> {
  await cleanTestData();
}
