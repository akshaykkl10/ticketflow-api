import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { api } from '../helpers/test-app.js';
import {
  disconnectTestDatabase,
  resetTestDatabase
} from '../helpers/test-db.js';

async function login(email: string, password: string) {
  const response = await api.post('/api/auth/login').send({ email, password });
  return response.body.data.token as string;
}

describe('comment API', () => {
  let agentToken: string;
  let user1Token: string;
  let user2Token: string;
  let ticketId: string;

  beforeAll(async () => {
    await resetTestDatabase();

    agentToken = await login('agent@example.com', 'Agent123!');
    user1Token = await login('user1@example.com', 'User123!');
    user2Token = await login('user2@example.com', 'User234!');

    const creatTicket = await api
      .post('/api/tickets')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'this is a test title',
        description: 'this is a test description',
        priority: 'LOW'
      });

    ticketId = creatTicket.body.data.id as string;
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('creates a comment on a ticket created by user', async () => {
    const response = await api
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'test comment 1' });
    expect(response.status).toBe(201);
    expect(response.body.data.content).toBe('test comment 1');
  });

  it('creates a comment by an agent on any ticket', async () => {
    const response = await api
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ content: 'test comment 2' });
    expect(response.status).toBe(201);
    expect(response.body.data.content).toBe('test comment 2');
  });

  it('forbids a user to comment on ticket created by others', async () => {
    const response = await api
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ content: 'test comment 3' });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
  it('forbids to comment without authentication', async () => {
    const response = await api
      .post(`/api/tickets/${ticketId}/comments`)
      .send({ content: 'test comment 4' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
  it('paginates the comments', async () => {
    for (let i = 0; i < 2; i++) {
      await api
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ content: `test comment ${i + 3}` });
    }
    const response = await api
      .get(`/api/tickets/${ticketId}/comments?page=2&limit=2`)
      .set('Authorization', `Bearer ${agentToken}`);
    expect(response.status).toBe(200);
    console.log(response.body);
    expect(response.body.data[0].content).toBe('test comment 3');
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination.page).toBe(2);
    expect(response.body.pagination.limit).toBe(2);
  });
});
