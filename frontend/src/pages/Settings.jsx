import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getProcessingHealth,
  getRunnerConfig,
  retryFailedJobs,
  skipBrokenJobs,
  startAutoRunner,
  stopAutoRunner,
  updatePrivateAlbumsPassword,
  updateRunnerConfig,
} from '../services/api'

export default function Settings() {
  const [maxJobs, setMaxJobs] = useState(1)
  const [pollInterval, setPollInterval] = useState(2)
  const [autoRefreshSec, setAutoRefreshSec] = useState(5)
  const [defaultQualityThreshold, setDefaultQualityThreshold] = useState(0.6)
  const [defaultExpressionConfidence, setDefaultExpressionConfidence] = useState(0.5)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const { data } = useQuery({
    queryKey: ['runner-config-settings'],
    queryFn: getRunnerConfig,
    onSuccess: (cfg) => {
      setMaxJobs(cfg.max_jobs_per_run)
      setPollInterval(cfg.poll_interval_sec)
    },
  })
  const { data: health } = useQuery({
    queryKey: ['processing-health-settings'],
    queryFn: getProcessingHealth,
    refetchInterval: 5000,
  })

  useEffect(() => {
    const storedAutoRefresh = localStorage.getItem('settings_auto_refresh_sec')
    const storedQuality = localStorage.getItem('settings_default_quality_threshold')
    const storedExpression = localStorage.getItem('settings_default_expression_confidence')
    if (storedAutoRefresh) setAutoRefreshSec(parseFloat(storedAutoRefresh))
    if (storedQuality) setDefaultQualityThreshold(parseFloat(storedQuality))
    if (storedExpression) setDefaultExpressionConfidence(parseFloat(storedExpression))
  }, [])

  const mutation = useMutation({
    mutationFn: () => updateRunnerConfig({ max_jobs_per_run: maxJobs, poll_interval_sec: pollInterval }),
  })
  const startAutoMutation = useMutation({ mutationFn: startAutoRunner })
  const stopAutoMutation = useMutation({ mutationFn: stopAutoRunner })
  const retryMutation = useMutation({ mutationFn: retryFailedJobs })
  const skipMutation = useMutation({ mutationFn: skipBrokenJobs })
  const passwordMutation = useMutation({
    mutationFn: () => updatePrivateAlbumsPassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setPasswordMessage('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
    },
    onError: (err) => {
      setPasswordMessage(err?.response?.data?.detail || 'Failed to update password')
    },
  })

  const saveLocalPreferences = () => {
    localStorage.setItem('settings_auto_refresh_sec', String(autoRefreshSec))
    localStorage.setItem('settings_default_quality_threshold', String(defaultQualityThreshold))
    localStorage.setItem('settings_default_expression_confidence', String(defaultExpressionConfidence))
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Settings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Processing controls, app preferences, and security options
          </p>
        </div>

        <div className="card p-5 space-y-3">
          <h3 className="text-lg font-semibold">Health Panel</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">Pending: <strong>{health?.pending ?? '-'}</strong></div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">Processing: <strong>{health?.processing ?? '-'}</strong></div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">Completed: <strong>{health?.completed ?? '-'}</strong></div>
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">Failed: <strong>{health?.failed ?? '-'}</strong></div>
            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">Skipped: <strong>{health?.skipped ?? '-'}</strong></div>
          </div>
          <p className="text-xs text-gray-500">
            Auto Runner: {health?.auto_runner_active ? 'Active' : 'Inactive'} · Load (1m): {health?.load_avg_1m?.toFixed?.(2) ?? '-'}
          </p>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-lg font-semibold">Batch Control</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Max Jobs Per Run</label>
              <input
                type="number"
                min={1}
                max={8}
                className="input w-full"
                value={maxJobs}
                onChange={(e) => setMaxJobs(parseInt(e.target.value || '1', 10))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Auto Runner Poll Interval (sec)</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                className="input w-full"
                value={pollInterval}
                onChange={(e) => setPollInterval(parseFloat(e.target.value || '2'))}
              />
            </div>
          </div>
          <button onClick={() => mutation.mutate()} className="btn btn-primary">
            {mutation.isPending ? 'Saving...' : 'Save'}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => startAutoMutation.mutate()} className="btn btn-secondary">
              {startAutoMutation.isPending ? 'Starting...' : 'Start Auto Runner'}
            </button>
            <button onClick={() => stopAutoMutation.mutate()} className="btn btn-ghost">
              {stopAutoMutation.isPending ? 'Stopping...' : 'Stop Auto Runner'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Current: {data?.max_jobs_per_run ?? '-'} jobs/run, {data?.poll_interval_sec ?? '-'}s interval
          </p>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-lg font-semibold">Queue Maintenance</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => retryMutation.mutate()} className="btn btn-secondary">
              {retryMutation.isPending ? 'Retrying...' : 'Retry Failed'}
            </button>
            <button onClick={() => skipMutation.mutate()} className="btn btn-ghost">
              {skipMutation.isPending ? 'Skipping...' : 'Skip Broken'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Use these actions when failed jobs block processing flow.
          </p>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-lg font-semibold">UI Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Auto Refresh (sec)</label>
              <input
                type="number"
                min={1}
                step={1}
                className="input w-full"
                value={autoRefreshSec}
                onChange={(e) => setAutoRefreshSec(parseFloat(e.target.value || '5'))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Default Quality Threshold</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                className="input w-full"
                value={defaultQualityThreshold}
                onChange={(e) => setDefaultQualityThreshold(parseFloat(e.target.value || '0.6'))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Default Expression Confidence</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                className="input w-full"
                value={defaultExpressionConfidence}
                onChange={(e) => setDefaultExpressionConfidence(parseFloat(e.target.value || '0.5'))}
              />
            </div>
          </div>
          <button onClick={saveLocalPreferences} className="btn btn-primary">
            Save Local Preferences
          </button>
        </div>

        <div className="card p-5 space-y-2">
          <h3 className="text-lg font-semibold">Security</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Private Albums unlock is server-side validated.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current private album password"
              className="input"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 4 chars)"
              className="input"
            />
          </div>
          <button
            onClick={() => {
              setPasswordMessage('')
              passwordMutation.mutate()
            }}
            disabled={!currentPassword || !newPassword}
            className="btn btn-primary disabled:opacity-50"
          >
            {passwordMutation.isPending ? 'Updating...' : 'Update Private Albums Password'}
          </button>
          {passwordMessage && <p className="text-sm text-gray-600 dark:text-gray-400">{passwordMessage}</p>}
        </div>
      </div>
    </div>
  )
}

