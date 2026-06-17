const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

export interface DealClauseItem {
  id: string;
  group_id: string;
  deal_id: string;
  title: string;
  description?: string | null;
  sort_order?: number;
}

export interface DealClauseGroup {
  id: string;
  deal_id: string;
  name: string;
  clauses: DealClauseItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ChecklistAchievementItem {
  group_id?: string | null;
  item_id?: string | null;
  clause: string;
  achieved: boolean;
  page_numbers: number[];
  exact_quotes: string[];
  bounding_boxes?: Array<{
    page_number: number;
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  }>;
}

export async function uploadDealDocument(
  dealId: string,
  file: File
): Promise<{ file_id: string; file_name: string; deal_id: string }> {
  const formData = new FormData();
  formData.append('deal_id', dealId);
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/analyze_document`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || `Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchDealClauseGroups(dealId: string): Promise<DealClauseGroup[]> {
  const response = await fetch(`${API_BASE_URL}/deals/${dealId}/clause_groups`);
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to load clause groups');
  }
  const data = await response.json();
  return data.groups || [];
}

export async function createDealClauseGroup(
  dealId: string,
  name: string
): Promise<DealClauseGroup> {
  const response = await fetch(`${API_BASE_URL}/deals/${dealId}/clause_groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim() }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to create clause group');
  }

  const data = await response.json();
  return data.group;
}

export async function addDealClauseItem(
  dealId: string,
  groupId: string,
  payload: { title: string; description?: string | null }
): Promise<DealClauseItem> {
  const response = await fetch(
    `${API_BASE_URL}/deals/${dealId}/clause_groups/${groupId}/items`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to add clause item');
  }

  const data = await response.json();
  return data.item;
}

export async function updateDealClauseItem(
  dealId: string,
  groupId: string,
  itemId: string,
  payload: { title?: string; description?: string | null }
): Promise<DealClauseItem> {
  const response = await fetch(
    `${API_BASE_URL}/deals/${dealId}/clause_groups/${groupId}/items/${itemId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
        ...(payload.description !== undefined
          ? { description: payload.description?.trim() || null }
          : {}),
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to update clause item');
  }

  const data = await response.json();
  return data.item;
}

export async function deleteDealClauseItem(
  dealId: string,
  groupId: string,
  itemId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/deals/${dealId}/clause_groups/${groupId}/items/${itemId}`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to delete clause item');
  }
}

export async function runDealFileChecklist(
  dealId: string,
  fileId: string,
  groupIds: string[]
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/deals/${dealId}/files/${fileId}/run_checklist`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_ids: groupIds }),
    }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Checklist analysis failed');
  }

  // Results are persisted server-side; refresh via GET /deal_files/{deal_id}.
}
