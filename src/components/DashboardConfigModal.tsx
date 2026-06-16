import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiService, DashboardConfigItem } from "@/services/apiService";
import { authService } from "@/services/authService";
import {
  Loader2, Settings2, Activity, Plus, Trash2, ExternalLink,
  Pill, BedDouble, CalendarCheck, TestTube, MessageCircleHeart,
  Sparkles, Brain, GraduationCap, Users, HeartPulse,
  Stethoscope, Microscope, ClipboardList, ShieldCheck,
  Files, Syringe, Thermometer, UserPlus, FileText,
  Phone, MapPin, Info, HelpCircle, Search,
  Dna, Heart, FlaskConical, Clipboard, UserRound,
  Ambulance, Hospital, Landmark, Building2
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface DashboardConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

const DashboardConfigModal: React.FC<DashboardConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const [config, setConfig] = useState<DashboardConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('modules');
  const [editingTileId, setEditingTileId] = useState<string | null>(null);
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);

  // State for new tile form
  const [newTile, setNewTile] = useState({
    name: '',
    description: '',
    url: '',
    target: 'newtab' as 'samepage' | 'newtab',
    icon: 'ExternalLink',
    iconColor: 'text-blue-500',
    gradient: 'from-blue-500/10 to-indigo-500/10',
    withToken: false
  });

  const COLOR_OPTIONS = [
    { name: 'Blue', color: 'text-blue-500', gradient: 'from-blue-500/10 to-indigo-500/10', bg: 'bg-blue-500' },
    { name: 'Green', color: 'text-green-500', gradient: 'from-green-500/10 to-emerald-500/10', bg: 'bg-green-500' },
    { name: 'Teal', color: 'text-teal-500', gradient: 'from-teal-500/10 to-cyan-500/10', bg: 'bg-teal-500' },
    { name: 'Orange', color: 'text-orange-500', gradient: 'from-orange-500/10 to-yellow-500/10', bg: 'bg-orange-500' },
    { name: 'Pink', color: 'text-pink-500', gradient: 'from-pink-500/10 to-rose-500/10', bg: 'bg-pink-500' },
    { name: 'Purple', color: 'text-purple-500', gradient: 'from-purple-500/10 to-indigo-500/10', bg: 'bg-purple-500' },
    { name: 'Slate', color: 'text-slate-500', gradient: 'from-slate-500/10 to-slate-600/10', bg: 'bg-slate-500' },
  ];

  const ICON_OPTIONS = [
    { name: 'ExternalLink', icon: ExternalLink },
    { name: 'Activity', icon: Activity },
    { name: 'Pill', icon: Pill },
    { name: 'BedDouble', icon: BedDouble },
    { name: 'CalendarCheck', icon: CalendarCheck },
    { name: 'TestTube', icon: TestTube },
    { name: 'FlaskConical', icon: FlaskConical },
    { name: 'MessageCircleHeart', icon: MessageCircleHeart },
    { name: 'Sparkles', icon: Sparkles },
    { name: 'Brain', icon: Brain },
    { name: 'Dna', icon: Dna },
    { name: 'Heart', icon: Heart },
    { name: 'HeartPulse', icon: HeartPulse },
    { name: 'Stethoscope', icon: Stethoscope },
    { name: 'Microscope', icon: Microscope },
    { name: 'ClipboardList', icon: ClipboardList },
    { name: 'Clipboard', icon: Clipboard },
    { name: 'ShieldCheck', icon: ShieldCheck },
    { name: 'Syringe', icon: Syringe },
    { name: 'Thermometer', icon: Thermometer },
    { name: 'UserPlus', icon: UserPlus },
    { name: 'UserRound', icon: UserRound },
    { name: 'Users', icon: Users },
    { name: 'FileText', icon: FileText },
    { name: 'Files', icon: Files },
    { name: 'Phone', icon: Phone },
    { name: 'Search', icon: Search },
    { name: 'Ambulance', icon: Ambulance },
    { name: 'Hospital', icon: Hospital },
    { name: 'Landmark', icon: Landmark },
    { name: 'Building2', icon: Building2 },
    { name: 'GraduationCap', icon: GraduationCap },
    { name: 'MapPin', icon: MapPin },
    { name: 'Info', icon: Info },
    { name: 'HelpCircle', icon: HelpCircle },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      setEditingTileId(null);
      setEditingItemKey(null);
      setNewTile({
        name: '',
        description: '',
        url: '',
        target: 'newtab',
        icon: 'ExternalLink',
        iconColor: 'text-blue-500',
        gradient: 'from-blue-500/10 to-indigo-500/10',
        withToken: false
      });
      setActiveTab('modules');
    }
  }, [isOpen]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'modules') {
      setEditingTileId(null);
      setEditingItemKey(null);
      setNewTile({
        name: '',
        description: '',
        url: '',
        target: 'newtab',
        icon: 'ExternalLink',
        iconColor: 'text-blue-500',
        gradient: 'from-blue-500/10 to-indigo-500/10',
        withToken: false
      });
    }
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDashboardConfig();
      setConfig(data);
    } catch (error) {
      console.error("Failed to fetch config:", error);
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string, enabled: boolean) => {
    // Logic: 1 = UNLOCK (enabled), 0 = LOCK (disabled)
    const newValue = enabled ? '1' : '0';
    setConfig((prev) =>
      prev.map((item) => {
        if (item.Key === key) {
          if (item.status !== undefined) {
            return { ...item, status: newValue };
          }
          return { ...item, Value: newValue };
        }
        return item;
      })
    );
  };

  const handleEnableAll = () => {
    setConfig(prev => prev.map(item => {
      if (item.Key === 'Custom_Tiles') {
        try {
          const tiles = JSON.parse(item.Value || item.status || '[]');
          const updatedTiles = tiles.map((t: any) => ({ ...t, status: '1' }));
          return { ...item, Value: JSON.stringify(updatedTiles) };
        } catch (e) { return item; }
      }
      if (["LogoPath", "Name"].includes(item.Key)) return item;
      if (item.status !== undefined) return { ...item, status: '1' };
      return { ...item, Value: '1' };
    }));
  };

  const handleDisableAll = () => {
    setConfig(prev => prev.map(item => {
      if (item.Key === 'Custom_Tiles') {
        try {
          const tiles = JSON.parse(item.Value || item.status || '[]');
          const updatedTiles = tiles.map((t: any) => ({ ...t, status: '0' }));
          return { ...item, Value: JSON.stringify(updatedTiles) };
        } catch (e) { return item; }
      }
      if (["LogoPath", "Name"].includes(item.Key)) return item;
      if (item.status !== undefined) return { ...item, status: '0' };
      return { ...item, Value: '0' };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await apiService.updateDashboardConfig(config);
      if (success) {
        toast.success("Configuration updated successfully");
        onConfigUpdated();
        onClose();
      } else {
        toast.error("Failed to update configuration");
      }
    } catch (error) {
      console.error("Failed to save config:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const editableItems = config
    .filter((item) => item.Key && !["LogoPath", "Name", "Custom_Tiles"].includes(item.Key))
    .sort((a, b) => {
      const order = ["GoodDoc-AI", "Out_Patient", "In_Patient", "AI_Pharamacy"];
      const indexA = order.indexOf(a.Key);
      const indexB = order.indexOf(b.Key);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });

  const customTilesItem = config.find(item => item.Key === 'Custom_Tiles');
  const customTiles = customTilesItem ? JSON.parse(customTilesItem.Value || customTilesItem.status || '[]') : [];

  const updateField = (field: string, value: any) => {
    setNewTile(prev => {
      const updated = { ...prev, [field]: value };

      if (editingTileId) {
        const updatedCustomTiles = customTiles.map((t: any) =>
          t.id === editingTileId
            ? { ...t, title: updated.name, subtitle: updated.description, route: updated.url, target: updated.target === 'newtab' ? '_blank' : '_self', icon: updated.icon, iconColor: updated.iconColor, gradient: updated.gradient, withToken: updated.withToken }
            : t
        );
        setConfig(prevConfig => prevConfig.map(item => item.Key === 'Custom_Tiles' ? { ...item, Value: JSON.stringify(updatedCustomTiles) } : item));
      } else if (editingItemKey) {
        setConfig(prevConfig => prevConfig.map(item =>
          item.Key === editingItemKey
            ? { ...item, Key: updated.name, description: updated.description, URL: updated.url, openType: updated.target, icon: updated.icon, iconColor: updated.iconColor, gradient: updated.gradient, withToken: updated.withToken }
            : item
        ));
      }

      return updated;
    });
  };

  const handleSaveForm = async () => {
    if (editingTileId || editingItemKey) {
      await handleSave();
    } else {
      if (!newTile.name || !newTile.url) {
        toast.error("Name and URL are required");
        return;
      }

      const newTileEntry = {
        id: `custom-${Date.now()}`,
        title: newTile.name,
        subtitle: newTile.description,
        route: newTile.url,
        target: newTile.target === 'newtab' ? '_blank' : '_self', // Map internal routing to browser standard
        icon: newTile.icon || 'ExternalLink',
        gradient: newTile.gradient || 'from-slate-500/10 to-slate-600/10',
        iconColor: newTile.iconColor || 'text-slate-500',
        bgPattern: 'dots',
        status: '1',
        withToken: newTile.withToken
      };

      const updatedCustomTiles = [...customTiles, newTileEntry];

      const updatedConfig = config.map(item => {
        if (item.Key === 'Custom_Tiles') {
          return { ...item, Value: JSON.stringify(updatedCustomTiles) };
        }
        return item;
      });

      const hasCustomTiles = config.some(item => item.Key === 'Custom_Tiles');
      const finalConfig = hasCustomTiles ? updatedConfig : [...config, { Key: 'Custom_Tiles', Value: JSON.stringify(updatedCustomTiles) }];

      setSaving(true);
      try {
        const success = await apiService.updateDashboardConfig(finalConfig);
        if (success) {
          toast.success("Configuration updated successfully");
          onConfigUpdated();
          onClose();
        } else {
          toast.error("Failed to update configuration");
        }
      } catch (error) {
        console.error("Failed to save config:", error);
        toast.error("An error occurred while saving");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleEditTile = (tile: any) => {
    setEditingTileId(tile.id);
    setEditingItemKey(null);
    setNewTile({
      name: tile.title,
      description: tile.subtitle || '',
      url: tile.route,
      target: (tile.target === '_blank' || tile.target === 'newtab') ? 'newtab' : 'samepage',
      icon: tile.icon || 'ExternalLink',
      iconColor: tile.iconColor || 'text-blue-500',
      gradient: tile.gradient || 'from-blue-500/10 to-indigo-500/10',
      withToken: tile.withToken === true || tile.withToken === '1'
    });
    setActiveTab('add');
  };

  const handleEditCoreModule = (item: any) => {
    setEditingItemKey(item.Key);
    setEditingTileId(null);
    setNewTile({
      name: item.Key,
      description: item.description || '',
      url: item.URL || '',
      target: (item.openType === 'newtab' || item.openType === '_blank') ? 'newtab' : 'samepage',
      icon: item.icon || 'Sparkles',
      iconColor: item.iconColor || 'text-blue-500',
      gradient: item.gradient || 'from-blue-500/10 to-indigo-500/10',
      withToken: item.withToken === true || item.withToken === '1'
    });
    setActiveTab('add');
  };

  const handleDeleteCoreModule = (key: string) => {
    setConfig(prev => prev.filter(item => item.Key !== key));
    toast.success("Module removed from list. Remember to save changes.");
  };

  const handleToggleTile = (id: string, enabled: boolean) => {
    const updatedCustomTiles = customTiles.map((t: any) =>
      t.id === id ? { ...t, status: enabled ? '1' : '0' } : t
    );
    setConfig(prev => prev.map(item => item.Key === 'Custom_Tiles' ? { ...item, Value: JSON.stringify(updatedCustomTiles) } : item));
    toast.success("Tile status updated. Remember to save changes.");
  };

  const handleDeleteTile = (id: string) => {
    const updatedCustomTiles = customTiles.filter((t: any) => t.id !== id);
    setConfig(prev => prev.map(item => item.Key === 'Custom_Tiles' ? { ...item, Value: JSON.stringify(updatedCustomTiles) } : item));
    toast.success("Tile removed. Remember to save changes.");
  };

  const enabledCount = editableItems.filter(item => (item.status !== undefined ? item.status : item.Value) === '1').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-[24px] z-[300]">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <DialogHeader className="p-6 pb-2 bg-white relative">
            <div className="flex flex-col gap-4">
              <div>
                <DialogTitle className="text-[22px] font-bold text-[#1a2256] mb-1">
                  Dashboard Settings
                </DialogTitle>
                <DialogDescription className="text-[14px] text-[#6e6868]">
                  Configure modules and add custom navigation tiles
                </DialogDescription>
              </div>
              <TabsList className="bg-[#f0f2f9] p-1 h-10 rounded-xl w-fit">
                <TabsTrigger value="modules" className="rounded-lg px-8 text-[13px] font-bold data-[state=active]:bg-white data-[state=active]:text-[#1a2256] data-[state=active]:shadow-sm h-8">
                  <Activity className="w-3.5 h-3.5 mr-2" />
                  Modules
                </TabsTrigger>
                <TabsTrigger value="add" className="rounded-lg px-8 text-[13px] font-bold data-[state=active]:bg-white data-[state=active]:text-[#1a2256] data-[state=active]:shadow-sm h-8">
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  {(editingTileId || editingItemKey) ? 'Edit Section' : 'Add Section'}
                </TabsTrigger>
              </TabsList>
            </div>
          </DialogHeader>

          <TabsContent value="modules" className="mt-0 outline-none">
            <ScrollArea className="h-[540px] px-6 py-2 bg-white medical-scroll custom-scrollbar-always">
              {loading ? (
                <div className="flex justify-center items-center h-full py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1a2256]" />
                </div>
              ) : (
                <div className="space-y-1">
                  {editableItems.length > 0 ? (
                    editableItems.map((item) => (
                      <div
                        key={item.Key}
                        className="flex items-center justify-between py-4 border-b border-[#f0f2f9] last:border-0 group hover:bg-[#fcfdfe] px-2 rounded-xl transition-colors gap-4"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="text-[15px] font-bold text-[#1a2256] leading-none truncate">
                            {(item.Value && item.Value !== '1' && item.Value !== '0' && !item.Value.startsWith('[') && !item.Value.startsWith('"['))
                              ? item.Value
                              : (item.Key || 'Unnamed Module')}
                          </h4>
                          <p className="text-[13px] text-[#6e6868] font-medium leading-tight truncate" title={item.description || 'Toggle visibility for this module'}>
                            {item.description || 'Toggle visibility for this module'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {!["GoodDoc-AI", "Out_Patient", "In_Patient", "AI_Pharamacy"].includes(item.Key || '') && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCoreModule(item)}
                                className="h-8 w-8 text-blue-500/70 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Settings2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCoreModule(item.Key)}
                                className="h-8 w-8 text-red-500/70 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Switch
                            checked={(item.status !== undefined ? item.status : item.Value) === '1'}
                            onCheckedChange={(checked) => handleToggle(item.Key || '', checked)}
                            className="data-[state=checked]:bg-[#1a2256]"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500">No core modules found.</div>
                  )}

                  {/* Custom Tiles List */}
                  {customTiles.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[#f0f2f9]">
                      <h3 className="text-[14px] font-bold text-[#1a2256] mb-4 px-2 uppercase tracking-wider">Custom Tiles</h3>
                      {customTiles.map((tile: any) => (
                        <div
                          key={tile.id}
                          className="flex items-center justify-between py-4 border-b border-[#f0f2f9] last:border-0 group hover:bg-[#fcfdfe] px-2 rounded-xl transition-colors gap-4"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <h4 className="text-[15px] font-bold text-[#1a2256] leading-none truncate">{tile.title}</h4>
                            <p className="text-[13px] text-[#6e6868] font-medium leading-tight truncate" title={tile.subtitle || tile.route}>
                              {tile.subtitle || tile.route}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={tile.status !== '0'}
                              onCheckedChange={(checked) => handleToggleTile(tile.id, checked)}
                              className="data-[state=checked]:bg-[#1a2256] scale-90"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTile(tile)}
                              className="h-8 w-8 text-blue-500/70 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Settings2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTile(tile.id)}
                              className="h-8 w-8 text-red-500/70 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="add" className="mt-0 outline-none">
            <ScrollArea className="h-[540px] px-6 py-6 bg-white medical-scroll custom-scrollbar-always">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tile-name" className="text-[14px] font-bold text-[#1a2256]">Tile Name</Label>
                  <Input
                    id="tile-name"
                    placeholder="e.g. Hospital Portal"
                    value={newTile.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="rounded-xl border-[#e0e3f5] focus:border-[#1a2256]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tile-desc" className="text-[14px] font-bold text-[#1a2256]">Description</Label>
                  <Textarea
                    id="tile-desc"
                    placeholder="Briefly describe what this tile does"
                    value={newTile.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="rounded-xl border-[#e0e3f5] focus:border-[#1a2256] min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tile-url" className="text-[14px] font-bold text-[#1a2256]">Redirect URL</Label>
                  <Input
                    id="tile-url"
                    placeholder="https://example.com"
                    value={newTile.url}
                    onChange={(e) => updateField('url', e.target.value)}
                    className="rounded-xl border-[#e0e3f5] focus:border-[#1a2256]"
                  />
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox
                      id="tile-with-token"
                      checked={newTile.withToken}
                      onCheckedChange={(checked) => updateField('withToken', !!checked)}
                      className="border-[#e0e3f5] data-[state=checked]:bg-[#1a2256] data-[state=checked]:border-[#1a2256] h-4 w-4 rounded"
                    />
                    <Label htmlFor="tile-with-token" className="text-[13px] font-medium text-[#1a2256] cursor-pointer selection:bg-transparent">
                      With Token Parameter
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[14px] font-bold text-[#1a2256]">Open In</Label>
                  <RadioGroup
                    value={newTile.target}
                    onValueChange={(val: any) => updateField('target', val)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 bg-[#f0f2f9]/50 px-4 py-3 rounded-xl border border-[#e0e3f5] flex-1 hover:border-[#1a2256]/30 transition-colors cursor-pointer">
                      <RadioGroupItem value="samepage" id="target-self" className="text-[#1a2256]" />
                      <Label htmlFor="target-self" className="cursor-pointer flex-1 font-medium text-[#1a2256]">Same Tab</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-[#f0f2f9]/50 px-4 py-3 rounded-xl border border-[#e0e3f5] flex-1 hover:border-[#1a2256]/30 transition-colors cursor-pointer">
                      <RadioGroupItem value="newtab" id="target-blank" className="text-[#1a2256]" />
                      <Label htmlFor="target-blank" className="cursor-pointer flex-1 font-medium text-[#1a2256]">New Tab</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[14px] font-bold text-[#1a2256]">Icon & Style</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="rounded-xl border-[#e0e3f5] gap-3 h-12 px-4 hover:border-[#1a2256]/30 transition-all shadow-sm bg-white"
                        >
                          <div className={`p-1.5 rounded-lg ${newTile.gradient.replace('opacity-50', '')} ${newTile.iconColor}`}>
                            {React.createElement(ICON_OPTIONS.find(i => i.name === newTile.icon)?.icon || ExternalLink, { className: "w-5 h-5" })}
                          </div>
                          <span className="font-medium text-[#1a2256]">Customize Icon</span>
                          <Palette className="w-4 h-4 text-[#64748B]" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-4 rounded-[24px] shadow-2xl border-none z-[400]" side="top" align="end">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold text-[#1a2256] px-1">Choose Icon</h4>
                            <div
                              className="h-[180px] overflow-y-auto pr-2 custom-scrollbar-always"
                              onWheel={(e) => e.stopPropagation()}
                            >
                              <div className="grid grid-cols-5 gap-2">
                                {ICON_OPTIONS.map((option) => {
                                  const IconComp = option.icon;
                                  const isSelected = newTile.icon === option.name;
                                  return (
                                    <button
                                      key={option.name}
                                      type="button"
                                      onClick={() => updateField('icon', option.name)}
                                      className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all ${isSelected
                                        ? 'bg-[#1a2256] text-white shadow-md'
                                        : 'bg-slate-50 text-[#64748B] hover:bg-slate-100 border border-slate-100'
                                        }`}
                                      title={option.name}
                                    >
                                      <IconComp className="w-5 h-5" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-sm font-bold text-[#1a2256] px-1">Theme Color</h4>
                            <div className="flex flex-wrap gap-2">
                              {COLOR_OPTIONS.map((option) => {
                                const isSelected = newTile.iconColor === option.color;
                                return (
                                  <button
                                    key={option.name}
                                    type="button"
                                    onClick={() => { updateField('iconColor', option.color); updateField('gradient', option.gradient); }}
                                    className={`h-8 w-8 rounded-full transition-all border-2 ${isSelected ? 'border-[#1a2256] scale-110 shadow-md' : 'border-transparent'
                                      } ${option.bg}`}
                                    title={option.name}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="p-6 bg-[#f8f9ff] border-t border-[#f0f2f9] flex items-center justify-between min-h-[108px]">
          {activeTab === 'modules' ? (
            <>
              <div className="text-[13px] font-medium text-[#6e6868]">
                {enabledCount} of {editableItems.length} modules enabled
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={handleDisableAll}
                  className="text-[13px] font-bold text-[#64549f] hover:text-[#52448a] transition-colors"
                  disabled={loading || saving}
                >
                  Disable All
                </button>
                <button
                  onClick={handleEnableAll}
                  className="text-[13px] font-bold text-[#64549f] hover:text-[#52448a] transition-colors"
                  disabled={loading || saving}
                >
                  Enable All
                </button>
                <Button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="bg-[#1a2256] hover:bg-[#11163a] text-white rounded-xl px-8 h-10 font-bold shadow-lg shadow-blue-900/10 active:scale-95 transition-all"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-[13px] font-medium text-[#6e6868]">
                {editingTileId || editingItemKey ? 'Modify custom module configuration' : 'Create new custom module tile'}
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => handleTabChange('modules')}
                  className="text-[13px] font-bold text-[#64549f] hover:text-[#52448a] transition-colors"
                  disabled={loading || saving}
                >
                  Cancel
                </button>
                <Button
                  onClick={handleSaveForm}
                  disabled={saving || loading}
                  className="bg-[#1a2256] hover:bg-[#11163a] text-white rounded-xl px-8 h-10 font-bold shadow-lg shadow-blue-900/10 active:scale-95 transition-all"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardConfigModal;

