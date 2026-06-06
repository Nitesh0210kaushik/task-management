import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '../src/constants/roles';
import { api, bearer, uniqueEmail, testPassword } from './helpers';

describe('Auth API', () => {
  it('registers public users as employees and authenticates with JWT', async () => {
    const registerResponse = await api.post('/api/auth/register').send({
      username: 'Public Employee',
      email: uniqueEmail('public-employee'),
      password: testPassword
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(registerResponse.body.data.user.role).toBe(USER_ROLES.EMPLOYEE);

    const profileResponse = await api
      .get('/api/auth/me')
      .set('Authorization', bearer(registerResponse.body.data.accessToken));

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.data.email).toBe(registerResponse.body.data.user.email);
  });

  it('blocks privileged role selection in public registration', async () => {
    const response = await api.post('/api/auth/register').send({
      username: 'Unsafe Manager',
      email: uniqueEmail('unsafe-manager'),
      password: testPassword,
      role: USER_ROLES.MANAGER
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed.');
  });

  it('rejects invalid login and protected requests without a token', async () => {
    const loginResponse = await api.post('/api/auth/login').send({
      email: 'missing@example.com',
      password: 'wrong-password'
    });

    expect(loginResponse.status).toBe(401);

    const protectedResponse = await api.get('/api/tasks');

    expect(protectedResponse.status).toBe(401);
  });
});
