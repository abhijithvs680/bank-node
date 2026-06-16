import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill, BedDouble, CalendarCheck, TestTube, MessageCircleHeart,
  Sparkles, LogOut, Lock, Brain, ExternalLink, Activity,
  GraduationCap, Users, HeartPulse, Stethoscope, Microscope,
  ClipboardList, ShieldCheck, Files, Syringe, Thermometer,
  UserPlus, FileText, Phone, MapPin, Info, HelpCircle,
  Search, Dna, Heart, FlaskConical, Clipboard, UserRound,
  Ambulance, Hospital, Landmark, Building2, Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/apiService';
import { TokenUsageIndicator } from '@/components/TokenUsageIndicator';
import DashboardConfigModal from '@/components/DashboardConfigModal';
const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, generateLoginToken } = useAuth();
  const { appName, logoUrl } = useBranding();
  const API_BASE = import.meta.env.VITE_API_BASE;

  const [configLoading, setConfigLoading] = useState(true);
  const [config, setConfig] = useState<any[]>([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [customTiles, setCustomTiles] = useState<any[]>([]);

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const data = await apiService.getDashboardConfig();
      setConfig(data);

      const customTilesItem = data.find(item => item.Key === 'Custom_Tiles');
      const customTilesValue = customTilesItem?.Value || customTilesItem?.status;
      if (customTilesValue) {
        try {
          const parsedTiles = JSON.parse(customTilesValue);
          setCustomTiles(Array.isArray(parsedTiles) ? parsedTiles : []);
        } catch (e) {
          console.error("Failed to parse custom tiles:", e);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard config:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  // Fetch dashboard config on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  // Helper function to check if card is locked
  const isCardLocked = (card: any): boolean => {
    if (configLoading) return true;
    return card.status === '0';
  };
  const mandatoryStaticCards = [
    {
      id: 'GoodDoc - AI',
      key: 'GoodDoc-AI',
      title: 'GoodDoc AI',
      subtitle: 'Guidance & support',
      icon: Sparkles,
      route: '/gooddoc',
      gradient: 'from-orange-500/10 to-yellow-500/10',
      iconColor: 'text-orange-500',
      bgPattern: 'dots',
    },
    {
      id: 'outpatient',
      key: 'Out_Patient',
      title: 'Outpatients',
      subtitle: 'Book & manage visits',
      icon: CalendarCheck,
      route: '/patients',
      gradient: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-500',
      bgPattern: 'waves',
    },
    {
      id: 'in-patient',
      key: 'In_Patient',
      title: 'Inpatients',
      subtitle: 'Admissions, beds, care plan',
      icon: BedDouble,
      route: '/inpatient',
      gradient: 'from-teal-500/10 to-cyan-500/10',
      iconColor: 'text-teal-500',
      bgPattern: 'grid',
    },
    {
      id: 'ai-pharmacy',
      key: 'AI_Pharamacy',
      title: 'AI Pharmacy',
      subtitle: 'Smart e-prescriptions & pickup',
      icon: Pill,
      route: '/pod8',
      gradient: 'from-blue-500/10 to-purple-500/10',
      iconColor: 'text-blue-500',
      bgPattern: 'dots',
    },
  ];

  const iconMap: Record<string, any> = {
    Pill, BedDouble, CalendarCheck, TestTube, MessageCircleHeart,
    Sparkles, Brain, ExternalLink, Activity, GraduationCap,
    Users, HeartPulse, Stethoscope, Microscope, ClipboardList,
    ShieldCheck, Files, Syringe, Thermometer, UserPlus,
    FileText, Phone, MapPin, Info, HelpCircle, Search,
    Dna, Heart, FlaskConical, Clipboard, UserRound, Ambulance,
    Hospital, Landmark, Building2
  };
  // Generate all cards based on API config
  const allCards = [
    ...mandatoryStaticCards.map(staticCard => {
      const apiItem = config.find(item => item.Key === staticCard.key);
      const status = apiItem ? (apiItem.status !== undefined ? apiItem.status : apiItem.Value) : '1';
      return {
        ...staticCard,
        subtitle: apiItem?.description || staticCard.subtitle,
        status: status,
        dynamicUrl: apiItem?.URL,
        openType: apiItem?.openType,
        withToken: apiItem?.withToken,
        iconColor: apiItem?.iconColor || staticCard.iconColor,
        gradient: apiItem?.gradient || staticCard.gradient,
      };
    }),
    ...customTiles.map(tile => ({
      ...tile,
      isCustom: true,
      icon: iconMap[tile.icon] || ExternalLink,
      iconColor: tile.iconColor || 'text-blue-600',
      gradient: tile.gradient || 'from-blue-500/10 to-indigo-500/10',
      bgPattern: 'grid',
      status: tile.status || '1'
    }))
  ];

  const handleCardClick = (card: any, isLocked: boolean) => {
    if (isLocked) return;

    // Use dynamic URL if present
    if (card.dynamicUrl && card.dynamicUrl.trim() !== "") {
      let url = card.dynamicUrl.trim();
      if (!url.startsWith('http')) url = `https://${url}`;

      if (card.withToken === true || card.withToken === '1') {
        const token = localStorage.getItem('jwtToken') || '';
        if (token) {
          const hasQueryParams = url.includes('?');
          const separator = hasQueryParams ? '&' : '?';
          if (url.includes('token=')) {
            url = url.replace(/([\?&])token=[^&]*/g, `$1token=${token}`);
          } else {
            url = `${url}${separator}token=${token}`;
          }
        }
      }

      if (card.openType === 'newtab' || card.openType === '_blank') {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
      return;
    }

    if (card.isCustom) {
      let url = card.route.trim();
      if (!url.startsWith('http') && !url.startsWith('/')) {
        url = `https://${url}`;
      }

      if (card.withToken === true || card.withToken === '1') {
        const token = generateLoginToken();
        if (token) {
          const hasQueryParams = url.includes('?');
          const separator = hasQueryParams ? '&' : '?';
          if (url.includes('token=')) {
            url = url.replace(/([\?&])token=[^&]*/g, `$1token=${token}`);
          } else {
            url = `${url}${separator}token=${token}`;
          }
        }
      }

      if (card.target === '_blank' || card.target === 'newtab') {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
      return;
    }

    const { route, id } = card;
    const base = API_BASE.replace(/\/$/, '').replace(/\/kiosk\/pod\d+$/, '');
    const token = generateLoginToken();
    if (route === '/gooddoc') {
      window.open(`${base}/gooddoc-v2?token=${token}`, '_blank');
      return;
    }
    else if (route === '/ai-pharmacy') {
      window.open(`${base}/kiosk/pod8`, '_blank');
      return;
    }
    else if (route === '/front-desk') {
      window.open('https://op-kiosk.vizru-ras.com/', '_blank');
      return;
    }
    else if (route === '/MHAI') {
      window.open(`${API_BASE}kiosk/pod3`, '_blank');
      return;
    }
    if (id === 'in-patient') {
      navigate('/inpatient');
      return;
    }
    if (id === 'outpatient') {
      navigate('/patients');
      return;
    }
    if (route === '/outpatient' || route === '/councillor') {
      return;
    }
    navigate(route);
  };

  const getUserInitials = () => {
    if (!user?.firstName) return 'U';
    if (!user?.lastName) return user.firstName[0].toUpperCase();
    return (user.firstName[0] + user.lastName[0]).toUpperCase();
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2A6DF1]/20 via-white to-[#14B8A6]/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(42,109,241,0.1),transparent_70%)]" />

      {/* Glass Top Bar */}
      <header className="glass-topbar relative z-10 h-16 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt={`${appName} Logo`}
            style={{ width: '140px' }}
          />
        </div>

        <div className="flex items-center gap-4">
          <TokenUsageIndicator />

          <Avatar className="w-10 h-10 border-2 border-white shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-[#2A6DF1] to-[#14B8A6] text-white font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>

          <Button
            onClick={() => setIsConfigModalOpen(true)}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-[#64748B] hover:text-[#2A6DF1] hover:bg-blue-50"
          >
            <Settings className="w-4 h-4" />
            <span>Config</span>
          </Button>

          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-[#64748B] hover:text-[#0B1220] hover:bg-red-50"
            id="signOutBtn"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 h-[calc(100vh-4rem)] flex flex-col items-center justify-start px-8 pt-16 md:pt-24 pb-12 overflow-y-auto medical-scroll">
        {/* Intro Header */}
        <div className="text-center mb-12 space-y-2">
          <h1 className="text-4xl font-semibold text-[#0B1220] tracking-tight">
            Welcome to {appName}
          </h1>
          <p className="text-base text-[#64748B] font-medium">
            Your Care, Smarter, Faster, Everywhere.
          </p>
        </div>

        {/* Navigation Cards Grid */}
        <div className="w-full max-w-[1400px] px-4 py-4 flex justify-center">
          <div className="flex flex-wrap justify-center gap-6 w-full">
            {allCards.map((card) => {
              const Icon = card.icon;
              const isLocked = isCardLocked(card);

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card, isLocked)}
                  className={`dashboard-card glass-card group relative overflow-hidden rounded-2xl p-6 w-full max-w-[320px] h-[180px] flex flex-col items-start justify-between ${isLocked ? 'locked-card' : 'cursor-pointer'}`}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 ${card.gradient} opacity-50`} />

                  {/* Pattern Background */}
                  <div className="absolute inset-0 opacity-5">
                    {card.bgPattern === 'dots' && (
                      <div className="absolute inset-0" style={{ backgroundSize: '20px 20px' }} />
                    )}
                    {card.bgPattern === 'grid' && (
                      <div className="absolute inset-0" style={{ backgroundSize: '20px 20px' }} />
                    )}
                    {card.bgPattern === 'waves' && (
                      <div className="absolute inset-0" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex-1 flex flex-col justify-center w-full items-center gap-3">
                    {/* Icon */}
                    <div className={`icon-float w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center ${card.iconColor}`}>
                      <Icon className="w-7 h-7" strokeWidth={2} />
                    </div>

                    {/* Text */}
                    <div className="space-y-1 text-center">
                      <h3 className="text-lg font-semibold text-[#0B1220]">{card.title}</h3>
                      <p className="text-sm text-[#64748B] leading-tight line-clamp-2">{card.subtitle}</p>
                    </div>
                  </div>

                  {/* Persistent Lock Icon in top-right corner */}
                  {isLocked && (
                    <div className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-sm rounded-full p-1.5">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Lock Overlay for locked cards on hover */}
                  {isLocked && (
                    <div className="lock-overlay">
                      <Lock className="w-8 h-8 text-white lock-icon-animated" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <DashboardConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigUpdated={fetchConfig}
      />
    </div>
  );
};

export default DashboardPage;
