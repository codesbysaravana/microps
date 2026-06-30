const testPreflight = async () => {
  const BASE_URL = 'http://localhost:8000/api/v1';
  let token = '';

  console.log('--- 1. SIGNUP OR LOGIN TO GET JWT ---');
  const testEmail = `preflight_${Date.now()}@example.com`;
  
  // Create user
  const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Preflight Tester', email: testEmail, password: 'password123' })
  });
  
  // Login to get token
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'password123' })
  });
  
  const loginData = await loginRes.json();
  if (loginData.data?.token) {
    token = loginData.data.token;
    console.log('✅ Successfully authenticated and got JWT.');
  } else {
    console.log('❌ Failed to get JWT:', loginData);
    return;
  }

  console.log('\n--- 2. TESTING PREFLIGHT ANALYZE ROUTE ---');
  // We'll test a popular nodejs repo or a simple one, let's test a simple one
  const repoUrl = 'https://github.com/expressjs/express'; 
  console.log(`Analyzing repository: ${repoUrl}... (Should take ~1.8s)`);

  const preflightRes = await fetch(`${BASE_URL}/preflight/analyze`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ repoUrl })
  });

  console.log('\nStatus:', preflightRes.status);
  const data = await preflightRes.json();
  
  // Pretty print the JSON structure so the user sees exactly what the frontend receives
  console.dir(data, { depth: null, colors: true });

  if (data.success && data.data && data.data.radar && data.data.costOracle) {
    console.log('\n✅ PREFLIGHT SUCCESS! The JSON structure is perfectly formed for the frontend React cards.');
  } else {
    console.log('\n❌ PREFLIGHT FAILED or malformed structure.');
  }
};

testPreflight().catch(console.error);
