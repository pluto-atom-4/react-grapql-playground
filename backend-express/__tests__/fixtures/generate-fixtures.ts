/**
 * Dynamic Fixture Generator
 *
 * Generates test fixture files on-demand to keep repository clean.
 * Avoids storing large binary files in version control.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FIXTURES_DIR = __dirname

/**
 * Generate a binary file with random data for testing.
 * Uses streaming to avoid loading entire file in memory.
 *
 * @param filename - Name of the file to create
 * @param sizeInMB - Size of the file in megabytes
 * @returns Promise resolving to the file path
 */
export async function generateBinaryFile(
  filename: string,
  sizeInMB: number
): Promise<string> {
  const filePath = path.join(FIXTURES_DIR, filename)
  const sizeInBytes = sizeInMB * 1024 * 1024

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath)
    let written = 0
    const chunkSize = 1024 * 1024 // 1MB chunks

    writeStream.on('error', reject)
    writeStream.on('finish', () => resolve(filePath))

    const writeChunk = () => {
      while (written < sizeInBytes) {
        const remainingBytes = sizeInBytes - written
        const currentChunkSize = Math.min(chunkSize, remainingBytes)

        // Generate random data
        const chunk = Buffer.alloc(currentChunkSize)
        for (let i = 0; i < currentChunkSize; i++) {
          chunk[i] = Math.floor(Math.random() * 256)
        }

        written += currentChunkSize
        const canContinue = writeStream.write(chunk)

        if (!canContinue) {
          writeStream.once('drain', writeChunk)
          return
        }
      }

      writeStream.end()
    }

    writeChunk()
  })
}

/**
 * Clean up generated fixture files.
 * Silently ignores files that don't exist (idempotent).
 *
 * @param filenames - Array of filenames to remove
 */
export async function cleanupFixtures(filenames: string[]): Promise<void> {
  const promises = filenames.map(
    (filename) =>
      new Promise<void>((resolve) => {
        const filePath = path.join(FIXTURES_DIR, filename)

        fs.unlink(filePath, (err) => {
          // Ignore ENOENT (file not found) errors
          if (err && err.code !== 'ENOENT') {
            console.warn(`Warning: Failed to clean up ${filePath}:`, err.message)
          }
          resolve()
        })
      })
  )

  await Promise.all(promises)
}

/**
 * Get the full path to a fixture file.
 * Does not check if the file exists.
 *
 * @param filename - Name of the fixture file
 * @returns Full path to the fixture file
 */
export function getFixturePath(filename: string): string {
  return path.join(FIXTURES_DIR, filename)
}

/**
 * Check if a fixture file exists.
 *
 * @param filename - Name of the fixture file
 * @returns true if file exists, false otherwise
 */
export function fixtureExists(filename: string): boolean {
  return fs.existsSync(getFixturePath(filename))
}

/**
 * Get the size of a fixture file in bytes.
 * Returns 0 if file doesn't exist.
 *
 * @param filename - Name of the fixture file
 * @returns Size in bytes
 */
export function getFixtureSize(filename: string): number {
  try {
    const stats = fs.statSync(getFixturePath(filename))
    return stats.size
  } catch {
    return 0
  }
}
