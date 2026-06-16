import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { getRelativeTime, getExactDateTime, getFormattedDate } from '@/utils/timeUtils';
import { cn } from '@/lib/utils';

interface RelativeTimeProps {
  dateStr: string;
  className?: string;
  showDateOnly?: boolean;
}

export const RelativeTime = ({ dateStr, className, showDateOnly = true }: RelativeTimeProps) => {
  const relativeTime = getRelativeTime(dateStr);
  const tooltipText = showDateOnly ? getFormattedDate(dateStr) : getExactDateTime(dateStr);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("cursor-default", className, "text-[13px]")}>
            {tooltipText}
          </span>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  );
};
