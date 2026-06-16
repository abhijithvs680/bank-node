import { 
  TrendingUp, 
  AlertTriangle, 
  Archive, 
  ShoppingBag, 
  Bell, 
  Users,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PharmacyChipType } from '@/types/pharmacyAnalytics';

interface ChipConfig {
  id: PharmacyChipType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const chips: ChipConfig[] = [
  { id: 'DEMAND_SALES_OUTLOOK', label: 'Demand & Sales Outlook', icon: TrendingUp },
  { id: 'OVERSTOCK_RISK_INDEX', label: 'Overstock Risk Index', icon: AlertTriangle },
  { id: 'DEAD_STOCK_ANALYSIS', label: 'Dead Stock Analysis', icon: Archive },
  { id: 'EMERGENCY_PURCHASE', label: 'Emergency Purchase', icon: ShoppingBag },
  { id: 'ANOMALIES_ALERTS', label: 'Anomalies & Alerts', icon: Bell },
  { id: 'VENDOR_OPTIMIZATION', label: 'Vendor Optimization', icon: Users },
];

interface PharmacyAnalyticsChipsProps {
  onChipClick: (chipType: PharmacyChipType) => void;
  activeChip: PharmacyChipType | null;
  isLoading: boolean;
}

export const PharmacyAnalyticsChips = ({
  onChipClick,
  activeChip,
  isLoading
}: PharmacyAnalyticsChipsProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
      {chips.map((chip) => {
        const Icon = chip.icon;
        const isActive = activeChip === chip.id;
        const isLoadingThis = isLoading && isActive;
        
        return (
          <Button
            key={chip.id}
            variant="outline"
            size="sm"
            onClick={() => onChipClick(chip.id)}
            disabled={isLoading}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium
              transition-all duration-200 border
              ${isActive 
                ? 'bg-blue-100 border-blue-400 text-blue-700' 
                : 'bg-white/80 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
              }
            `}
          >
            {isLoadingThis ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Icon className="w-3.5 h-3.5" />
            )}
            {chip.label}
          </Button>
        );
      })}
    </div>
  );
};
