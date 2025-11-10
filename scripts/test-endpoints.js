const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing API endpoints for synced-only data...\n');
  
  try {
    // Test recent activity
    console.log('1. Testing recent activity endpoint...');
    const recentActivityResponse = await fetch(`${baseUrl}/api/dashboard/recent-activity`);
    if (recentActivityResponse.ok) {
      const recentActivity = await recentActivityResponse.json();
      console.log('✅ Recent Activity:', JSON.stringify(recentActivity, null, 2));
    } else {
      console.log('❌ Recent Activity failed:', recentActivityResponse.status);
    }
    
    // Test requests list
    console.log('\n2. Testing requests endpoint...');
    const requestsResponse = await fetch(`${baseUrl}/api/dashboard/requests?limit=5`);
    if (requestsResponse.ok) {
      const requests = await requestsResponse.json();
      console.log('✅ Requests:', JSON.stringify(requests, null, 2));
    } else {
      console.log('❌ Requests failed:', requestsResponse.status);
    }
    
    // Test submissions trend
    console.log('\n3. Testing submissions trend endpoint...');
    const trendResponse = await fetch(`${baseUrl}/api/dashboard/submissions-trend`);
    if (trendResponse.ok) {
      const trend = await trendResponse.json();
      console.log('✅ Submissions Trend:', JSON.stringify(trend, null, 2));
    } else {
      console.log('❌ Submissions Trend failed:', trendResponse.status);
    }
    
    // Test metrics
    console.log('\n4. Testing metrics endpoint...');
    const metricsResponse = await fetch(`${baseUrl}/api/dashboard/metrics`);
    if (metricsResponse.ok) {
      const metrics = await metricsResponse.json();
      console.log('✅ Metrics:', JSON.stringify(metrics, null, 2));
    } else {
      console.log('❌ Metrics failed:', metricsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testEndpoints();
