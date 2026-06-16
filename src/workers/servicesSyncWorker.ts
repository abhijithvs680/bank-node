// Types for worker messages
interface WorkerMessage {
  type: 'START_FULL_SYNC' | 'CHECK_METADATA';
  payload?: {
    lastSync?: number;
    apiBase?: string;
    authToken?: string;
  };
}

interface WorkerResponse {
  type: 'FULL_SYNC_BATCH' | 'FULL_SYNC_COMPLETE' | 'INCREMENTAL_UPDATE' | 'SYNC_ERROR' | 'AUTH_ERROR';
  payload: any;
}

const LIMIT = 500;

// API endpoint for lab services
const API_ENDPOINT = 'hmsgetservicelist6969c5d3d716c';

/**
 * Fetch with authentication - similar to apiService.fetchWithAuth
 */
async function fetchWithAuth(
  url: string,
  authToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${authToken}`);

  const response = await fetch(url, {
    ...options,
    headers
  });

  // If 401, notify main thread to refresh token
  if (response.status === 401) {
    console.warn('[ServicesSyncWorker] Authentication failed (401)');
    self.postMessage({
      type: 'AUTH_ERROR',
      payload: { error: 'Token expired' }
    } as WorkerResponse);

    throw new Error('Authentication failed');
  }

  return response;
}

/**
 * Fetch all services for initial sync (when DB is empty)
 */
async function fetchAllServices(apiBase: string, authToken: string) {
  const normalizedBase = apiBase.replace(/\/$/, ''); // Remove trailing slash
  const API_URL = `${normalizedBase}/workflow.trigger/${API_ENDPOINT}`;

  try {
    console.log('[ServicesSyncWorker] Starting FULL SYNC - Fetching first batch...');

    const firstResponse = await fetchWithAuth(API_URL, authToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 0, limit: LIMIT })
    });

    if (!firstResponse.ok) {
      throw new Error(`API request failed: ${firstResponse.status}`);
    }

    const firstData = await firstResponse.json();
    const totalCount = parseInt(firstData[0].TotalCount, 10);
    const firstBatch = JSON.parse(firstData[0].Out);

    console.log(`[ServicesSyncWorker] Total records: ${totalCount}, First batch: ${firstBatch.length}`);

    // Send first batch to main thread
    self.postMessage({
      type: 'FULL_SYNC_BATCH',
      payload: {
        batch: firstBatch,
        current: firstBatch.length,
        total: totalCount
      }
    } as WorkerResponse);

    // Fetch remaining batches
    const totalRequests = Math.ceil(totalCount / LIMIT);

    for (let i = 1; i < totalRequests; i++) {
      const index = i * LIMIT;

      console.log(`[ServicesSyncWorker] Fetching batch ${i + 1}/${totalRequests} (index: ${index})`);

      const response = await fetchWithAuth(API_URL, authToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, limit: LIMIT })
      });

      if (!response.ok) {
        console.error(`[ServicesSyncWorker] Failed to fetch batch at index ${index}`);
        continue;
      }

      const data = await response.json();
      const batch = JSON.parse(data[0].Out);

      // Send batch to main thread
      self.postMessage({
        type: 'FULL_SYNC_BATCH',
        payload: {
          batch,
          current: Math.min((i + 1) * LIMIT, totalCount),
          total: totalCount
        }
      } as WorkerResponse);
    }

    // Send completion message
    self.postMessage({
      type: 'FULL_SYNC_COMPLETE',
      payload: { totalCount }
    } as WorkerResponse);

  } catch (error) {
    if (error instanceof Error && error.message !== 'Authentication failed') {
      console.error('[ServicesSyncWorker] Full sync error:', error);
      self.postMessage({
        type: 'SYNC_ERROR',
        payload: { error: error.message }
      } as WorkerResponse);
    }
  }
}

// Handle incremental sync via metadata API
async function checkMetadataAPI(lastSync: number, apiBase: string, authToken: string) {
  const normalizedBase = apiBase.replace(/\/$/, ''); // Remove trailing slash
  const API_URL = `${normalizedBase}/workflow.trigger/${API_ENDPOINT}`;

  try {
    console.log('[ServicesSyncWorker] Checking for updates since:', lastSync);

    // For incremental updates, we fetch all and let the main thread handle deduplication
    const response = await fetchWithAuth(API_URL, authToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 0, limit: LIMIT, lastSync: lastSync.toString() })
    });

    if (!response.ok) {
      throw new Error(`Metadata API failed: ${response.status}`);
    }

    const data = await response.json();

    // Extract updated records from response
    let updatedRecords: any[] = [];
    if (data[0]?.updated) {
      updatedRecords = data[0].updated;
    } else if (data[0]?.Out) {
      // If no specific 'updated' field, treat as full refresh needed
      updatedRecords = JSON.parse(data[0].Out);
    }

    console.log('[ServicesSyncWorker] Received records:', updatedRecords.length);

    // Send updated records back to main thread for processing
    self.postMessage({
      type: 'INCREMENTAL_UPDATE',
      payload: {
        records: updatedRecords,
        count: updatedRecords.length
      }
    } as WorkerResponse);

  } catch (error) {
    // Don't send error if it's an auth error (already sent AUTH_ERROR)
    if (error instanceof Error && error.message !== 'Authentication failed') {
      console.error('[ServicesSyncWorker] Metadata check error:', error);
      self.postMessage({
        type: 'SYNC_ERROR',
        payload: { error: error.message }
      } as WorkerResponse);
    }
  }
}

// Listen for messages from main thread
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  const apiBase = self.location?.origin || 'https://innov-dev.beta.injomo.com';
  const authToken = payload?.authToken;

  if (!authToken) {
    console.error('[ServicesSyncWorker] No auth token provided');
    self.postMessage({
      type: 'SYNC_ERROR',
      payload: { error: 'No authentication token' }
    } as WorkerResponse);
    return;
  }

  switch (type) {
    case 'START_FULL_SYNC':
      await fetchAllServices(apiBase, authToken);
      break;

    case 'CHECK_METADATA':
      await checkMetadataAPI(payload?.lastSync || 0, apiBase, authToken);
      break;

    default:
      console.warn('[ServicesSyncWorker] Unknown message type:', type);
  }
});

console.log('[ServicesSyncWorker] Services Sync Worker initialized');
