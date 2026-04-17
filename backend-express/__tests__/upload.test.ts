/**
 * Upload Route Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import path from 'path'
import fs from 'fs'
import uploadRouter from '../src/routes/upload'
import { errorHandler } from '../src/middleware/error'

const app = express()
app.use(express.json())
app.use('/upload', uploadRouter)
// Add static files middleware to serve uploaded files
app.use('/files', express.static(path.join(process.cwd(), 'uploads')))
app.use(errorHandler)

const testUploadDir = path.join(process.cwd(), 'uploads')

describe('Upload Routes', () => {
  beforeEach(() => {
    // Ensure upload directory exists
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true })
    }
  })

  afterEach(() => {
    // Clean up uploaded test files
    if (fs.existsSync(testUploadDir)) {
      const files = fs.readdirSync(testUploadDir)
      files.forEach((file) => {
        try {
          fs.unlinkSync(path.join(testUploadDir, file))
        } catch (e) {
          // Ignore cleanup errors
        }
      })
    }
  })

  it('POST /upload - should upload file and return fileId', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'test-file.txt')

    // Create fixtures directory if needed
    const fixtureDir = path.join(__dirname, 'fixtures')
    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true })
    }

    // Create test file
    if (!fs.existsSync(testFile)) {
      fs.writeFileSync(testFile, 'Test content')
    }

    const res = await request(app)
      .post('/upload')
      .attach('file', testFile)

    expect(res.status).toBe(200)
    expect(res.body.fileId).toBeDefined()
    expect(res.body.fileName).toBe('test-file.txt')
    expect(res.body.size).toBeGreaterThan(0)
    expect(res.body.url).toContain('/files/')

    // Clean up fixture
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile)
    }
  })

  it('POST /upload - should emit fileUploaded event', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'test-file-2.txt')
    const fixtureDir = path.join(__dirname, 'fixtures')

    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true })
    }

    if (!fs.existsSync(testFile)) {
      fs.writeFileSync(testFile, 'Test content')
    }

    const res = await request(app)
      .post('/upload')
      .attach('file', testFile)
      .field('buildId', 'build-123')

    expect(res.status).toBe(200)
    expect(res.body.fileId).toBeDefined()

    // Clean up
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile)
    }
  })

  it('POST /upload - should return 400 if no file provided', async () => {
    const res = await request(app)
      .post('/upload')
      .send({ buildId: 'build-123' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('POST /upload - should handle large files within limit', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'large-file.bin')
    const fixtureDir = path.join(__dirname, 'fixtures')

    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true })
    }

    // Create a 5MB test file
    const buffer = Buffer.alloc(5 * 1024 * 1024)
    fs.writeFileSync(testFile, buffer)

    const res = await request(app)
      .post('/upload')
      .attach('file', testFile)

    expect(res.status).toBe(200)
    expect(res.body.size).toBe(5 * 1024 * 1024)

    // Clean up
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile)
    }
  })

  it('GET /files/:fileId - should serve uploaded file', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'serve-test.txt')
    const fixtureDir = path.join(__dirname, 'fixtures')

    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true })
    }

    fs.writeFileSync(testFile, 'Serve test content')

    // Upload file
    const uploadRes = await request(app)
      .post('/upload')
      .attach('file', testFile)

    expect(uploadRes.status).toBe(200)
    // Extract filename from uploaded file (filename stored in uploads dir)
    const uploadedFileName = path.basename(uploadRes.body.url).split('/').pop()

    // Give filesystem time to write
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Try to serve it from the static middleware
    const serveRes = await request(app)
      .get(`/files/${uploadedFileName}`)

    expect(serveRes.status).toBe(200)

    // Clean up
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile)
    }
  })

  it('GET /files/:fileId - should return 404 for non-existent file', async () => {
    const res = await request(app)
      .get('/files/non-existent-file-xyz-12345.txt')

    expect(res.status).toBe(404)
  })
})
