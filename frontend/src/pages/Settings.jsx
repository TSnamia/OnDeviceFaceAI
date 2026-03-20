import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRunnerConfig, updateRunnerConfig } from '../services/api'

export default function Settings() {
  const [maxJobs, setMaxJobs] = useState(1)
  const [pollInterval, setPollInterval] = useState(2)

  const { data } = useQuery({
    queryKey: ['runner-config-settings'],
    queryFn: getRunnerConfig,
    onSuccess: (cfg) => {
      setMaxJobs(cfg.max_jobs_per_run)
      setPollInterval(cfg.poll_interval_sec)
    },
  })

  const mutation = useMutation({
    mutationFn: () => updateRunnerConfig({ max_jobs_per_run: maxJobs, poll_interval_sec: pollInterval }),
  })

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Settings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Processing and runtime controls
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
          <p className="text-xs text-gray-500">
            Current: {data?.max_jobs_per_run ?? '-'} jobs/run, {data?.poll_interval_sec ?? '-'}s interval
          </p>
        </div>

        <div className="card p-5 space-y-2">
          <h3 className="text-lg font-semibold">Security</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Private Albums unlock is now server-side validated.
          </p>
          <p className="text-xs text-gray-500">
            To change the private albums password, set <code>PRIVATE_ALBUM_PASSWORD</code> in backend environment.
          </p>
        </div>
      </div>
    </div>
  )
}

