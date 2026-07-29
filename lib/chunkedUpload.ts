import { api } from './api'

// ---------------------------------------------------------------------------
// Chunked Upload Utility
// ---------------------------------------------------------------------------
// Splits large files into ~2MB chunks and uploads them sequentially.
// Each chunk is uploaded as a separate POST request, staying well within
// PHP's default `post_max_size` (8MB) and `upload_max_filesize` (2MB).
// ---------------------------------------------------------------------------

const DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024 // 2MB per chunk

export interface ChunkedUploadProgress {
  phase: 'init' | 'uploading' | 'assembling' | 'extracting' | 'complete' | 'error'
  percent: number           // 0 – 100
  chunksSent: number
  totalChunks: number
  message: string
  uploadId?: string
}

export interface ChunkedUploadOptions {
  projectId: number | string
  file: File
  metadata?: {
    type?: 'image' | 'pdf' | 'pdf_page'
    pdf_url?: string
    pdf_name?: string
    page_number?: number
    name?: string
  }
  chunkSize?: number
  onProgress?: (progress: ChunkedUploadProgress) => void
  abortSignal?: AbortSignal
}

export interface ChunkedUploadResult {
  success: boolean
  url?: string
  item?: Record<string, unknown>
  error?: string
}

/**
 * Upload a file using chunked transfer.
 * Works for any file size — from 100KB to 100MB+.
 */
export async function chunkedUpload(options: ChunkedUploadOptions): Promise<ChunkedUploadResult> {
  const {
    projectId,
    file,
    metadata,
    chunkSize = DEFAULT_CHUNK_SIZE,
    onProgress,
    abortSignal,
  } = options

  const totalChunks = Math.ceil(file.size / chunkSize)

  const report = (partial: Partial<ChunkedUploadProgress>) => {
    if (onProgress) {
      onProgress({
        phase: 'uploading',
        percent: 0,
        chunksSent: 0,
        totalChunks,
        message: '',
        ...partial,
      })
    }
  }

  try {
    // ── Phase 1: Initialize session ──────────────────────────────────
    report({ phase: 'init', percent: 0, message: 'Initializing upload...' })

    const initRes = await api.post('/uploads/init', {
      filename: file.name,
      total_size: file.size,
      total_chunks: totalChunks,
      mime_type: file.type || 'application/pdf',
      project_id: projectId,
    }, { signal: abortSignal })

    const uploadId = initRes.data.upload_id
    if (!uploadId) throw new Error('Server did not return an upload_id.')

    report({
      phase: 'uploading',
      percent: 0,
      message: `Uploading ${totalChunks} chunks...`,
      uploadId,
    })

    // ── Phase 2: Upload chunks ───────────────────────────────────────
    for (let i = 0; i < totalChunks; i++) {
      if (abortSignal?.aborted) {
        // Cleanup on abort
        await api.delete(`/uploads/${uploadId}`).catch(() => {})
        return { success: false, error: 'Upload cancelled.' }
      }

      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append('chunk', chunk, `chunk_${i}`)
      formData.append('chunk_index', String(i))

      let retries = 0
      const maxRetries = 3

      while (retries < maxRetries) {
        try {
          await api.post(`/uploads/${uploadId}/chunk`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000, // 60s per chunk
            signal: abortSignal,
          })
          break // success
        } catch (err: any) {
          retries++
          if (retries >= maxRetries) throw err
          // Wait before retry (exponential backoff)
          await new Promise(r => setTimeout(r, 1000 * retries))
        }
      }

      const percent = Math.round(((i + 1) / totalChunks) * 90) // 0-90% for chunks
      report({
        phase: 'uploading',
        percent,
        chunksSent: i + 1,
        message: `Uploading chunk ${i + 1} of ${totalChunks} (${percent}%)`,
        uploadId,
      })
    }

    // ── Phase 3: Assemble on server ──────────────────────────────────
    report({
      phase: 'assembling',
      percent: 92,
      chunksSent: totalChunks,
      message: 'Assembling file on server...',
      uploadId,
    })

    const completePayload: Record<string, unknown> = {}
    if (metadata) {
      if (metadata.type) completePayload.type = metadata.type
      if (metadata.pdf_url) completePayload.pdf_url = metadata.pdf_url
      if (metadata.pdf_name) completePayload.pdf_name = metadata.pdf_name
      if (metadata.page_number) completePayload.page_number = metadata.page_number
      if (metadata.name) completePayload.name = metadata.name
    }

    const completeRes = await api.post(`/uploads/${uploadId}/complete`, completePayload, {
      timeout: 120000, // 2 min for merge
      signal: abortSignal,
    })

    if (!completeRes.data?.success) {
      throw new Error(completeRes.data?.message || 'Failed to assemble file.')
    }

    report({
      phase: 'complete',
      percent: 100,
      chunksSent: totalChunks,
      message: 'Upload complete!',
      uploadId,
    })

    return {
      success: true,
      url: completeRes.data.url,
      item: completeRes.data.item,
    }
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.message || 'Upload failed.'
    report({
      phase: 'error',
      percent: 0,
      chunksSent: 0,
      message,
    })
    return { success: false, error: message }
  }
}

/**
 * Determine whether a file should use chunked upload.
 * Files > 4MB use chunked to avoid PHP post_max_size issues.
 */
export function shouldUseChunkedUpload(file: File): boolean {
  return file.size > 4 * 1024 * 1024 // 4MB threshold
}
