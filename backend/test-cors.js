const testCors = async () => {
  const BASE_URL = 'http://localhost:8000/api/v1';

  console.log('Testing OPTIONS (CORS Preflight)');
  const optionsRes = await fetch(`${BASE_URL}/preflight/analyze`, {
    method: 'OPTIONS',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,authorization',
      'Origin': 'http://localhost:5173'
    }
  });

  console.log('OPTIONS Status:', optionsRes.status); // Should be 204
  console.log('OPTIONS Headers:', optionsRes.headers.get('access-control-allow-origin'));
};

testCors().catch(console.error);
