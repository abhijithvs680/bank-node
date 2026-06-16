import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { getRelativeTimeFuture, getExactDateTime } from '@/utils/timeUtils';
import { cn } from '@/lib/utils';

interface MedicationDueTimeProps {
  dateStr: string;
  className?: string;
  showDueTime?: boolean; // Show the actual time (e.g., "02:30 PM")
}

export const MedicationDueTime = ({ dateStr, className, showDueTime = false }: MedicationDueTimeProps) => {
  const { text: relativeTime } = getRelativeTimeFuture(dateStr);
  const exactTime = getExactDateTime(dateStr);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("cursor-default", className)}>
            {relativeTime}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{exactTime}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
