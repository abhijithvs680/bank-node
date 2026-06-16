import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Search, AlertTriangle, Package, Info, RefreshCw, Calculator, ShoppingCart } from "lucide-react";
import { SearchResultsTemplate } from "./PharmacyResultTemplates/SearchResultsTemplate";
import { DrugInteractionTemplate } from "./PharmacyResultTemplates/DrugInteractionTemplate";
import { StockUpdateTemplate } from "./PharmacyResultTemplates/StockUpdateTemplate";
import { MedicineInfoTemplate } from "./PharmacyResultTemplates/MedicineInfoTemplate";
import { AlternativesTemplate } from "./PharmacyResultTemplates/AlternativesTemplate";
import { DosageCalculationTemplate } from "./PharmacyResultTemplates/DosageCalculationTemplate";
import { LowStockAlertTemplate } from "./PharmacyResultTemplates/LowStockAlertTemplate";
import type { PharmacyAIState } from "@/types/pharmacyAIEvents";

interface PharmacyAIResultsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pharmacyAIState: PharmacyAIState;
  onClearAll: () => void;
}

export function PharmacyAIResultsOverlay({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  pharmacyAIState,
  onClearAll,
}: PharmacyAIResultsOverlayProps) {
  const [hasNewData, setHasNewData] = useState(false);

  useEffect(() => {
    if (open) {
      setHasNewData(false);
    }
  }, [open]);

  useEffect(() => {
    const hasData = Object.values(pharmacyAIState).some(value => value !== null);
    if (hasData && !open) {
      setHasNewData(true);
    }
  }, [pharmacyAIState, open]);

  const getResultCount = () => {
    return Object.values(pharmacyAIState).filter(value => value !== null).length;
  };

  const tabs = [
    {
      value: "search",
      label: "Search",
      icon: Search,
      data: pharmacyAIState.searchResults,
      component: SearchResultsTemplate,
    },
    {
      value: "interactions",
      label: "Interactions",
      icon: AlertTriangle,
      data: pharmacyAIState.drugInteractions,
      component: DrugInteractionTemplate,
    },
    {
      value: "stock-update",
      label: "Stock Update",
      icon: Package,
      data: pharmacyAIState.stockUpdate,
      component: StockUpdateTemplate,
    },
    {
      value: "medicine-info",
      label: "Medicine Info",
      icon: Info,
      data: pharmacyAIState.medicineInfo,
      component: MedicineInfoTemplate,
    },
    {
      value: "alternatives",
      label: "Alternatives",
      icon: RefreshCw,
      data: pharmacyAIState.alternatives,
      component: AlternativesTemplate,
    },
    {
      value: "dosage",
      label: "Dosage",
      icon: Calculator,
      data: pharmacyAIState.dosageCalculation,
      component: DosageCalculationTemplate,
    },
    {
      value: "low-stock",
      label: "Low Stock",
      icon: ShoppingCart,
      data: pharmacyAIState.lowStockAlert,
      component: LowStockAlertTemplate,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[600px] sm:max-w-[600px] p-0 flex flex-col border-[#e0e3f5] shadow-2xl [&>button]:text-white"
      >
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <SheetTitle className="text-white text-xl font-normal">Pharmacy AI Results</SheetTitle>
              {getResultCount() > 0 && (
                <Badge className="bg-white/20 text-white border-none hover:bg-white/30 text-[11px] font-bold">
                  {getResultCount()} Results
                </Badge>
              )}
            </div>
            <SheetDescription className="text-white/70 font-medium text-[13px]">
              AI-assisted pharmacy operations and clinical recommendations
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 border-b bg-[#fcfdfe]">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent py-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative group h-9 px-4 rounded-[10px] border border-[#e0e3f5] data-[state=active]:border-[#1a2256] data-[state=active]:bg-[#1a2256] data-[state=active]:text-white transition-all text-[12px] font-bold text-[#6e6868] hover:bg-white"
                    disabled={!tab.data}
                  >
                    <Icon className="h-3.5 w-3.5 mr-2" />
                    {tab.label}
                    {tab.data && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-[#64549f] rounded-full border-2 border-white shadow-sm" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 medical-scroll">
            {tabs.map((tab) => {
              const Component = tab.component as any;
              return (
                <TabsContent key={tab.value} value={tab.value} className="mt-0 h-full animate-in fade-in slide-in-from-right-4 duration-300">
                  {tab.data ? (
                    <Component data={tab.data} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-[#fcfdfe] border border-[#e0e3f5] flex items-center justify-center">
                        <tab.icon className="h-10 w-10 text-[#e0e3f5]" />
                      </div>
                      <div>
                        <p className="text-[#1a2256] font-bold text-lg">
                          No {tab.label.toLowerCase()} results
                        </p>
                        <p className="text-[13px] text-[#6e6868] font-medium max-w-[300px] mt-1">
                          Ask the AI assistant for {tab.label.toLowerCase()} information to see recommendations here.
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </div>
        </Tabs>

        <SheetFooter className="px-6 py-4 bg-[#fcfdfe] border-t border-[#f0f3f9] shrink-0">
          <Button
            onClick={() => onOpenChange(false)}
            className="rounded-[12px] h-11 px-8 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-lg shadow-[#1a2256]/20 transition-all active:scale-[0.98] w-full"
          >
            Close AI Results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
