import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

export type DealNoteToolAction = 'create_note' | 'notify_users' | 'create_note_and_notify';

export interface CreateDealNotePayload {
  note_title: string;
  note_description: string;
  note_type: string;
  ai_call_id?: string;
}

export interface DealEmailRecipient {
  name: string;
  email: string;
  role?: string;
}

export interface DealEmailPayload {
  deal_id: string;
  subject: string;
  body_text: string;
  body_html: string;
  to: DealEmailRecipient[];
}

export interface DealNotePendingData {
  note_title: string;
  note_description: string;
  note_type: string;
  ai_call_id?: string;
}

export interface DealNotifyPendingData {
  notify_title: string;
  notify_message: string;
  notify_type: string;
  recipients: DealEmailRecipient[];
  email: DealEmailPayload;
  noteReferenceId?: string;
}

export interface CreateDealNoteToolPayload {
  action: DealNoteToolAction;
  note_title?: string;
  note_description?: string;
  note_type?: string;
  notify_title?: string;
  notify_message?: string;
  recipients?: string[] | string;
  notify_type?: DealAIActivityEventType;
  ai_call_id?: string;
}

export interface DealNoteRecord {
  id: string;
  deal_id: string;
  note_title: string;
  note_description: string;
  note_type: string;
  generated_by?: string;
  ai_call_id?: string | null;
  written_on?: string;
  created_at?: string;
  updated_at?: string;
}

export type DealAIActivityEventType =
  | 'Reminder'
  | 'Alert'
  | 'Analysis'
  | 'Compliance'
  | 'Communication'
  | 'Note';

export interface CreateDealAIActivityPayload {
  event_title: string;
  event_type: DealAIActivityEventType;
  description: string;
  timestamp?: string;
  reference_id?: string;
}

export interface DealNoteToolResult {
  pendingNote?: DealNotePendingData;
  pendingNotify?: DealNotifyPendingData;
  recipients: DealEmailRecipient[];
}

export function parseRecipients(recipients?: string[] | string): string[] {
  if (!recipients) return [];
  if (Array.isArray(recipients)) {
    return recipients.map((r) => r.trim()).filter(Boolean);
  }
  return recipients
    .split(/[,;\n]/)
    .map((r) => r.trim())
    .filter(Boolean);
}

export function mapNoteTypeToActivityEventType(noteType: string): DealAIActivityEventType {
  const normalized = noteType.trim();
  const validTypes: DealAIActivityEventType[] = [
    'Reminder',
    'Alert',
    'Analysis',
    'Compliance',
    'Communication',
    'Note',
  ];

  if (validTypes.includes(normalized as DealAIActivityEventType)) {
    return normalized as DealAIActivityEventType;
  }

  if (/compliance/i.test(normalized)) return 'Compliance';
  if (/risk|alert|breach/i.test(normalized)) return 'Alert';
  if (/communication/i.test(normalized)) return 'Communication';
  if (/reminder/i.test(normalized)) return 'Reminder';

  return 'Note';
}

export function mapNotifyType(notifyType?: string): DealAIActivityEventType {
  if (!notifyType) return 'Reminder';
  const normalized = notifyType.trim();
  const valid: DealAIActivityEventType[] = [
    'Reminder',
    'Alert',
    'Communication',
    'Compliance',
    'Analysis',
  ];
  if (valid.includes(normalized as DealAIActivityEventType)) {
    return normalized as DealAIActivityEventType;
  }
  if (/communicat/i.test(normalized)) return 'Communication';
  if (/alert/i.test(normalized)) return 'Alert';
  if (/compliance/i.test(normalized)) return 'Compliance';
  return 'Reminder';
}

function slugifyForEmail(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'contact';
}

export function parseEmailRecipient(raw: string): DealEmailRecipient {
  const trimmed = raw.trim();
  const emailMatch = trimmed.match(/<([^>\s]+@[^>\s]+)>/);
  const explicitEmail = emailMatch?.[1];
  const withoutEmail = trimmed.replace(/\s*<[^>]+>/, '').trim();
  const roleMatch = withoutEmail.match(/^(.+?)\s*\(([^)]+)\)$/);

  if (roleMatch) {
    const name = roleMatch[1].trim();
    return {
      name,
      role: roleMatch[2].trim(),
      email: explicitEmail || `${slugifyForEmail(name)}@goodbank.local`,
    };
  }

  return {
    name: withoutEmail,
    email: explicitEmail || `${slugifyForEmail(withoutEmail)}@goodbank.local`,
  };
}

