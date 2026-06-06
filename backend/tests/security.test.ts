import { describe, expect, it } from 'vitest';
import { api, testPassword, uniqueEmail } from './helpers';

describe('Security middleware', () => {
  it('rejects unsafe API requests from untrusted browser origins', async () => {
    const response = await api
      .post('/api/auth/login')
      .set('Origin', 'https://attacker.example')
      .send({
        email: 'missing@example.com',
        password: 'wrong-password'
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Invalid request origin.');
  });

  it('allows unsafe API requests from the configured frontend origin', async () => {
    const response = await api
      .post('/api/auth/register')
      .set('Origin', 'http://localhost:4200')
      .send({
        username: 'Origin Checked Employee',
        email: uniqueEmail('origin-checked'),
        password: testPassword
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toContain('origin-checked');
  });
});
