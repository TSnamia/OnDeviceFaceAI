import { useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, Play, RotateCcw, AlertTriangle } from 'lucide-react'
import { listProcessingJobs, processNow } from '../services/api'

function formatPercent(p) {
  if (typeof p !== 'number') return '0%'
  return `${Math.round(p)}%`
}

export default function Processing() {
  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['processing-jobs'],
    queryFn: listProcessingJobs,
    refetchInterval: 5000,
  })

  const stats = useMemo(() => {
    const out = { pending: 0, processing: 0, completed: 0, failed: 0 }
    for (const j of jobs || []) {
      if (j.status in out) out[j.status] += 1
      else out[j.status] = (out[j.status] || 0) + 1
    }
    return out
  }, [jobs])

  const mutation = useMutation({
    mutationFn: processNow,
    onSuccess: () => {
      refetch()
    },
  })

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Processing Queue</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Pending: {stats.pending} · Processing: {stats.processing} · Failed: {stats.failed}
          </p>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{mutation.isPending ? 'Starting...' : 'Process Now'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (jobs || []).length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No processing jobs</p>
            <p className="text-sm mt-1">Import photos to generate jobs</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((j) => (
              <div
                key={j.id}
                className="card p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    {j.status === 'failed' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    <p className="font-medium truncate">{j.job_type}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-lg ${
                        j.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : j.status === 'processing'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : j.status === 'failed'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {j.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Photo ID: {j.photo_id ?? '-'} · Progress: {formatPercent(j.progress)}
                  </p>
                  {j.error_message && j.status === 'failed' && (
                    <p className="text-sm text-red-600 mt-2 break-words">{j.error_message}</p>
                  )}
                </div>

                <div className="text-right">
                  {j.completed_at && <p className="text-xs text-gray-500">Done: {new Date(j.completed_at).toLocaleString()}</p>}
                  {j.started_at && !j.completed_at && <p className="text-xs text-gray-500">Started: {new Date(j.started_at).toLocaleString()}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

