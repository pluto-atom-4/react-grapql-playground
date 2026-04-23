/**
 * Test user data provider
 */
export interface TestUserData {
  email: string;
  password: string;
  id: string;
  name: string;
}

/**
 * Get test user credentials
 */
export function getTestUser(): TestUserData {
  return {
    email: process.env.TEST_EMAIL || 'test@example.com',
    password: process.env.TEST_PASSWORD || 'TestPassword123!',
    id: `test-user-${Date.now()}`,
    name: 'Test User',
  };
}

/**
 * Generate unique test user
 */
export function generateTestUser(prefix = 'test'): TestUserData {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    email: `${prefix}+${timestamp}-${random}@example.com`,
    password: 'TestPassword123!',
    id: `${prefix}-${timestamp}-${random}`,
    name: `${prefix} ${timestamp}`,
  };
}

/**
 * Validate test user data
 */
export function isValidTestUser(user: Partial<TestUserData>): user is TestUserData {
  return !!(user.email && user.password && user.id);
}
