import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Zap,
  DollarSign,
  Clock,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  Hash,
  Loader2,
  BarChart3,
  Cpu,
  MessageSquare,
} from 'lucide-react';
import UserProfile from '@/components/UserProfile';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

interface AnalyticsRow {
  id: number;
  query_id: string;
  deal_id: string;
  session_id: string;
  engine: string;
  question: string;
  answer: string;
  prompt_tokens: number;
  candidate_tokens: number;
  total_tokens: number;
  cost_estimate: number;
  latency_ms: number;
  workflow_log_id: string | null;
  created_at: string;
}

interface AnalyticsSummary {
  total_queries: number;
  total_prompt_tokens: number;
  total_candidate_tokens: number;
  total_tokens: number;
  total_cost_estimate: number;
  average_latency_ms: number;
}

const PAGE_SIZE = 15;

const formatEngine = (engine: string) => {
  switch (engine) {
    case 'cloud-llm': return 'Cloud-LLM';
    case 'on-premises': return 'On-Premises';
    case 'on-premises-lora': return 'On-Premises-LoRA';
    default: return engine;
  }
};

const getEngineColor = (engine: string) => {
  switch (engine) {
    case 'cloud-llm': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
    case 'on-premises': return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' };
    case 'on-premises-lora': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' };
  }
};

const formatTimestamp = (ts: string) => {
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true,
    });
  } catch {
    return ts;
  }
};

