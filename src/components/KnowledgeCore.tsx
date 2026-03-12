import { useEffect, useState, useCallback } from 'react'
import { Upload, FileText, MoreVertical, RefreshCw } from 'lucide-react'
import { api } from '../api'
import type { Document } from '../types'

interface Props {
  storeName: string
  onDocCountChange: (count: number) => void
  onRefresh: (fn: () => void) => void
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  png: '🖼️',
  jpg: '🖼️',
  jpeg: '🖼️',
  default: '📎',
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return FILE_ICONS[ext] || FILE_ICONS.default
}

export default function KnowledgeCore({ storeName, onDocCountChange, onRefresh }: Props) {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [enrich, setEnrich] = useState(true)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const fetchDocs = useCallback(async () => {
    try {
      const data = await api.getDocuments(storeName)
      setDocs(data)
      onDocCountChange(data.length)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [storeName, onDocCountChange])

  useEffect(() => {
    fetchDocs()
    onRefresh(fetchDocs)
  }, [fetchDocs, onRefresh])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadError('')
    setUploadStatus('Getting upload URL...')
    try {
      // Step 1: Get signed URL from backend
      const { upload_url, gcs_path } = await api.getUploadUrl(file.name)

      // Step 2: Upload directly to GCS (bypasses Cloud Run size limit)
      setUploadStatus('Uploading to cloud...')
      await api.uploadToGcs(upload_url, file)

      // Step 3: Tell backend to process the file
      setUploadStatus(enrich ? 'Enriching PDF (this may take a few minutes)...' : 'Processing...')
      await api.processDocument({
        gcs_path,
        store_name: storeName,
        filename: file.name,
        enrich,
      })

      await fetchDocs()
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadStatus('')
    }
  }

  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleUpload(file)
    }
    input.click()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-base font-semibold text-text-primary">Knowledge Core</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchDocs}
            className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text-primary transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMenuOpen(menuOpen === '_settings' ? null : '_settings')}
            className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text-primary transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings dropdown */}
      {menuOpen === '_settings' && (
        <div className="mx-4 mb-3 p-3 bg-surface-lighter border border-border rounded-lg">
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={enrich}
              onChange={(e) => setEnrich(e.target.checked)}
              className="accent-accent"
            />
            Enrich PDFs (describe images/tables with AI)
          </label>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No documents yet</p>
            <p className="text-xs text-text-muted mt-1">Upload a PDF to get started</p>
          </div>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.name}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-lighter transition-colors"
            >
              <span className="text-lg shrink-0">{getFileIcon(doc.display_name)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{doc.display_name}</p>
                <p className="text-xs text-success">Active</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload area */}
      <div className="p-4 border-t border-border">
        {uploadError && (
          <div className="mb-3 px-3 py-2 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs">
            {uploadError}
          </div>
        )}
        <button
          onClick={handleFileSelect}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border hover:border-accent/50 bg-surface-light hover:bg-surface-lighter text-text-secondary hover:text-text-primary transition-all text-sm disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              {uploadStatus || 'Uploading...'}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload PDF
            </>
          )}
        </button>
      </div>
    </div>
  )
}
