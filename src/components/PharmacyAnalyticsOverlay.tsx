import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogFooter, VisuallyHidden } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  TrendingUp,
  Sparkles,
  Check,
  Loader2,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PharmacyAnalyticsResponse, AnalyticsChart, AnalyticsTable, SuggestedAction } from '@/types/pharmacyAnalytics';
import { format } from 'date-fns';

interface PharmacyAnalyticsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PharmacyAnalyticsResponse | null;
  isLoading: boolean;
}

// Loading steps configuration
const loadingSteps = [
  { id: 1, text: "Connecting to pharmacy database" },
  { id: 2, text: "Fetching inventory records" },
  { id: 3, text: "Analyzing sales patterns" },
  { id: 4, text: "Running AI predictions" },
  { id: 5, text: "Summarizing insights" }
];

// AI Progress Loader Component - Minimal white theme
const AIProgressLoader = ({
  currentStep,
  progress
}: {
  currentStep: number;
  progress: number;
}) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white p-8">
      <div className="w-full max-w-sm mx-auto space-y-10">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-[#1a2256]/5 mb-4">
            <Sparkles className="h-8 w-8 text-[#1a2256] animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#1a2256] to-[#64549f] bg-clip-text text-transparent">Analyzing Pharmacy Data</h2>
          <p className="text-[14px] text-[#6e6868] font-medium mt-1">Our AI is generating clinical insights</p>
        </div>

        {/* Simple Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[12px] font-bold text-[#1a2256]">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-[#f0f3f9] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1a2256] to-[#64549f] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-4 bg-[#fcfdfe] border border-[#e0e3f5] p-5 rounded-[20px]">
          {loadingSteps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={step.id} className="flex items-center gap-3">
                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-[#1a2256]/10 flex items-center justify-center">
                      <Loader2 className="h-3 w-3 text-[#1a2256] animate-spin" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-[#e0e3f5]" />
                  )}
                </div>

                {/* Step Text */}
                <span className={cn(
                  "text-[13px] font-bold",
                  isCompleted && "text-[#6e6868] line-through decoration-[#e0e3f5]",
                  isCurrent && "text-[#1a2256]",
                  !isCompleted && !isCurrent && "text-[#e0e3f5]"
                )}>
                  {step.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return { icon: AlertCircle, color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800', iconColor: 'text-red-600 dark:text-red-400' };
    case 'WARNING':
      return { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800', iconColor: 'text-yellow-600 dark:text-yellow-400' };
    case 'INFO':
    default:
      return { icon: Info, color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800', iconColor: 'text-blue-600 dark:text-blue-400' };
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300';
    case 'MEDIUM':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
    case 'LOW':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
  }
};

// Helper to normalize chart data from various LLM response formats
const normalizeChartData = (chart: AnalyticsChart): { name: string; value: number }[] => {
  const rawData = chart.data || chart.series || [];

  return rawData.map(item => ({
    name: String(item.name || item.category || item.label || 'Unknown'),
    value: Number(item.value ?? item.total_sold ?? item.count ?? 0)
  }));
};

// Color palette for pie charts
const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
];

const AnalyticsChartComponent = ({ chart }: { chart: AnalyticsChart }) => {
  const chartType = chart.type?.toUpperCase();

  // PIE / DOUGHNUT Chart
  if (chartType === 'PIE' || chartType === 'DOUGHNUT') {
    const data = normalizeChartData(chart);

    if (data.length === 0) return null;

    const innerRadius = chartType === 'DOUGHNUT' ? 50 : 0;

    return (
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {chart.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={100}
                paddingAngle={2}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                animationDuration={800}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // BAR Chart
  if (chartType === 'BAR') {
    const data = normalizeChartData(chart);

    if (data.length === 0) return null;

    const truncatedData = data.map(item => ({
      ...item,
      displayName: item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name
    }));

    return (
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {chart.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={Math.max(250, truncatedData.length * 40)}>
            <BarChart data={truncatedData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="displayName" width={180} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), 'Total']}
                labelFormatter={(label: string) => {
                  const item = truncatedData.find(d => d.displayName === label);
                  return item?.name || label;
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Bar
                dataKey="value"
                fill="url(#barGradient)"
                radius={[0, 6, 6, 0]}
                animationDuration={800}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // LINE Chart
  if (chartType === 'LINE') {
    const series = chart.series || [];

    if (series.length === 0) return null;

    const allDates = new Set<string>();
    series.forEach(s => {
      s.data?.forEach(d => allDates.add(d.date));
    });

    const data = Array.from(allDates).sort().map(date => {
      const point: Record<string, string | number> = { date };
      series.forEach(s => {
        const dataPoint = s.data?.find(d => d.date === date);
        if (dataPoint) {
          point[s.name || 'value'] = dataPoint.value;
        }
      });
      return point;
    });

    const colors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

    return (
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {chart.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {series.map((s, i) => (
                <Line
                  key={s.name || i}
                  type="monotone"
                  dataKey={s.name || 'value'}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: colors[i % colors.length] }}
                  animationDuration={800}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // Fallback: render unknown chart types as a simple table
  const data = normalizeChartData(chart);
  if (data.length === 0) return null;

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {chart.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Label</TableHead>
              <TableHead className="text-xs font-semibold text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, i) => (
              <TableRow key={i} className="hover:bg-muted/30">
                <TableCell className="text-sm">{item.name}</TableCell>
                <TableCell className="text-sm text-right font-medium">{item.value.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const AnalyticsTableComponent = ({ table }: { table: AnalyticsTable }) => {
  const columns = table.columns || table.headers || [];

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-sm font-semibold">{table.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {columns.map((col, i) => (
                  <TableHead key={i} className="text-xs font-semibold whitespace-nowrap">{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows?.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-muted/30 transition-colors">
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className="text-xs py-3 whitespace-nowrap">
                      {cell === null ? <span className="text-muted-foreground">-</span> : typeof cell === 'number' ? cell.toLocaleString() : cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const mapPriority = (priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | number): string => {
  if (typeof priority === 'number') {
    if (priority === 1) return 'CRITICAL';
    if (priority === 2) return 'HIGH';
    if (priority === 3) return 'MEDIUM';
    return 'LOW';
  }
  return priority;
};

const ActionsPanel = ({ actions }: { actions: SuggestedAction[] }) => {
  if (!actions?.length) return null;

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Suggested Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {actions.map((action, i) => {
          // Default to MEDIUM if priority is missing
          const priorityStr = action.priority != null ? mapPriority(action.priority) : 'MEDIUM';
          const actionText = action.label || action.action || action.description || '';
          const categoryText = action.category || action.actionType || '';

          return (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
            >
              {categoryText && (
                <Badge variant="secondary" className="text-xs shrink-0 font-medium">
                  {categoryText}
                </Badge>
              )}
              <Badge variant="outline" className={`${getPriorityColor(priorityStr)} text-xs shrink-0 font-semibold`}>
                {priorityStr}
              </Badge>
              <span className="text-sm leading-relaxed flex-1">{actionText}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export const PharmacyAnalyticsOverlay = ({
  open,
  onOpenChange,
  data,
  isLoading
}: PharmacyAnalyticsOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Manage loading progress animation
  useEffect(() => {
    if (!isLoading || !open) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    // Step advancement every ~4 seconds (20s total / 5 steps)
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, loadingSteps.length - 1));
    }, 4000);

    // Smooth progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 0.5, 95));
    }, 100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading, open]);

  // Complete progress when data arrives
  useEffect(() => {
    if (data && !isLoading) {
      setProgress(100);
      setCurrentStep(loadingSteps.length);
    }
  }, [data, isLoading]);

  const severityConfig = data?.summary ? getSeverityConfig(data.summary.severity) : null;
  const SeverityIcon = severityConfig?.icon || Info;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden border-[#e0e3f5] shadow-2xl !flex !flex-col min-h-0 rounded-[24px] [&>button]:text-white">
        <VisuallyHidden>
          <DialogTitle>
            {isLoading ? 'Loading Analytics' : data?.title || 'Pharmacy Analytics'}
          </DialogTitle>
        </VisuallyHidden>

        {isLoading ? (
          <div className="flex-1 bg-white">
            <AIProgressLoader
              currentStep={currentStep}
              progress={progress}
            />
          </div>
        ) : data ? (
          <div className="h-full min-h-0 flex flex-col bg-white">
            {/* Header */}
            <div className="shrink-0 bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-normal text-white">{data.title}</h2>
                    <p className="text-[13px] text-white/70 font-medium">AI-powered pharmacy insights</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto medical-scroll">
              <div className="p-6 space-y-6">
                {/* Summary Card */}
                {data.summary && (
                  <Card className={`border-2 ${severityConfig?.color} overflow-hidden rounded-[20px] shadow-sm`}>
                    <CardContent className="pt-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-[14px] ${severityConfig?.color}`}>
                          <SeverityIcon className={`h-6 w-6 ${severityConfig?.iconColor}`} />
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={`${severityConfig?.color} font-bold text-[11px]`}>
                              {data.summary.severity}
                            </Badge>
                            <span className="text-[12px] text-[#6e6868] font-bold">
                              {Math.round(data.summary.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-[15px] font-bold text-[#1a2256] leading-relaxed">{data.summary.headline}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* KPIs Grid */}
                {data.kpis?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {data.kpis.map((kpi, i) => (
                      <Card key={i} className="text-center border-[#e0e3f5] bg-[#fcfdfe] hover:bg-white hover:border-[#64549f]/30 transition-all rounded-[20px] shadow-sm border">
                        <CardContent className="pt-5 pb-4">
                          <div className="text-2xl font-bold text-[#1a2256]">
                            {kpi.value}
                          </div>
                          <div className="text-[11px] text-[#6e6868] mt-1 font-bold uppercase tracking-wider">{kpi.label}</div>
                          {kpi.unit && (
                            <div className="text-[11px] text-[#64549f] font-bold mt-0.5">{kpi.unit}</div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Charts and Tables in a grid for larger screens */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Charts */}
                  {data.charts?.map((chart, i) => (
                    <div key={`chart-${i}`} className={data.charts?.length === 1 ? 'xl:col-span-2' : ''}>
                      <AnalyticsChartComponent chart={chart} />
                    </div>
                  ))}
                </div>

                {/* Tables */}
                {data.tables?.map((table, i) => (
                  <AnalyticsTableComponent key={`table-${i}`} table={table} />
                ))}

                {/* Suggested Actions */}
                <ActionsPanel actions={data.suggestedActions} />

                {/* Last Updated */}
                {data.lastUpdated && (
                  <div className="flex items-center justify-center gap-2 text-[12px] text-[#6e6868] font-bold pt-4 pb-2">
                    <Clock className="h-3.5 w-3.5" />
                    Last updated: {format(new Date(data.lastUpdated), 'PPp')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center grow h-full gap-4 text-[#6e6868] bg-white">
            <Info className="h-12 w-12 text-[#e0e3f5]" />
            <p className="text-lg font-bold">No data available</p>
          </div>
        )}

        {!isLoading && (
          <DialogFooter className="px-6 py-4 bg-[#fcfdfe] border-t border-[#f0f3f9] rounded-b-[24px] shrink-0">
            <Button
              onClick={() => onOpenChange(false)}
              className="rounded-[12px] h-11 px-8 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-lg shadow-[#1a2256]/20 transition-all active:scale-[0.98] w-full max-w-xs mx-auto"
            >
              Close Analytics
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
