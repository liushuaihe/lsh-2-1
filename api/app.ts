/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { decomposeMatrix, generateMatrix } from './controllers/matrixController.js'
import { calculateDelta, startFinetune } from './controllers/loraController.js'
import {
  listRecords,
  getRecord,
  saveRecord,
  removeRecord,
  clearRecords,
} from './controllers/recordController.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.post('/api/decompose', decomposeMatrix)
app.post('/api/generate', generateMatrix)

app.post('/api/calculate-delta', calculateDelta)
app.post('/api/finetune', startFinetune)

app.get('/api/records', listRecords)
app.get('/api/records/:id', getRecord)
app.post('/api/records', saveRecord)
app.delete('/api/records/:id', removeRecord)
app.delete('/api/records', clearRecords)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
