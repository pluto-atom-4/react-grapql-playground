import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import eventsRouter from '../events';
import { eventBus } from '../../services/event-bus';

describe('Events Route - POST /events/emit', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/events', eventsRouter);
  });

  it('should emit event when valid POST received', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit').mockImplementation(() => true);

    const response = await request(app)
      .post('/events/emit')
      .send({
        event: 'buildCreated',
        payload: { buildId: '123', build: { id: '123', name: 'Test' } },
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, event: 'buildCreated' });
    expect(emitSpy).toHaveBeenCalledWith(
      'buildCreated',
      expect.objectContaining({ buildId: '123' })
    );

    emitSpy.mockRestore();
  });

  it('should return 400 when event field missing', async () => {
    const response = await request(app)
      .post('/events/emit')
      .send({
        payload: { buildId: '123' },
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('missing_event');
    expect(response.body.message).toContain('event');
  });

  it('should return 400 when payload field missing', async () => {
    const response = await request(app).post('/events/emit').send({
      event: 'buildCreated',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('missing_payload');
    expect(response.body.message).toContain('payload');
  });

  it('should return 400 when neither field present', async () => {
    const response = await request(app).post('/events/emit').send({});

    expect(response.status).toBe(400);
  });

  it('should handle all GraphQL event types', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit').mockImplementation(() => true);

    const eventTypes = ['buildCreated', 'buildStatusChanged', 'partAdded', 'testRunSubmitted'];

    for (const eventType of eventTypes) {
      const response = await request(app)
        .post('/events/emit')
        .send({
          event: eventType,
          payload: { data: 'test' },
        });

      expect(response.status).toBe(200);
      expect(response.body.event).toBe(eventType);
    }

    expect(emitSpy).toHaveBeenCalledTimes(4);
    emitSpy.mockRestore();
  });

  it('should accept arbitrary event names and payloads', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit').mockImplementation(() => true);

    const customPayload = {
      buildId: '123',
      status: 'COMPLETE',
      testResults: [{ passed: 10, failed: 0 }],
      metadata: { duration: 5000, environment: 'staging' },
    };

    const response = await request(app).post('/events/emit').send({
      event: 'customEventType',
      payload: customPayload,
    });

    expect(response.status).toBe(200);
    expect(emitSpy).toHaveBeenCalledWith('customEventType', customPayload);

    emitSpy.mockRestore();
  });

  it('should handle payload with null values', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit').mockImplementation(() => true);

    const response = await request(app)
      .post('/events/emit')
      .send({
        event: 'testEvent',
        payload: { buildId: null, optional: undefined },
      });

    expect(response.status).toBe(200);
    expect(emitSpy).toHaveBeenCalledWith('testEvent', expect.objectContaining({ buildId: null }));

    emitSpy.mockRestore();
  });

  it('should return JSON response for valid requests', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit').mockImplementation(() => true);

    const response = await request(app)
      .post('/events/emit')
      .send({
        event: 'buildStatusChanged',
        payload: { buildId: '456', status: 'RUNNING' },
      });

    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toHaveProperty('ok');
    expect(response.body).toHaveProperty('event');

    emitSpy.mockRestore();
  });
});
