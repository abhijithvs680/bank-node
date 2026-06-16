import { useState, useEffect } from 'react';
import { RefreshCw, Check, AlertCircle, TestTube } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SyncProgress {
  current: number;
  total: number;
  syncType: 'full' | 'incremental';
}

export function ServicesSyncIndicator() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSyncStart = (event: CustomEvent<{ syncType: string }>) => {
      setSyncStatus('syncing');
      setError(null);
      setProgress({ current: 0, total: 0, syncType: event.detail.syncType as 'full' | 'incremental' });
    };

    const handleSyncProgress = (event: CustomEvent<SyncProgress>) => {
      setProgress(event.detail);
    };

    const handleSyncComplete = () => {
      setSyncStatus('complete');
      setProgress(null);
      // Reset to idle after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    };

    const handleSyncError = (event: CustomEvent<{ error: string }>) => {
      setSyncStatus('error');
      setError(event.detail.error);
      setProgress(null);
    };

    document.addEventListener('services-sync-start', handleSyncStart as EventListener);
    document.addEventListener('services-sync-progress', handleSyncProgress as EventListener);
    document.addEventListener('services-sync-complete', handleSyncComplete as EventListener);
    document.addEventListener('services-sync-error', handleSyncError as EventListener);

    return () => {
      document.removeEventListener('services-sync-start', handleSyncStart as EventListener);
      document.removeEventListener('services-sync-progress', handleSyncProgress as EventListener);
      document.removeEventListener('services-sync-complete', handleSyncComplete as EventListener);
      document.removeEventListener('services-sync-error', handleSyncError as EventListener);
    };
  }, []);

  if (syncStatus === 'idle') {
    return null;
  }

  const progressPercentage = progress && progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      {syncStatus === 'syncing' && (
        <>
          <RefreshCw className="h-3 w-3 animate-spin text-primary" />
          <span className="text-muted-foreground flex items-center gap-1">
            <TestTube className="h-3 w-3" />
            Syncing lab tests...
          </span>
          {progress && progress.total > 0 && (
            <div className="flex items-center gap-2">
              <Progress value={progressPercentage} className="w-16 h-1.5" />
              <span className="text-muted-foreground text-xs">
                {progress.current}/{progress.total}
              </span>
            </div>
          )}
        </>
      )}
      
      {syncStatus === 'complete' && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs py-0 h-5">
          <Check className="h-3 w-3 mr-1" />
          Lab tests synced
        </Badge>
      )}
      
      {syncStatus === 'error' && (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs py-0 h-5">
          <AlertCircle className="h-3 w-3 mr-1" />
          Sync failed
        </Badge>
      )}
    </div>
  );
}
