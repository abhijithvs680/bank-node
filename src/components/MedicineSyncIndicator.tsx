import { useEffect, useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SyncProgress {
  current: number;
  total: number;
  syncType: 'full' | 'incremental';
}

export const MedicineSyncIndicator = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncType, setSyncType] = useState<'full' | 'incremental'>('incremental');
  const [progress, setProgress] = useState<SyncProgress>({ current: 0, total: 0, syncType: 'incremental' });

  useEffect(() => {
    const handleSyncStart = (event: any) => {
      setIsSyncing(true);
      setSyncType(event.detail.syncType);
      setProgress({ current: 0, total: 0, syncType: event.detail.syncType });
    };

    const handleSyncProgress = (event: any) => {
      setProgress({
        current: event.detail.current,
        total: event.detail.total,
        syncType: event.detail.syncType
      });
    };

    const handleSyncComplete = () => {
      setIsSyncing(false);
      setProgress({ current: 0, total: 0, syncType: 'incremental' });
    };

    const handleSyncError = () => {
      setIsSyncing(false);
      setProgress({ current: 0, total: 0, syncType: 'incremental' });
    };

    document.addEventListener('patient-medicine-sync-start', handleSyncStart);
    document.addEventListener('patient-medicine-sync-progress', handleSyncProgress);
    document.addEventListener('patient-medicine-sync-complete', handleSyncComplete);
    document.addEventListener('patient-medicine-sync-error', handleSyncError);

    return () => {
      document.removeEventListener('patient-medicine-sync-start', handleSyncStart);
      document.removeEventListener('patient-medicine-sync-progress', handleSyncProgress);
      document.removeEventListener('patient-medicine-sync-complete', handleSyncComplete);
      document.removeEventListener('patient-medicine-sync-error', handleSyncError);
    };
  }, []);

  if (!isSyncing) return null;

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="fixed top-4 right-4 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4 min-w-[300px] animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        {syncType === 'full' ? (
          <Database className="h-5 w-5 text-primary animate-pulse" />
        ) : (
          <RefreshCw className="h-5 w-5 text-primary animate-spin" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {syncType === 'full' ? 'Syncing Medicine Database' : 'Checking for Updates'}
          </p>
          {progress.total > 0 && (
            <p className="text-xs text-muted-foreground">
              {progress.current.toLocaleString()} / {progress.total.toLocaleString()} records
            </p>
          )}
        </div>
      </div>
      
      {progress.total > 0 && (
        <div className="space-y-1">
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-right text-muted-foreground">
            {percentage.toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
};
