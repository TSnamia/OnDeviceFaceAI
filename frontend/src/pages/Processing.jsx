import { useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2, Play, RotateCcw, AlertTriangle, Bot, Square, RefreshCcw, SkipForward, Activity } from 'lucide-react'
import {
  getProcessingHealth,
  getProcessingJob,
  getRunnerConfig,
  listProcessingJobs,
  processNow,
  retryFailedJobs,
  skipBrokenJobs,
  startAutoRunner,
  stopAutoRunner,
  updateRunnerConfig,
} from '../services/api'

function formatPercent(p) {
  if (typeof p !== 'number') return '0%'
  return `${Math.round(p)}%`
}

export default function Processing() {
  const { t } = useTranslation()
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [batchSizeInput, setBatchSizeInput] = useState(1)
  const [pollIntervalInput, setPollIntervalInput] = useState(2)

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['processing-jobs'],
    queryFn: listProcessingJobs,
    refetchInterval: 5000,
  })
  const { data: health } = useQuery({
    queryKey: ['processing-health'],
    queryFn: getProcessingHealth,
    refetchInterval: 5000,
  })
  const { data: runnerConfig } = useQuery({
    queryKey: ['runner-config'],
    queryFn: getRunnerConfig,
    onSuccess: (cfg) => {
      setBatchSizeInput(cfg.max_jobs_per_run)
      setPollIntervalInput(cfg.poll_interval_sec)
    },
  })
  const { data: selectedJob, refetch: refetchJob } = useQuery({
    queryKey: ['processing-job', selectedJobId],
    queryFn: () => getProcessingJob(selectedJobId),
    enabled: !!selectedJobId,
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
  const startAutoMutation = useMutation({
    mutationFn: startAutoRunner,
    onSuccess: () => refetch(),
  })
  const stopAutoMutation = useMutation({
    mutationFn: stopAutoRunner,
    onSuccess: () => refetch(),
  })
  const retryMutation = useMutation({
    mutationFn: retryFailedJobs,
    onSuccess: () => refetch(),
  })
  const skipMutation = useMutation({
    mutationFn: skipBrokenJobs,
    onSuccess: () => refetch(),
  })
  const configMutation = useMutation({
    mutationFn: updateRunnerConfig,
    onSuccess: () => refetch(),
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{mutation.isPending ? 'Starting...' : 'Process Now'}</span>
          </button>
          <button
            onClick={() => (health?.auto_runner_active ? stopAutoMutation.mutate() : startAutoMutation.mutate())}
            className="btn btn-secondary flex items-center space-x-2"
          >
            {health?.auto_runner_active ? <Square className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            <span>{health?.auto_runner_active ? 'Stop Auto' : 'Auto Runner'}</span>
          </button>
          <button onClick={() => retryMutation.mutate()} className="btn btn-ghost flex items-center space-x-1">
            <RefreshCcw className="w-4 h-4" />
            <span>Retry Failed</span>
          </button>
          <button onClick={() => skipMutation.mutate()} className="btn btn-ghost flex items-center space-x-1">
            <SkipForward className="w-4 h-4" />
            <span>Skip Broken</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
          <div className="card p-3">
            <p className="text-xs text-gray-500">Health</p>
            <p className="font-semibold flex items-center gap-2 mt-1">
              <Activity className="w-4 h-4" />
              {health?.auto_runner_active ? 'Auto Runner Active' : 'Idle'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Load (1m): {health?.load_avg_1m?.toFixed?.(2) ?? '-'}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-gray-500 mb-1">Batch Control</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={8}
                value={batchSizeInput}
                onChange={(e) => setBatchSizeInput(parseInt(e.target.value || '1', 10))}
                className="input w-20"
              />
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={pollIntervalInput}
                onChange={(e) => setPollIntervalInput(parseFloat(e.target.value || '2'))}
                className="input w-24"
              />
              <button
                onClick={() => configMutation.mutate({ max_jobs_per_run: batchSizeInput, poll_interval_sec: pollIntervalInput })}
                className="btn btn-ghost text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (jobs || []).length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No processing jobs</p>
            <p className="text-sm mt-1">{t('navigation.import')} {t('common.search')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((j) => (
              <div
                key={j.id}
                className="card p-4 flex items-start justify-between gap-4 cursor-pointer hover:shadow-md"
                onClick={() => {
                  setSelectedJobId(j.id)
                  setTimeout(() => refetchJob(), 0)
                }}
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

      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedJobId(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Job Detail #{selectedJob.id}</h3>
            <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <p>Status: <span className="font-medium">{selectedJob.status}</span></p>
              <p>Job Type: {selectedJob.job_type}</p>
              <p>Photo ID: {selectedJob.photo_id ?? '-'}</p>
              <p>Progress: {formatPercent(selectedJob.progress)}</p>
              <p>Elapsed: {selectedJob.elapsed_seconds ? `${Math.round(selectedJob.elapsed_seconds)}s` : '-'}</p>
              <p>Created: {selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleString() : '-'}</p>
              <p>Started: {selectedJob.started_at ? new Date(selectedJob.started_at).toLocaleString() : '-'}</p>
              <p>Completed: {selectedJob.completed_at ? new Date(selectedJob.completed_at).toLocaleString() : '-'}</p>
              {selectedJob.error_message && <p className="text-red-600">Error: {selectedJob.error_message}</p>}
            </div>
            <div className="mt-4 text-right">
              <button className="btn btn-ghost" onClick={() => setSelectedJobId(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