const DealAnalyticsPage = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [engineFilter, setEngineFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    if (!consultationId) return;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/deals/${consultationId}/analytics`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data.analytics || []);
        setSummary(data.summary || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [consultationId]);

  const filteredData = useMemo(() => {
    return analytics.filter(row => {
      const matchesSearch =
        row.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.query_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.engine?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEngine = engineFilter === 'all' || row.engine === engineFilter;
      return matchesSearch && matchesEngine;
    });
  }, [analytics, searchTerm, engineFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, engineFilter]);

  const uniqueEngines = useMemo(() => {
    const engines = new Set(analytics.map(r => r.engine));
    return Array.from(engines);
  }, [analytics]);

  // Prepare LangSmith-style aggregate chart data by engine
  const chartData = useMemo(() => {
    const engineGroups: { [key: string]: { count: number; prompt: number; candidate: number; total: number; cost: number; latency: number } } = {};

    analytics.forEach(row => {
      const eng = formatEngine(row.engine);
      if (!engineGroups[eng]) {
        engineGroups[eng] = { count: 0, prompt: 0, candidate: 0, total: 0, cost: 0, latency: 0 };
      }
      engineGroups[eng].count += 1;
      engineGroups[eng].prompt += row.prompt_tokens || 0;
      engineGroups[eng].candidate += row.candidate_tokens || 0;
      engineGroups[eng].total += row.total_tokens || 0;
      engineGroups[eng].cost += row.cost_estimate || 0;
      engineGroups[eng].latency += row.latency_ms || 0;
    });

    const result = Object.keys(engineGroups).map(eng => {
      const g = engineGroups[eng];
      return {
        engine: eng,
        count: g.count,
        avgPromptTokens: Math.round(g.prompt / g.count),
        avgCandidateTokens: Math.round(g.candidate / g.count),
        avgTotalTokens: Math.round(g.total / g.count),
        totalCost: g.cost,
        avgLatency: Math.round(g.latency / g.count),
      };
    });

    // Custom sort order: Cloud-LLM first, On-Premises second, On-Premises-LoRA last
    const order: { [key: string]: number } = {
      'Cloud-LLM': 1,
      'On-Premises': 2,
      'On-Premises-LoRA': 3,
    };

    return result.sort((a, b) => (order[a.engine] || 99) - (order[b.engine] || 99));
  }, [analytics]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white text-slate-800 p-3 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1.5 z-50 min-w-[160px]">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => {
            let valStr = entry.value.toLocaleString();
            if (entry.name.includes('Cost')) valStr = `$${entry.value.toFixed(4)}`;
            if (entry.name.includes('Latency')) valStr = `${entry.value} ms`;
            return (
              <p key={index} className="flex items-center justify-between gap-4 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-600">{entry.name}:</span>
                </span>
                <span className="font-bold text-slate-900">{valStr}</span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Summary card data
  const summaryCards = summary ? [
    {
      label: 'Total Queries',
      value: summary.total_queries.toLocaleString(),
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50',
    },
    {
      label: 'Total Tokens',
      value: summary.total_tokens.toLocaleString(),
      icon: <Zap className="w-5 h-5" />,
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50',
    },
    {
      label: 'Total Cost',
      value: `$${summary.total_cost_estimate.toFixed(4)}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
    },
    {
      label: 'Avg Latency',
      value: `${summary.average_latency_ms.toFixed(0)} ms`,
      icon: <Clock className="w-5 h-5" />,
      color: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50',
    },
  ] : [];

  return (
    <div className="min-h-screen bg-[#f4f6fc] font-['Inter']">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f1638] via-[#1a2256] to-[#252d6a] shadow-xl">
        <div className="px-6 md:px-12 lg:px-16 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/deals/${consultationId}`)}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-white tracking-tight">Query Analytics</h1>
                <p className="text-[11px] text-white/50 font-medium">Deal {consultationId}</p>
              </div>
            </div>
          </div>
          <UserProfile variant="header" />
        </div>
      </header>

      <main className="px-6 md:px-12 lg:px-16 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#1a2256]/30" />
              <span className="text-sm font-medium text-slate-400">Loading analytics…</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-32">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => navigate(`/deals/${consultationId}`)}
              className="mt-4 px-4 py-2 bg-[#1a2256] text-white rounded-lg text-sm font-medium"
            >
              Back to Deal
            </button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-300 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      {card.icon}
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-[#1a2256] tracking-tight">{card.value}</p>
                </div>
              ))}
            </div>

            {/* LangSmith-Style Analytics Charts Section */}
            {chartData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chart 1: Average Tokens */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">Average Tokens</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Prompt vs Candidate per query</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#2563eb]" /><span className="text-slate-600">Prompt</span></div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#10b981]" /><span className="text-slate-600">Candidate</span></div>
                    </div>
                  </div>
                  <div className="h-[270px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 15, left: 15, bottom: 35 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="engine" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval={0} angle={-25} textAnchor="end" height={65} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => `${val}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avgPromptTokens" name="Avg Prompt Tokens" stackId="a" fill="#2563eb" radius={[0, 0, 4, 4]} maxBarSize={48} />
                        <Bar dataKey="avgCandidateTokens" name="Avg Candidate Tokens" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Average Latency */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">Average Latency</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Execution speed per engine</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                      <span className="text-slate-600">Latency (ms)</span>
                    </div>
                  </div>
                  <div className="h-[270px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 15, left: 15, bottom: 35 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="engine" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval={0} angle={-25} textAnchor="end" height={65} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => `${val}ms`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avgLatency" name="Avg Latency" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Total Cost */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">Total Cost</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Accumulated spend by engine</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <div className="w-2 h-2 rounded-full bg-[#0284c7]" />
                      <span className="text-slate-600">Cost ($)</span>
                    </div>
                  </div>
                  <div className="h-[270px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 15, left: 15, bottom: 35 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="engine" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval={0} angle={-25} textAnchor="end" height={65} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => `$${val.toFixed(3)}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="totalCost" name="Total Cost" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Filters & Search */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-[#1a2256]" />
                  <h2 className="text-[15px] font-bold text-[#1a2256]">Query Traces</h2>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {filteredData.length} {filteredData.length === 1 ? 'trace' : 'traces'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Engine Filter */}
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                    <button
                      onClick={() => setEngineFilter('all')}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${engineFilter === 'all'
                        ? 'bg-[#1a2256] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      All
                    </button>
                    {uniqueEngines.map(eng => (
                      <button
                        key={eng}
                        onClick={() => setEngineFilter(eng)}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${engineFilter === eng
                          ? 'bg-[#1a2256] text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        {formatEngine(eng)}
                      </button>
                    ))}
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search queries..."
                      className="pl-9 pr-4 py-2 w-[240px] text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1a2256] focus:ring-2 focus:ring-[#1a2256]/5 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-[40px]">#</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Query ID</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Engine</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider min-w-[240px]">Question</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center w-[110px]">Input Tokens</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center w-[110px]">Output Tokens</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center w-[110px]">Total Tokens</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center w-[100px]">Cost</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center w-[100px]">Latency</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Workflow</th>
                      <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-5 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Hash className="w-8 h-8 text-slate-300" />
                            <p className="text-sm font-medium text-slate-400">No query traces found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((row, idx) => {
                        const engColor = getEngineColor(row.engine);
                        const globalIdx = (currentPage - 1) * PAGE_SIZE + idx + 1;
                        const isExpanded = expandedRow === row.id;
                        return (
                          <>
                            <tr
                              key={row.id}
                              onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                              className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                            >
                              <td className="px-5 py-3.5 text-[11px] font-bold text-slate-300">{globalIdx}</td>
                              <td className="px-5 py-3.5">
                                <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  {row.query_id}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${engColor.bg} ${engColor.text} ${engColor.border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${engColor.dot}`} />
                                  {formatEngine(row.engine)}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-[12px] font-medium text-slate-700 max-w-[300px]">
                                <span className="line-clamp-2">{row.question || '—'}</span>
                              </td>
                              <td className="px-5 py-3.5 text-[12px] font-semibold text-slate-600 text-center tabular-nums">
                                {row.prompt_tokens?.toLocaleString()}
                              </td>
                              <td className="px-5 py-3.5 text-[12px] font-semibold text-slate-600 text-center tabular-nums">
                                {row.candidate_tokens?.toLocaleString()}
                              </td>
                              <td className="px-5 py-3.5 text-[12px] font-bold text-[#1a2256] text-center tabular-nums">
                                {row.total_tokens?.toLocaleString()}
                              </td>
                              <td className="px-5 py-3.5 text-[12px] font-semibold text-emerald-600 text-center tabular-nums">
                                ${row.cost_estimate?.toFixed(4)}
                              </td>
                              <td className="px-5 py-3.5 text-[12px] font-semibold text-slate-600 text-center tabular-nums">
                                {row.latency_ms?.toFixed(0)} ms
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                {row.workflow_log_id ? (
                                  <a
                                    href={`https://innov-dev.beta.injomo.com/#workflow.debugger/${row.workflow_log_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a2256]/5 hover:bg-[#1a2256]/10 text-[#1a2256] text-[10px] font-bold transition-colors group/link"
                                  >
                                    <Cpu className="w-3 h-3" />
                                    <span>View</span>
                                    <ExternalLink className="w-3 h-3 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-slate-300 font-medium">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-[11px] font-medium text-slate-400 whitespace-nowrap">
                                {formatTimestamp(row.created_at)}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${row.id}-expanded`} className="bg-slate-50/50">
                                <td colSpan={11} className="px-5 py-4">
                                  <div className="grid grid-cols-2 gap-6 max-w-5xl">
                                    <div>
                                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Question</h4>
                                      <p className="text-[12px] text-slate-700 leading-relaxed bg-white rounded-xl p-4 border border-slate-100 shadow-sm max-h-[200px] overflow-y-auto">
                                        {row.question || '—'}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Answer</h4>
                                      <p className="text-[12px] text-slate-700 leading-relaxed bg-white rounded-xl p-4 border border-slate-100 shadow-sm max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                                        {row.answer || '—'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredData.length > PAGE_SIZE && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/30">
                  <span className="text-[11px] font-medium text-slate-400">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredData.length)} of {filteredData.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <span className="text-[11px] font-semibold text-slate-500 px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DealAnalyticsPage;