export function parseEmailRecipients(recipients?: string[] | string): DealEmailRecipient[] {
  return parseRecipients(recipients).map(parseEmailRecipient);
}

export function notifyMessageToHtml(message: string): string {
  const lines = message
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const numbered = lines.filter((line) => /^\d+\.\s/.test(line));
  if (numbered.length >= 2) {
    const intro = lines.find((line) => !/^\d+\.\s/.test(line)) || '';
    const items = numbered
      .map((line) => line.replace(/^\d+\.\s*/, ''))
      .map((item) => `<li>${item}</li>`)
      .join('');
    return `${intro ? `<p>${intro}</p>` : ''}<ol>${items}</ol>`;
  }

  return `<p>${message.replace(/\n/g, '<br/>')}</p>`;
}

export function buildDealEmailPayload(
  dealId: string,
  subject: string,
  bodyText: string,
  recipients: DealEmailRecipient[]
): DealEmailPayload {
  return {
    deal_id: dealId,
    subject,
    body_text: bodyText,
    body_html: notifyMessageToHtml(bodyText),
    to: recipients,
  };
}

export function buildNotifyActivityDescription(
  notifyMessage: string,
  recipients: DealEmailRecipient[]
): string {
  const recipientText =
    recipients.length > 0
      ? ` Email sent to: ${recipients.map((r) => `${r.name} <${r.email}>`).join(', ')}.`
      : '';
  return `${notifyMessage}${recipientText}`;
}

export async function createDealNote(
  dealId: string,
  payload: CreateDealNotePayload
): Promise<{ message: string; note: DealNoteRecord }> {
  const response = await fetch(`${API_BASE_URL}/deals/${dealId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to create deal note');
  }

  return response.json();
}

export async function logDealAIActivity(
  dealId: string,
  payload: CreateDealAIActivityPayload
): Promise<{ message: string; activity: Record<string, unknown> }> {
  const response = await fetch(`${API_BASE_URL}/deals/${dealId}/ai_activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to log AI activity');
  }

  return response.json();
}

async function logNoteActivity(
  dealId: string,
  note: DealNoteRecord,
  noteType: string,
  timestamp: string
): Promise<void> {
  const activityPayload: CreateDealAIActivityPayload = {
    event_title: note.note_title,
    event_type: 'Note',
    description: note.note_description,
    timestamp,
    reference_id: note.id,
  };

  try {
    await logDealAIActivity(dealId, activityPayload);
  } catch {
    await logDealAIActivity(dealId, {
      ...activityPayload,
      event_type: mapNoteTypeToActivityEventType(noteType),
    });
  }
}

export async function logDealNotifyActivity(
  dealId: string,
  activity: {
    event_title: string;
    event_type: DealAIActivityEventType;
    description: string;
    reference_id?: string;
  }
): Promise<{ sentAt: string }> {
  const sentAt = format(new Date(), 'yyyy-MM-dd HH:mm');
  await logDealAIActivity(dealId, {
    ...activity,
    timestamp: sentAt,
  });
  return { sentAt };
}

/** @deprecated Demo app logs activity only — use logDealNotifyActivity */
export async function sendDealNotifyEmail(
  dealId: string,
  _email: DealEmailPayload,
  activity: {
    event_title: string;
    event_type: DealAIActivityEventType;
    description: string;
    reference_id?: string;
  }
): Promise<{ sentAt: string }> {
  return logDealNotifyActivity(dealId, activity);
}

export async function saveDealNote(
  dealId: string,
  payload: DealNotePendingData
): Promise<{ note: DealNoteRecord; noteTimestamp: string }> {
  const noteResponse = await createDealNote(dealId, {
    note_title: payload.note_title,
    note_description: payload.note_description,
    note_type: payload.note_type,
    ai_call_id: payload.ai_call_id,
  });
  const note = noteResponse.note;
  const noteTimestamp = format(new Date(), 'yyyy-MM-dd HH:mm');
  await logNoteActivity(dealId, note, payload.note_type, noteTimestamp);
  return { note, noteTimestamp };
}

