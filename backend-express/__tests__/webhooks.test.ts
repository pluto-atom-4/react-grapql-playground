/**
 * Webhooks Route Tests
 */

import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import webhooksRouter from '../src/routes/webhooks';
import { errorHandler } from '../src/middleware/error';

const app = express();
app.use(express.json());
app.use('/webhooks', webhooksRouter);
app.use(errorHandler);

describe('Webhooks Routes', () => {
  describe('POST /webhooks/ci-results', () => {
    it('should receive CI results and emit event', async () => {
      const res = await request(app).post('/webhooks/ci-results').send({
        buildId: 'build-123',
        status: 'PASSED',
        testsPassed: 45,
        testsFailed: 0,
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('received');
      expect(res.body.eventType).toBe('ciResultsReceived');
      expect(res.body.buildId).toBe('build-123');
    });

    it('should return 400 if buildId is missing', async () => {
      const res = await request(app).post('/webhooks/ci-results').send({
        status: 'PASSED',
        testsPassed: 45,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.message).toContain('buildId');
    });

    it('should return 400 if status is missing', async () => {
      const res = await request(app).post('/webhooks/ci-results').send({
        buildId: 'build-123',
        testsPassed: 45,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.message).toContain('status');
    });

    it('should handle CI results with failed tests', async () => {
      const res = await request(app).post('/webhooks/ci-results').send({
        buildId: 'build-456',
        status: 'FAILED',
        testsPassed: 40,
        testsFailed: 5,
      });

      expect(res.status).toBe(200);
      expect(res.body.buildId).toBe('build-456');
    });

    it('should default testsPassed/testsFailed to 0 if not provided', async () => {
      const res = await request(app).post('/webhooks/ci-results').send({
        buildId: 'build-789',
        status: 'PASSED',
      });

      expect(res.status).toBe(200);
      expect(res.body.buildId).toBe('build-789');
    });
  });

  describe('POST /webhooks/sensor-data', () => {
    it('should receive sensor data and emit event', async () => {
      const res = await request(app).post('/webhooks/sensor-data').send({
        buildId: 'build-123',
        sensorType: 'temperature',
        value: 98.6,
        unit: 'Celsius',
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('received');
      expect(res.body.eventType).toBe('sensorDataReceived');
      expect(res.body.buildId).toBe('build-123');
      expect(res.body.sensorType).toBe('temperature');
    });

    it('should return 400 if buildId is missing', async () => {
      const res = await request(app).post('/webhooks/sensor-data').send({
        sensorType: 'temperature',
        value: 98.6,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('buildId');
    });

    it('should return 400 if sensorType is missing', async () => {
      const res = await request(app).post('/webhooks/sensor-data').send({
        buildId: 'build-123',
        value: 98.6,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('sensorType');
    });

    it('should return 400 if value is missing', async () => {
      const res = await request(app).post('/webhooks/sensor-data').send({
        buildId: 'build-123',
        sensorType: 'temperature',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('value');
    });

    it('should handle string values for sensor data', async () => {
      const res = await request(app).post('/webhooks/sensor-data').send({
        buildId: 'build-456',
        sensorType: 'status',
        value: 'RUNNING',
      });

      expect(res.status).toBe(200);
      expect(res.body.buildId).toBe('build-456');
    });

    it('should handle numeric values for sensor data', async () => {
      const res = await request(app).post('/webhooks/sensor-data').send({
        buildId: 'build-789',
        sensorType: 'pressure',
        value: 1013.25,
      });

      expect(res.status).toBe(200);
      expect(res.body.sensorType).toBe('pressure');
    });
  });

  describe('POST /webhooks/test', () => {
    it('should echo webhook payload', async () => {
      const payload = { test: 'data', value: 123 };

      const res = await request(app).post('/webhooks/test').send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.received).toEqual(payload);
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
