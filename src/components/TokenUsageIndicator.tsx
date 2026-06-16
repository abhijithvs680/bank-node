import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { apiService, type TokenUsageSnapshot } from '@/services/apiService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

function remainingSharePercent(snapshot: TokenUsageSnapshot): number {
  const remaining = snapshot.remaining_balance_usd;
  const spent = snapshot.total_cost_usd;
  const denom = remaining + spent;
  if (denom <= 0) return 100;
  return Math.min(100, Math.max(0, (remaining / denom) * 100));
}

function formatUsd(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTokens(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function TokenUsageIndicator() {
  const [snapshot, setSnapshot] = useState<TokenUsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchUsage = useCallback(async () => {
    const data = await apiService.getTokenUsage();
    setSnapshot(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchUsage();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUsage]);

  const handleOpenChange = useCallback(
    async (next: boolean) => {
      setOpen(next);
      if (next) {
        setDetailLoading(true);
        try {
          await fetchUsage();
        } finally {
          setDetailLoading(false);
        }
      }
    },
    [fetchUsage]
  );

  const fillPercent = useMemo(
    () => (snapshot ? remainingSharePercent(snapshot) : 0),
    [snapshot]
  );

  const balanceLabel = useMemo(() => {
    if (loading || !snapshot) return '—';
    return snapshot.remaining_balance_usd.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }, [loading, snapshot]);

  const barColor = snapshot?.is_near_limit
    ? 'bg-amber-500'
    : 'bg-[#2A6DF1]';

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-[220px] rounded-xl px-3 py-2 text-left bg-white/75 backdrop-blur-md border border-[#2A6DF1]/15 shadow-sm hover:bg-white/90 hover:border-[#2A6DF1]/25 hover:shadow-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#2A6DF1]/30 focus-visible:ring-offset-2  "
          aria-busy={loading}
          aria-label="AI credits usage, show details"
          aria-expanded={open}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-[#0B1220]">AI Credits</span>
            <div className="flex items-center gap-0.5 text-sm tabular-nums min-w-[5.5rem] justify-end text-[#0B1220]">
              <span>{balanceLabel}</span>
              {!loading && snapshot !== null && (
                <span className="font-medium text-[#64748B] ml-0.5">left</span>
              )}
              <ChevronRight
                className={`w-4 h-4 shrink-0 text-[#64748B] transition-transform ${open ? 'rotate-90' : ''}`}
                aria-hidden
              />
            </div>
          </div>
          <div className="h-2 rounded-full bg-slate-200/90 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                loading ? 'w-1/3 animate-pulse bg-slate-300' :  'to-[#14B8A6] bg-gradient-to-br from-[#2A6DF1]'
              }`}
              style={loading ? undefined : { width: `${fillPercent}%` }}
            />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 p-0 overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 bg-white">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
            Usage details
          </p>
          <h3 className="text-lg font-semibold text-[#0B1220] mt-0.5">AI credits</h3>
        </div>

        <div className="p-4 space-y-4 bg-slate-50/80">
          {detailLoading && !snapshot && (
            <p className="text-sm text-[#64748B] text-center py-2">Loading…</p>
          )}

          {!detailLoading && snapshot === null && (
            <p className="text-sm text-[#64748B] text-center py-2">
              Could not load usage. Try again later.
            </p>
          )}

          {snapshot !== null && (
            <>
              {snapshot.is_near_limit && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-amber-900">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                  <p className="text-sm leading-snug">
                    You are approaching your usage limit. Consider monitoring spend.
                  </p>
                </div>
              )}

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#64748B]">Remaining balance</dt>
                  <dd className="font-semibold tabular-nums text-[#0B1220]">
                    ${formatUsd(snapshot.remaining_balance_usd)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#64748B]">Total spend</dt>
                  <dd className="font-medium tabular-nums text-[#0B1220]">
                    ${formatUsd(snapshot.total_cost_usd)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#64748B]">Total tokens</dt>
                  <dd className="font-medium tabular-nums text-[#0B1220]">
                    {formatTokens(snapshot.total_tokens)}
                  </dd>
                </div>
              </dl>

              <Separator className="bg-slate-200" />

              <div>
                <div className="flex justify-between text-xs text-[#64748B] mb-1.5">
                  <span>Credit remaining</span>
                  <span className="tabular-nums font-medium text-[#0B1220]">
                    {Math.round(fillPercent)}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor} `}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
