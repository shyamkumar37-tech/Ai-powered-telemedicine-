export async function registerTestUser(requestContext, role = 'PATIENT') {
  const timestamp = Date.now();
  const email = `${role.toLowerCase()}-${timestamp}@example.com`;
  const password = 'Password123!';
  
  const response = await requestContext.post('/api/auth/register', {
    data: {
      email,
      password,
      fullName: `Test ${role} ${timestamp}`,
      role,
      phone: `+1555${timestamp.toString().slice(-7)}`
    }
  });
  
  if (!response.ok()) {
    throw new Error('Failed to register test user: ' + await response.text());
  }
  
  return { email, password };
}