export async function executeDealNoteToolAction(
  dealId: string,
  payload: CreateDealNoteToolPayload
): Promise<DealNoteToolResult> {
  const action = payload.action || 'create_note';
  const recipients = parseEmailRecipients(payload.recipients);
  let pendingNote: DealNotePendingData | undefined;
  let pendingNotify: DealNotifyPendingData | undefined;

  if (action === 'create_note' || action === 'create_note_and_notify') {
    if (!payload.note_title || !payload.note_description || !payload.note_type) {
      throw new Error('note_title, note_description, and note_type are required for note creation');
    }

    pendingNote = {
      note_title: payload.note_title,
      note_description: payload.note_description,
      note_type: payload.note_type,
      ai_call_id: payload.ai_call_id,
    };
  }

  if (action === 'notify_users' || action === 'create_note_and_notify') {
    if (!payload.notify_title || !payload.notify_message) {
      throw new Error('notify_title and notify_message are required for notify flow');
    }

    const notifyEventType = mapNotifyType(payload.notify_type);
    const emailRecipients =
      recipients.length > 0
        ? recipients
        : [{ name: 'All deal users', email: 'deal-team@goodbank.local' }];

    const email = buildDealEmailPayload(
      dealId,
      payload.notify_title,
      payload.notify_message,
      emailRecipients
    );

    pendingNotify = {
      notify_title: payload.notify_title,
      notify_message: payload.notify_message,
      notify_type: notifyEventType,
      recipients: emailRecipients,
      email,
    };
  }

  return { pendingNote, pendingNotify, recipients };
}

/** @deprecated Use executeDealNoteToolAction + saveDealNote */
export async function createDealNoteAndLogActivity(
  dealId: string,
  payload: CreateDealNotePayload
): Promise<{ note: DealNoteRecord; timestamp: string }> {
  const result = await saveDealNote(dealId, payload);
  return { note: result.note, timestamp: result.noteTimestamp };
}

export function formatCreateDealNoteToolResponse(result: DealNoteToolResult): { result: string } {
  return {
    result: JSON.stringify({
      success: true,
      note_prepared: Boolean(result.pendingNote),
      awaiting_user_save: Boolean(result.pendingNote),
      notification_prepared: Boolean(result.pendingNotify),
      awaiting_user_send: Boolean(result.pendingNotify),
      recipients: result.recipients.map((r) => `${r.name} <${r.email}>`),
    }),
  };
}

export function formatCreateDealNoteToolError(message: string): { result: string } {
  return { result: `Error: ${message}` };
}

export interface DealAIActivityRecord {
  id: number;
  deal_id: string;
  event_title: string;
  event_type: string;
  description: string;
  timestamp: string;
  reference_id?: string | null;
  created_at?: string;
}

export interface DealAIActivityResponse {
  deal_id: string;
  activities: DealAIActivityRecord[];
}

export interface DealAILogEntry {
  id?: number;
  timestamp: string;
  eventType: DealAIActivityEventType | string;
  eventTitle?: string;
  description: string;
  status: 'Sent' | 'Completed' | 'Pending' | 'Detected' | 'Resolved' | 'Failed';
  referenceId?: string | null;
}

function mapEventTypeToStatus(eventType: string): DealAILogEntry['status'] {
  switch (eventType) {
    case 'Reminder':
    case 'Communication':
      return 'Sent';
    case 'Alert':
    case 'Compliance':
      return 'Detected';
    case 'Analysis':
    case 'Note':
      return 'Completed';
    default:
      return 'Completed';
  }
}

export function mapActivityToLogEntry(activity: DealAIActivityRecord): DealAILogEntry {
  return {
    id: activity.id,
    timestamp: activity.timestamp || activity.created_at || '',
    eventType: activity.event_type,
    eventTitle: activity.event_title,
    description: activity.description,
    status: mapEventTypeToStatus(activity.event_type),
    referenceId: activity.reference_id,
  };
}

export async function fetchDealAIActivity(dealId: string): Promise<DealAIActivityResponse> {
  const response = await fetch(`${API_BASE_URL}/deals/${dealId}/ai_activity`);
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to fetch AI activity log');
  }
  return response.json();
}

export async function deleteDealFile(
  dealId: string,
  fileId: string
): Promise<{
  message: string;
  deal_id: string;
  file_id: string;
  file_name: string;
  file_removed_from_disk: boolean;
  checklist_rows_deleted: number;
}> {
  const response = await fetch(`${API_BASE_URL}/deals/${dealId}/files/${fileId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || 'Failed to delete file');
  }

  return response.json();
}
