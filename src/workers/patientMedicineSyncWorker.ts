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

// NEW API endpoint for patient medications
const API_ENDPOINT = 'hmsgetmedicinelist694e40ac7ec88';

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
    console.warn('[PatientMedicineWorker] Authentication failed (401)');
    self.postMessage({
      type: 'AUTH_ERROR',
      payload: { error: 'Token expired' }
    } as WorkerResponse);

    throw new Error('Authentication failed');
  }

  return response;
}

/**
 * Fetch all medicines for initial sync (when DB is empty)
 */
async function fetchAllMedicines(apiBase: string, authToken: string) {
  const normalizedBase = apiBase.replace(/\/$/, ''); // Remove trailing slash
  const API_URL = `${normalizedBase}/workflow.trigger/${API_ENDPOINT}`;

  try {
    console.log('[PatientMedicineWorker] Starting FULL SYNC - Fetching first batch...');

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

    console.log(`[PatientMedicineWorker] Total records: ${totalCount}, First batch: ${firstBatch.length}`);

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

      console.log(`[PatientMedicineWorker] Fetching batch ${i + 1}/${totalRequests} (index: ${index})`);

      const response = await fetchWithAuth(API_URL, authToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, limit: LIMIT })
      });

      if (!response.ok) {
        console.error(`[PatientMedicineWorker] Failed to fetch batch at index ${index}`);
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
      console.error('[PatientMedicineWorker] Full sync error:', error);
      self.postMessage({
        type: 'SYNC_ERROR',
        payload: { error: error.message }
      } as WorkerResponse);
    }
  }
}

// Handle incremental sync via metadata API (using same endpoint with lastSync param)
async function checkMetadataAPI(lastSync: number, apiBase: string, authToken: string) {
  const normalizedBase = apiBase.replace(/\/$/, ''); // Remove trailing slash
  const API_URL = `${normalizedBase}/workflow.trigger/${API_ENDPOINT}`;

  try {
    console.log('[PatientMedicineWorker] Checking for updates since:', lastSync);

    // For incremental updates, we fetch all and let the main thread handle deduplication
    // This is a simplified approach - can be enhanced with a dedicated metadata API if available
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

    console.log('[PatientMedicineWorker] Received records:', updatedRecords.length);

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
      console.error('[PatientMedicineWorker] Metadata check error:', error);
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
    console.error('[PatientMedicineWorker] No auth token provided');
    self.postMessage({
      type: 'SYNC_ERROR',
      payload: { error: 'No authentication token' }
    } as WorkerResponse);
    return;
  }

  switch (type) {
    case 'START_FULL_SYNC':
      await fetchAllMedicines(apiBase, authToken);
      break;

    case 'CHECK_METADATA':
      await checkMetadataAPI(payload?.lastSync || 0, apiBase, authToken);
      break;

    default:
      console.warn('[PatientMedicineWorker] Unknown message type:', type);
  }
});

console.log('[PatientMedicineWorker] Patient Medicine Sync Worker initialized');
