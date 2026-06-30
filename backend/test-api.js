const testRoutes = async () => {
  const BASE_URL = 'http://localhost:8000/api/v1';
  let token = '';

  console.log('--- TESTING HEALTH ROUTE ---');
  const healthRes = await fetch(`${BASE_URL}/health`);
  console.log('Status:', healthRes.status, await healthRes.json());
  console.log();

  console.log('--- TESTING SIGNUP (VALIDATION FAIL) ---');
  const failSignupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'T', email: 'not-an-email', password: '123' })
  });
  console.log('Status:', failSignupRes.status, await failSignupRes.json());
  console.log();

  console.log('--- TESTING SIGNUP (SUCCESS) ---');
  const testEmail = `test_${Date.now()}@example.com`;
  const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: testEmail, password: 'password123' })
  });
  console.log('Status:', signupRes.status, await signupRes.json());
  console.log();

  console.log('--- TESTING LOGIN (SUCCESS) ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('Status:', loginRes.status, loginData);
  if (loginData.data?.token) token = loginData.data.token;
  console.log();

  console.log('--- TESTING PROTECTED /ME ROUTE (SUCCESS) ---');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Status:', meRes.status, await meRes.json());
  console.log();

  console.log('--- TESTING PROTECTED /ME ROUTE (FAIL - NO TOKEN) ---');
  const meFailRes = await fetch(`${BASE_URL}/auth/me`);
  console.log('Status:', meFailRes.status, await meFailRes.json());
};

testRoutes().catch(console.error);
