import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { dealContextDB, DealContextRecord, DealDataset } from './dealContextDatabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
let activeDb: Database | null = null;
let activeDealId: string | null = null;
let sqliteReady = false;
let sqliteBuildPromise: Promise<void> | null = null;

export interface LoadDealContextOptions {
  forceRefresh?: boolean;
  buildSqlite?: boolean;
}

/** Match goodbank-fastapi/database.py sanitize_table_name */
export function sanitizeTableName(filename: string): string {
  let name = filename.replace(/\.csv$/i, '');
  if (/^\d/.test(name)) {
    name = `_${name}`;
  }
  return name.replace(/[^\w]/g, '_');
}

/** Match goodbank-fastapi/database.py sanitize_column_name */
export function sanitizeColumnName(colname: string): string {
  let name = colname.trim().replace(/[^\w]|^(\d)/g, '_');
  if (!name) {
    name = 'column';
  }
  return name;
}

export function sanitizeHeaders(headers: string[]): string[] {
  const finalHeaders: string[] = [];
  const seen = new Set<string>();

  for (const header of headers) {
    let safe = sanitizeColumnName(header);
    if (seen.has(safe)) {
      safe = `${safe}_2`;
    }
    finalHeaders.push(safe);
    seen.add(safe);
  }

  return finalHeaders;
}

export function sourceFileToTableName(sourceFile: string): string {
  return sanitizeTableName(sourceFile);
}

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({ locateFile: () => sqlWasmUrl });
  }
  return sqlJsPromise;
}

export function prewarmDealContextEngine(): void {
  void getSqlJs();
}

function escapeIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function rebuildSqliteDatabase(dealId: string, datasets: DealDataset[]): Promise<void> {
  const SQL = await getSqlJs();
  activeDb?.close();
  activeDb = null;
  sqliteReady = false;

  const db = new SQL.Database();
  for (const dataset of datasets) {
    const tableName = sanitizeTableName(dataset.source_file);
    if (!dataset.columns.length) continue;

    const safeHeaders = sanitizeHeaders(dataset.columns);
    const columnDefs = safeHeaders.map((col) => `${escapeIdentifier(col)} TEXT`).join(', ');
    db.run(`CREATE TABLE ${escapeIdentifier(tableName)} (${columnDefs})`);

    const colList = safeHeaders.map(escapeIdentifier).join(', ');
    for (const row of dataset.rows) {
      const values = dataset.columns.map((col) => row[col] ?? null);
      const placeholders = values.map(() => '?').join(', ');
      db.run(
        `INSERT INTO ${escapeIdentifier(tableName)} (${colList}) VALUES (${placeholders})`,
        values
      );
    }
  }

  activeDb = db;
  activeDealId = dealId;
  sqliteReady = true;
}

export async function ensureSqliteDatabase(dealId: string): Promise<void> {
  if (!dealId) {
    throw new Error('Deal ID is required');
  }

  if (activeDealId === dealId && sqliteReady && activeDb) {
    return;
  }

  if (sqliteBuildPromise && activeDealId === dealId) {
    return sqliteBuildPromise;
  }

  sqliteBuildPromise = (async () => {
    const record = await dealContextDB.dealContexts.get(dealId);
    if (!record) {
      throw new Error(`Deal context for ${dealId} is not loaded yet`);
    }
    await rebuildSqliteDatabase(record.dealId, record.datasets);
  })();

  try {
    await sqliteBuildPromise;
  } finally {
    sqliteBuildPromise = null;
  }
}

export async function fetchDealContext(dealId: string, buildSqlite = false): Promise<DealContextRecord> {
  const response = await fetch(`${API_BASE_URL}/deal_context/${dealId}`);
  if (!response.ok) {
    throw new Error(`Failed to load deal context for ${dealId}`);
  }

  const data = await response.json();
  const record: DealContextRecord = {
    dealId: String(data.deal_id || dealId),
    datasets: data.datasets || [],
    loadedAt: Date.now(),
  };

  await dealContextDB.dealContexts.put(record);

  if (buildSqlite) {
    await rebuildSqliteDatabase(record.dealId, record.datasets);
  } else if (activeDealId === record.dealId) {
    activeDb?.close();
    activeDb = null;
    activeDealId = null;
    sqliteReady = false;
  }

  return record;
}

export async function loadDealContext(
  dealId: string,
  options: LoadDealContextOptions = {}
): Promise<DealContextRecord> {
  const { forceRefresh = false, buildSqlite = false } = options;

  if (!dealId) {
    throw new Error('Deal ID is required');
  }

  let record: DealContextRecord;
  if (!forceRefresh) {
    const cached = await dealContextDB.dealContexts.get(dealId);
    if (cached) {
      record = cached;
    } else {
      record = await fetchDealContext(dealId, false);
    }
  } else {
    record = await fetchDealContext(dealId, false);
  }

  if (buildSqlite) {
    await ensureSqliteDatabase(record.dealId);
  }

  return record;
}

/** Same text format as goodbank-fastapi/data_loader.py get_deal_context() */
export function getDealContextTextForPrompt(record: DealContextRecord): string {
  if (!record.datasets.length) {
    return `No data found for Deal ID: ${record.dealId}`;
  }

  const lines: string[] = [];
  for (const dataset of record.datasets) {
    if (dataset.linked_by === 'account_id') {
      lines.push(`--- Additional Data from ${dataset.source_file} (Linked via Account/Borrower ID) ---`);
    } else {
      lines.push(`--- Data from ${dataset.source_file} ---`);
    }

    lines.push(dataset.columns.join(','));
    for (const row of dataset.rows) {
      lines.push(dataset.columns.map((col) => row[col] ?? '').join(','));
    }
    lines.push('');
  }

  return lines.join('\n');
}

