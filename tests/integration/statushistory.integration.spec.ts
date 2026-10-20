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

describe('status history API', () => {
  let adminToken: string;
  let agentToken: string;
  let user1Token: string;
  let user2Token: string;
  let ticketId: string;
  let agentId: string;

  beforeAll(async () => {
    await resetTestDatabase();

    adminToken = await login('admin@example.com', 'Admin123!');
    agentToken = await login('agent@example.com', 'Agent123!');
    user1Token = await login('user1@example.com', 'User123!');
    user2Token = await login('user2@example.com', 'User234!');

    const usersResponse = await api
      .get('/api/users?role=AGENT')
      .set('Authorization', `Bearer ${adminToken}`);

    const creatTicket = await api
      .post('/api/tickets')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'this is a test title',
        description: 'this is a test description',
        priority: 'LOW'
      });

    ticketId = creatTicket.body.data.id as string;
    agentId = usersResponse.body.data[0].id as string;

    await api
      .patch(`/api/tickets/${ticketId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedToId: agentId
      });
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('writes a statushistory on updating a status', async () => {
    const response = await api
      .patch(`/api/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: 'CLOSED' });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('CLOSED');
  });

  it('gives the status history of the updated ticket', async () => {
    const response = await api
      .get(`/api/tickets/${ticketId}/status-history`)
      .set('Authorization', `Bearer ${agentToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it('forbids users from accessing status history of tickets created by others', async () => {
    const response = await api
      .get(`/api/tickets/${ticketId}/status-history`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('forbids users from changing the status to the same before', async () => {
    const response = await api
      .patch(`/api/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: 'CLOSED' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('forbids to update status without authentication', async () => {
    const response = await api
      .patch(`/api/tickets/${ticketId}/status`)
      .send({ status: 'CLOSED' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
