import express from 'express'
import cors from 'cors'
import path from 'path'
import uploadRoutes from './routes/upload.ts'
import webhookRoutes from './routes/webhooks.ts'
import eventsRoutes from './routes/events.ts'
import { authMiddleware } from './middleware/auth.ts'
import { errorHandler } from './middleware/error.ts'

const app = express()
const PORT = process.env.EXPRESS_PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Static files for uploads
app.use('/files', express.static(path.join(process.cwd(), 'uploads')))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'express', port: PORT })
})

// Routes
app.use('/upload', uploadRoutes)
app.use('/webhooks', webhookRoutes)
app.use('/events', eventsRoutes)

// Global error handler (must be last)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`)
})
