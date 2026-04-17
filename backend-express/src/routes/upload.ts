/**
 * File Upload Route
 *
 * POST /upload - Upload a file and emit event
 *
 * Multipart form data:
 * - file: Binary file
 * - buildId (optional): Associated build ID
 *
 * Response:
 * { fileId: string, url: string }
 */

import { Router, type Router as ExpressRouter } from 'express'
import multer, { Multer } from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { eventBus } from '../services/event-bus'
import { asyncHandler, AppError } from '../middleware/error'

const router: ExpressRouter = Router()

// Configure Multer
const uploadDir = path.join(process.cwd(), 'uploads')
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const fileId = uuidv4()
    const ext = path.extname(file.originalname)
    cb(null, `${fileId}${ext}`)
  },
})

const upload: Multer = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept any file type for flexibility
    if (file) {
      cb(null, true)
    } else {
      cb(new AppError(400, 'No file provided'))
    }
  },
})

/**
 * POST /upload - Upload file and emit event
 */
router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError(400, 'File is required')
    }

    const fileId = path.parse(req.file.filename).name
    const buildId = req.body.buildId as string | undefined

    // Emit event for real-time subscribers
    eventBus.emitFileUploaded({
      fileId,
      buildId,
      fileName: req.file.originalname,
    })

    res.json({
      fileId,
      fileName: req.file.originalname,
      size: req.file.size,
      url: `/files/${req.file.filename}`,
    })
  })
)

/**
 * GET /files/:fileId - Serve uploaded file
 */
router.get('/:fileId', (req, res) => {
  const filePath = path.join(uploadDir, req.params.fileId)

  // Simple file serving (production: use CDN or static middleware)
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'File not found' })
    }
  })
})

export default router
