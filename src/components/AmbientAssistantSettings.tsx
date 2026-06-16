import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Trash2, Settings2, ShieldCheck, CheckSquare, Square, ChevronUp, ChevronDown, GripVertical, FileText, Activity } from "lucide-react";
import {
  DataCaptureCategory,
  AmbientAssistantSettings as SettingsType,
  ReportFieldConfig,
  ReportSectionConfig,
  defaultPrescriptionFields,
  defaultReportSections,
  defaultCategories
} from "@/types/doctorAssistant";
import { nanoid } from 'nanoid';
import { apiService } from '@/services/apiService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reorder, useDragControls } from "framer-motion";

interface AmbientAssistantSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  doctorId?: string;
}

const ReorderSectionItem = ({ 
  section, 
  index, 
  handleToggleSection 
}: { 
  section: ReportSectionConfig; 
  index: number; 
  handleToggleSection: (id: string, enabled: boolean) => void 
}) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={dragControls}
      layout="position"
      whileDrag={{ scale: 1.05, boxShadow: "0px 10px 30px rgba(0,0,0,0.1)", zIndex: 999 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex items-center justify-between py-3 px-4 border border-[#f0f2f9] bg-white hover:border-[#64549f]/30 rounded-[16px] shadow-sm select-none relative group"
    >
      <div className="flex items-center gap-4">
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="cursor-grab active:cursor-grabbing p-2 -ml-2 text-[#64549f]/30 group-hover:text-[#64549f] transition-colors rounded-lg hover:bg-[#64549f]/5"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-[14px] font-bold text-[#1a2256] leading-none">{section.name}</h4>
          <p className="text-[10px] text-[#64549f] font-bold uppercase tracking-wider bg-[#64549f]/5 px-1.5 py-0.5 rounded inline-block mt-1">
            Section {index + 1}
          </p>
        </div>
      </div>
      <Switch
        checked={section.enabled}
        onCheckedChange={(checked) => handleToggleSection(section.id, checked)}
        className="data-[state=checked]:bg-[#1a2256]"
      />
    </Reorder.Item>
  );
};

export const AmbientAssistantSettings: React.FC<AmbientAssistantSettingsProps> = ({
  isOpen,
  onOpenChange,
  settings,
  onSave,
  doctorId
}) => {
  // Defensive check for settings prop
  if (!settings) {
    console.warn("AmbientAssistantSettings: settings prop is missing");
  }

  const [localCategories, setLocalCategories] = useState<DataCaptureCategory[]>(
    Array.isArray(settings?.categories) 
      ? [...settings.categories].sort((a, b) => (a.order || 0) - (b.order || 0)) 
      : []
  );
  const [localPrescriptionConfig, setLocalPrescriptionConfig] = useState<ReportFieldConfig[]>(
    Array.isArray(settings?.prescriptionReportConfig) 
      ? [...settings.prescriptionReportConfig].sort((a, b) => (a.order || 0) - (b.order || 0)) 
      : defaultPrescriptionFields
  );
  const [localSectionConfig, setLocalSectionConfig] = useState<ReportSectionConfig[]>(
    Array.isArray(settings?.reportSections) 
      ? [...settings.reportSections].sort((a, b) => (a.order || 0) - (b.order || 0)) 
      : defaultReportSections
  );

  // Sync local state with settings prop when it changes
  React.useEffect(() => {
    if (!settings || !isOpen) return;

    console.log("AmbientAssistantSettings: Syncing props to state", settings);

    let categories = Array.isArray(settings.categories) ? [...settings.categories] : [];
    
    // Ensure all default categories are present
    defaultCategories.forEach(defaultCat => {
      if (!categories.some(c => c.field === defaultCat.field)) {
        categories.push({ ...defaultCat });
      }
    });

    categories = categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    setLocalCategories(categories);

    let sections = Array.isArray(settings.reportSections) ? [...settings.reportSections] : defaultReportSections;
    sections = sections.sort((a, b) => (a.order || 0) - (b.order || 0));

    let prescriptions = Array.isArray(settings.prescriptionReportConfig) ? [...settings.prescriptionReportConfig] : defaultPrescriptionFields;
    prescriptions = prescriptions.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Consistently merge missing categories into reports so all "Visit Info" show in "Report Config"
    const maxSectionOrder = sections.reduce((max, s) => Math.max(max, s.order || 0), 0);
    const maxPrescriptionOrder = prescriptions.reduce((max, s) => Math.max(max, s.order || 0), 0);

    const missingSections = categories.filter(c => !sections.some(s => s.id === c.field || s.id === c.id));
    if (missingSections.length > 0) {
      sections = [...sections, ...missingSections.map((c, i) => ({
        id: c.field,
        name: c.name,
        enabled: true,
        order: maxSectionOrder + i + 1
      }))];
    }

    setLocalSectionConfig(sections);
    setLocalPrescriptionConfig(prescriptions);
  }, [isOpen]); // Only sync when the dialog opens to avoid infinite loops during parent's re-render
  const [activeTab, setActiveTab] = useState('capture');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const newCategoryRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isAddingNew) {
      // Small delay to ensure the DOM has updated and element is rendered
      const timer = setTimeout(() => {
        newCategoryRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAddingNew]);


  const handleToggle = (id: string, enabled: boolean) => {
    const updatedCategories = localCategories.map(cat =>
      cat.id === id ? { ...cat, enabled } : cat
    );
    setLocalCategories(updatedCategories);
  };

  const handleDeleteCategory = (id: string) => {
    const categoryToDelete = localCategories.find(c => c.id === id);
    setLocalCategories(prev => prev.filter(cat => cat.id !== id));
    
    if (categoryToDelete) {
      setLocalSectionConfig(prev => prev.filter(section => section.id !== categoryToDelete.field && section.id !== categoryToDelete.id));
    }
  };

  const handleEnableAll = () => {
    setLocalCategories(prev => prev.map(cat => ({ ...cat, enabled: true })));
  };

  const handleDisableAll = () => {
    setLocalCategories(prev => prev.map(cat => ({ ...cat, enabled: false })));
  };

  const handleEnableAllSections = () => {
    setLocalSectionConfig(prev => prev.map(section => ({ ...section, enabled: true })));
  };

  const handleDisableAllSections = () => {
    setLocalSectionConfig(prev => prev.map(section => ({ ...section, enabled: false })));
  };

  const handleAddNew = () => {
    try {
      if (!newCategory.name.trim()) return;

      console.log("AmbientAssistantSettings: handleAddNew started", newCategory);

      // Safe ID generation with fallback
      const generateId = () => {
        try {
          return nanoid();
        } catch (e) {
          console.warn("nanoid() failed, using fallback:", e);
          return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        }
      };

      const categoryId = generateId();

      const category: DataCaptureCategory = {
        id: categoryId,
        name: newCategory.name,
        description: newCategory.description,
        enabled: true,
        field: 'custom_' + categoryId.slice(0, 5)
      };

      const safeCategories = Array.isArray(localCategories) ? localCategories : [];
      const safeSections = Array.isArray(localSectionConfig) ? localSectionConfig : [];
      const updatedCategories = [...safeCategories, category];
      const updatedSections = [...safeSections, {
        id: category.field,
        name: category.name,
        enabled: true,
        order: safeSections.length
      }];

      console.log("AmbientAssistantSettings: handleAddNew updating state", {
        newCategoryId: categoryId,
        totalCategories: updatedCategories.length
      });

      setLocalCategories(updatedCategories);
      setLocalSectionConfig(updatedSections);
      setNewCategory({ name: '', description: '' });
      setIsAddingNew(false);
    } catch (err) {
      console.error("AmbientAssistantSettings: Fatal error in handleAddNew", err);
      // Ensure the modal doesn't stuck
      setIsAddingNew(false);
    }
  };

  const handleToggleField = (id: string, enabled: boolean) => {
    setLocalPrescriptionConfig(prev => prev.map(field =>
      field.id === id ? { ...field, enabled } : field
    ));
  };

  const handleMoveField = (id: string, direction: 'up' | 'down') => {
    setLocalPrescriptionConfig(prev => {
      const index = prev.findIndex(f => f.id === id);
      if (index === -1) return prev;

      const newConfig = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newConfig.length) return prev;

      // Swap items
      [newConfig[index], newConfig[targetIndex]] = [newConfig[targetIndex], newConfig[index]];

      // Update order property
      return newConfig.map((item, i) => ({ ...item, order: i }));
    });
  };

  const handleReorder = (newOrder: ReportFieldConfig[]) => {
    const updated = newOrder.map((item, i) => ({ ...item, order: i }));
    setLocalPrescriptionConfig(updated);
  };

  const handleReorderCategories = (newOrder: DataCaptureCategory[]) => {
    const updated = newOrder.map((item, i) => ({ ...item, order: i }));
    setLocalCategories(updated);
  };

  const handleToggleSection = (id: string, enabled: boolean) => {
    setLocalSectionConfig(prev => prev.map(section =>
      section.id === id ? { ...section, enabled } : section
    ));
  };

  const handleReorderSections = (newOrder: ReportSectionConfig[]) => {
    const updated = newOrder.map((item, i) => ({ ...item, order: i }));
    setLocalSectionConfig(updated);
  };

  const handleSave = () => {
    try {
      console.log("AmbientAssistantSettings: Triggering onSave", {
        categories: localCategories,
        prescriptionReportConfig: localPrescriptionConfig,
        reportSections: localSectionConfig
      });

      onSave({
        categories: localCategories,
        prescriptionReportConfig: localPrescriptionConfig,
        reportSections: localSectionConfig
      });

      onOpenChange(false);
    } catch (err) {
      console.error("AmbientAssistantSettings: Fatal error in handleSave", err);
      // We don't crash the whole UI if possible
      onOpenChange(false);
    }
  };

  const enabledCount = Array.isArray(localCategories)
    ? localCategories.filter(c => c && c.enabled).length
    : 0;

  const enabledSectionCount = Array.isArray(localSectionConfig)
    ? localSectionConfig.filter(s => s && s.enabled).length
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-[24px] z-[300]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <DialogHeader className="p-6 pb-2 bg-white relative">
            <div className="flex flex-col gap-2">
              <div>
                <DialogTitle className="text-[22px] font-bold text-[#1a2256] mb-1">Assistant Settings</DialogTitle>
                <DialogDescription className="text-[14px] text-[#6e6868]">
                  Configure clinical data extraction and report generation
                </DialogDescription>
              </div>
              <TabsList className="bg-[#f0f2f9] p-1 h-10 rounded-xl w-fit">
                <TabsTrigger value="capture" className="rounded-lg px-8 text-[13px] font-bold data-[state=active]:bg-white data-[state=active]:text-[#64549f] data-[state=active]:shadow-sm h-8">
                  <Activity className="w-3.5 h-3.5 mr-2" />
                  Data Capture
                </TabsTrigger>
                <TabsTrigger value="report" className="rounded-lg px-8 text-[13px] font-bold data-[state=active]:bg-white data-[state=active]:text-[#64549f] data-[state=active]:shadow-sm h-8">
                  <FileText className="w-3.5 h-3.5 mr-2" />
                  Report Config
                </TabsTrigger>
              </TabsList>
            </div>
          </DialogHeader>

          <TabsContent value="capture" className="mt-0 outline-none">
            <ScrollArea className="h-[480px] px-6 py-2 bg-white medical-scroll custom-scrollbar-always">
              <div className="flex justify-end mb-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingNew(true)}
                  className="border-[#64549f]/20 text-[#64549f] hover:bg-[#64549f]/5 rounded-xl h-8 px-3 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-[12px] font-bold">Add Category</span>
                </Button>
              </div>
              <div className="space-y-1">
                {localCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between py-4 border-b border-[#f0f2f9] last:border-0 group hover:bg-[#fcfdfe] px-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1 pr-4">
                      <h4 className="text-[15px] font-bold text-[#1a2256] leading-none">{cat.name}</h4>
                      <p className="text-[13px] text-[#6e6868] font-medium leading-tight">
                        {cat.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {cat.field?.startsWith('custom_') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="h-8 w-8 text-red-500/70 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Switch
                        checked={cat.enabled}
                        onCheckedChange={(checked) => handleToggle(cat.id, checked)}
                        className="data-[state=checked]:bg-[#1a2256]"
                      />
                    </div>
                  </div>
                ))}

                {isAddingNew && (
                  <div
                    ref={newCategoryRef}
                    className="mt-4 p-4 bg-[#f8f9ff] rounded-[16px] border border-[#64549f]/10 animate-in fade-in slide-in-from-top-2 duration-300"
                  >

                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[15px] font-bold text-[#64549f]">New Category</h4>
                      <Button variant="ghost" size="icon" onClick={() => setIsAddingNew(false)} className="h-8 w-8 text-[#64549f]/40 hover:text-[#64549f]">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#1a2256]">Category Name</label>
                        <Textarea
                          placeholder="e.g., Surgical History"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          className="min-h-[40px] rounded-xl border-[#e0e3f5] focus:border-[#64549f] text-[14px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#1a2256]">Description</label>
                        <Textarea
                          placeholder="Identify Any past surgeries mentioned"
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          className="min-h-[60px] rounded-xl border-[#e0e3f5] focus:border-[#64549f] text-[14px]"
                        />
                      </div>
                      <Button
                        onClick={handleAddNew}
                        disabled={!newCategory.name.trim()}
                        className="w-full bg-[#64549f] hover:bg-[#52448a] text-white rounded-xl h-10 font-bold"
                      >
                        Save Category
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="report" className="mt-0 outline-none">
            <div className="max-h-[480px] overflow-y-auto px-6 py-4 bg-white medical-scroll custom-scrollbar-always">
              <div className="mb-4">
                <h3 className="text-[15px] font-bold text-[#1a2256] mb-1">Report Section Sequence</h3>
                <p className="text-[12px] text-[#6e6868]">Determine the top-to-bottom order of your clinical record</p>
              </div>

              <Reorder.Group
                axis="y"
                values={localSectionConfig}
                onReorder={handleReorderSections}
                className="space-y-3 pb-8"
              >
                {localSectionConfig.map((section, index) => (
                  <ReorderSectionItem 
                    key={section.id} 
                    section={section} 
                    index={index} 
                    handleToggleSection={handleToggleSection} 
                  />
                ))}
              </Reorder.Group>
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-6 bg-[#f8f9ff] border-t border-[#f0f2f9] flex items-center justify-between">
          <div className="text-[13px] font-medium text-[#6e6868]">
            {activeTab === 'capture' 
              ? `${enabledCount} of ${localCategories.length} categories enabled`
              : `${enabledSectionCount} of ${localSectionConfig.length} sections enabled`
            }
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={activeTab === 'capture' ? handleDisableAll : handleDisableAllSections}
              className="text-[13px] font-bold text-[#64549f] hover:text-[#52448a] transition-colors"
            >
              Disable All
            </button>
            <button
              onClick={activeTab === 'capture' ? handleEnableAll : handleEnableAllSections}
              className="text-[13px] font-bold text-[#64549f] hover:text-[#52448a] transition-colors"
            >
              Enable All
            </button>
            <Button
              onClick={handleSave}
              className="bg-[#1a2256] hover:bg-[#11163a] text-white rounded-xl px-8 h-10 font-bold shadow-lg shadow-blue-900/10 active:scale-95 transition-all"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
