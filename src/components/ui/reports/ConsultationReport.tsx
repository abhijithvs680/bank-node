import { 
  Clipboard, 
  FolderOpen, 
  Microscope, 
  Link2, 
  Stethoscope, 
  AlertTriangle, 
  UserCog, 
  FlaskConical, 
  CheckSquare, 
  HelpCircle, 
  CheckCircle2,
  Activity
} from "lucide-react";

interface ConsultationReportProps {
  htmlContent: string;
  patientName?: string;
  doctorName?: string;
  reportDate?: string;
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
}

const sectionConfig: Record<string, { icon: React.ReactNode; gradient: string; borderColor: string }> = {
  "case-summary": {
    icon: <Clipboard className="w-5 h-5" />,
    gradient: "from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/20",
    borderColor: "border-l-violet-500"
  },
  "report-types": {
    icon: <FolderOpen className="w-5 h-5" />,
    gradient: "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20",
    borderColor: "border-l-blue-500"
  },
  "detailed-interpretation": {
    icon: <Microscope className="w-5 h-5" />,
    gradient: "from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20",
    borderColor: "border-l-indigo-500"
  },
  "correlation": {
    icon: <Link2 className="w-5 h-5" />,
    gradient: "from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/20",
    borderColor: "border-l-cyan-500"
  },
  "clinical-impression": {
    icon: <Stethoscope className="w-5 h-5" />,
    gradient: "from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/20",
    borderColor: "border-l-teal-500"
  },
  "risk-assessment": {
    icon: <AlertTriangle className="w-5 h-5" />,
    gradient: "from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20",
    borderColor: "border-l-red-500"
  },
  "recommended-specialty": {
    icon: <UserCog className="w-5 h-5" />,
    gradient: "from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/20",
    borderColor: "border-l-amber-500"
  },
  "investigations": {
    icon: <FlaskConical className="w-5 h-5" />,
    gradient: "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20",
    borderColor: "border-l-orange-500"
  },
  "doctor-actions": {
    icon: <CheckSquare className="w-5 h-5" />,
    gradient: "from-lime-50 to-lime-100 dark:from-lime-950/30 dark:to-lime-900/20",
    borderColor: "border-l-lime-600"
  },
  "missing-info": {
    icon: <HelpCircle className="w-5 h-5" />,
    gradient: "from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/20",
    borderColor: "border-l-gray-400"
  },
  "final-summary": {
    icon: <CheckCircle2 className="w-5 h-5" />,
    gradient: "from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/20",
    borderColor: "border-l-green-500"
  }
};

const defaultConfig = {
  icon: <Activity className="w-5 h-5" />,
  gradient: "from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-700/20",
  borderColor: "border-l-slate-400"
};

function parseHtmlToSections(html: string): ReportSection[] {
  const sections: ReportSection[] = [];
  
  // Create a temporary div to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  // Find all h2 elements and their following divs
  const h2Elements = doc.querySelectorAll("h2");
  
  h2Elements.forEach((h2) => {
    const title = h2.textContent?.trim() || "";
    const nextDiv = h2.nextElementSibling;
    
    if (nextDiv && nextDiv.tagName.toLowerCase() === "div") {
      const id = nextDiv.id || title.toLowerCase().replace(/\s+/g, "-");
      const content = nextDiv.innerHTML || "";
      const config = sectionConfig[id] || defaultConfig;
      
      sections.push({
        id,
        title,
        content,
        icon: config.icon,
        gradient: config.gradient,
        borderColor: config.borderColor
      });
    }
  });
  
  return sections;
}

const ConsultationReport = ({ 
  htmlContent, 
  patientName, 
  doctorName, 
  reportDate 
}: ConsultationReportProps) => {
  const sections = parseHtmlToSections(htmlContent);

  return (
    <div className="w-full space-y-6">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Stethoscope className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Consultation Summary</h1>
            <p className="text-sm text-muted-foreground">Comprehensive Medical Interpretation</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {patientName && (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Patient</span>
              <span className="font-semibold text-foreground">{patientName}</span>
            </div>
          )}
          {doctorName && (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Doctor</span>
              <span className="font-semibold text-foreground">{doctorName}</span>
            </div>
          )}
          {reportDate && (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Report Date</span>
              <span className="font-semibold text-foreground">{reportDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Report Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <article 
            key={section.id}
            className={`rounded-xl p-5 border-l-4 ${section.borderColor} bg-gradient-to-br ${section.gradient} shadow-sm hover:shadow-md transition-shadow`}
          >
            <header className="flex items-center gap-3 mb-3">
              <div className="text-foreground/80">{section.icon}</div>
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            </header>
            <div 
              className="text-base text-foreground/90 leading-relaxed prose prose-sm max-w-none
                         prose-strong:text-foreground prose-p:my-2
                         [&_br]:block [&_br]:my-1"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </article>
        ))}
      </div>

      {/* Empty State */}
      {sections.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No report sections found</p>
        </div>
      )}
    </div>
  );
};

export default ConsultationReport;
