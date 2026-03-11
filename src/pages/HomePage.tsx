import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FlaskConical, MoreVertical, Trash2, Grid3X3, List } from 'lucide-react'
import { api } from '../api'
import type { Store } from '../types'

const STORE_ICONS = ['🧬', '🔬', '📊', '🧪', '📖', '🌿', '⚗️', '🧫', '💊', '🔭']

function getIconForStore(index: number) {
  return STORE_ICONS[index % STORE_ICONS.length]
}

export default function HomePage() {
  const navigate = useNavigate()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const fetchStores = async () => {
    try {
      const data = await api.getStores()
      setStores(data)
      setError('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load stores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStores()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await api.createStore(newName.trim())
      setNewName('')
      setShowCreateModal(false)
      await fetchStores()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create store')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (storeName: string) => {
    try {
      await api.deleteStore(storeName)
      setMenuOpen(null)
      await fetchStores()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete store')
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-xl font-semibold text-text-primary">AVIRA</h1>
            <p className="text-xs text-text-muted">AI Scientist</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create new
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <button className="px-3 py-1.5 text-sm bg-surface-lighter text-text-primary rounded-full">
            All
          </button>
          <button className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
            My workspaces
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-surface-lighter text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-surface-lighter text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="px-8 pb-8">
        <h2 className="text-lg font-medium text-text-primary mb-5">Recent workspaces</h2>

        {error && (
          <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Create new card */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="group flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border hover:border-accent/50 bg-surface-light/50 hover:bg-surface-lighter/50 transition-all"
            >
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-surface-lighter group-hover:bg-accent/20 transition-colors mb-3">
                <Plus className="w-7 h-7 text-text-muted group-hover:text-accent transition-colors" />
              </div>
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                Create new workspace
              </span>
            </button>

            {/* Store cards */}
            {stores.map((store, i) => (
              <div
                key={store.name}
                onClick={() => navigate(`/workspace/${encodeURIComponent(store.name)}`)}
                className="relative group flex flex-col h-48 rounded-xl bg-surface-light hover:bg-surface-lighter border border-border hover:border-accent/30 transition-all cursor-pointer p-5"
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{getIconForStore(i)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(menuOpen === store.name ? null : store.name)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-surface-hover transition-all"
                  >
                    <MoreVertical className="w-4 h-4 text-text-muted" />
                  </button>
                </div>

                {/* Dropdown menu */}
                {menuOpen === store.name && (
                  <div className="absolute right-4 top-12 z-10 bg-surface-lighter border border-border rounded-lg shadow-xl py-1 min-w-[140px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(store.name)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-surface-hover transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}

                <div className="mt-auto">
                  <h3 className="text-sm font-medium text-text-primary truncate">
                    {store.display_name}
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    {store.name.split('/').pop()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {stores.map((store, i) => (
              <div
                key={store.name}
                onClick={() => navigate(`/workspace/${encodeURIComponent(store.name)}`)}
                className="group flex items-center gap-4 p-4 rounded-xl bg-surface-light hover:bg-surface-lighter border border-border hover:border-accent/30 transition-all cursor-pointer"
              >
                <span className="text-2xl">{getIconForStore(i)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-primary truncate">
                    {store.display_name}
                  </h3>
                  <p className="text-xs text-text-muted">{store.name.split('/').pop()}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(store.name)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-danger transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-light border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Create new workspace</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Workspace name..."
              autoFocus
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => { setShowCreateModal(false); setNewName('') }}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="px-5 py-2 text-sm bg-accent hover:bg-accent-light disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