function buildSchemaDescription(record: DealContextRecord): string {
  const dealTables = record.datasets.map((ds) => {
    const table = sanitizeTableName(ds.source_file);
    const columns = sanitizeHeaders(ds.columns).join(', ');
    return `${table} (${columns})`;
  });

  const sharedTables =
    'Checklist (Clause, Clause_Description), file_financial_checklist_achievement (id, file_id, deal_id, clause, achieved, page_numbers, exact_quotes, bounding_boxes)';

  return [...dealTables, sharedTables].join('; ');
}

export function getActiveDealId(): string | null {
  return activeDealId;
}

export async function executeLocalDealQuery(query: string, dealId?: string): Promise<unknown> {
  const resolvedDealId = dealId || activeDealId;
  if (!resolvedDealId) {
    throw new Error('Deal data is not loaded yet. Please wait for deal context to finish loading.');
  }

  await ensureSqliteDatabase(resolvedDealId);

  if (!activeDb) {
    throw new Error('Deal database is not ready yet.');
  }

  const results = activeDb.exec(query);
  if (!results.length) {
    return [];
  }

  if (results.length === 1) {
    const { columns, values } = results[0];
    return values.map((row) =>
      Object.fromEntries(columns.map((col, index) => [col, row[index]]))
    );
  }

  return results.map((result) => ({
    columns: result.columns,
    rows: result.values.map((row) =>
      Object.fromEntries(result.columns.map((col, index) => [col, row[index]]))
    ),
  }));
}

export async function executeDealQuery(query: string, dealId?: string): Promise<unknown> {
  try {
    return await executeLocalDealQuery(query, dealId);
  } catch (localError) {
    console.warn('Local deal query failed, falling back to backend query_table:', localError);

    const response = await fetch(`${API_BASE_URL}/query_table`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.detail || 'Backend query failed');
    }

    const data = await response.json();
    return data.data ?? data.results ?? data;
  }
}

export function formatQueryTableToolResponse(data: unknown): { result: string } {
  return { result: JSON.stringify(data) };
}

export function formatQueryTableToolError(message: string): { result: string } {
  return { result: `Error: ${message}` };
}

export function getQueryTableToolDeclaration(record?: DealContextRecord) {
  const schema = record ? buildSchemaDescription(record) : 'Use sqlite_master to discover tables.';

  return {
    name: 'query_table',
    description:
      'Query the deal database using SQLite. Use this for checklist achievements, file status, or any tabular deal data not already in the deal context. ' +
      `Available tables: ${schema}. ` +
      "BreachesRequestList contains covenant violations and RISK FACTORS in RequestDescription. " +
      'Table and column names use underscores (e.g. Due_Date, TotalAmountToPay__ZAR_, Payment_Status, KYC_status, Dev__Deal_Lender).',
    parameters: {
      type: 'OBJECT',
      properties: {
        sqlite_query: {
          type: 'STRING',
          description: 'Valid SQLite SELECT query. Use sanitized table/column names with underscores.',
        },
      },
      required: ['sqlite_query'],
    },
  };
}

export function getWebSearchToolDeclaration() {
  return {
    name: 'web_search',
    description:
      'Use this tool to execute a web search query for current time outside data or when the user asks for real-time information from the web.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'The query to search for',
        },
        deal_id: {
          type: 'STRING',
          description: 'Optional deal ID context to focus the query',
        },
      },
      required: ['query'],
    },
  };
}

export function getGeminiVoiceTools(record?: DealContextRecord) {
  return [
    {
      functionDeclarations: [getQueryTableToolDeclaration(record), getWebSearchToolDeclaration()],
    },
  ];
}

export function buildDealVoiceSystemInstructions(
  dealId: string,
  staticContext: unknown,
  dealContextText: string,
  options?: { waitForUser?: boolean }
): string {
  const intro = options?.waitForUser
    ? 'You are a helpful AI Voice Assistant for a Bank Loan Lending Platform. Speak in English by default. Only switch to another language if the user explicitly asks you to do so. Do not introduce yourself or greet at session start—wait for the user to speak first.'
    : 'You are a helpful AI Voice Assistant for a Bank Loan Lending Platform. Speak in English by default. Only switch to another language if the user explicitly asks you to do so.';

  const uiDataSection = staticContext
    ? `\n--- UI STATIC DATA CONTEXT (Currently visible to user) ---\n${JSON.stringify(staticContext, null, 2)}\n----------------------------------------------------------\n`
    : '';

  return `${intro}
You are a bank loan lending platform deal assistant helping with Deal ID: ${dealId}.
Answer the user's questions based on the deal data below. If you need checklist achievements, file status, or data not in the context, use the query_table tool.

CRITICAL PRIVACY & BEHAVIORAL RULES:
1. NEVER mention table names, SQL queries, database calls, tool execution, function calling, or any backend search mechanism. Present findings naturally.
2. You are ONLY allowed to discuss data for Deal ID: '${dealId}'. Never reveal data for other deals.
3. Access to the file_management table is forbidden.
4. If the data does not contain the answer, say so.

--- DEAL DATA CONTEXT ---
${dealContextText}
-------------------------
${uiDataSection}
Instructions:
• Keep responses brief and action-oriented.
• Speak in English unless the user explicitly requests another language.
• When triggering any function call, do NOT speak confirmation messages. Stay silent after a function call succeeds.
• Only speak when: providing deal information, asking necessary clarifying questions, or when no tool action is triggered.
• If the user asks you to "stop," "hold on," "wait," or "pause," acknowledge politely and pause.`;
}
