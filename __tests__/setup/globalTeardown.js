// Global teardown for Jest tests
// This runs once after all tests

module.exports = async () => {
  // Clean up any global resources
  // Close database connections, stop servers, etc.
  
  console.log('🧹 Global test teardown complete')
}
