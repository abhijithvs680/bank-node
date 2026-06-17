import { parseReadableAiText } from '@/utils/formatReadableAiText';

interface ReadableAiContentProps {
  text: string;
  className?: string;
  compact?: boolean;
}

export const ReadableAiContent = ({ text, className = '', compact = false }: ReadableAiContentProps) => {
  const parsed = parseReadableAiText(text);

  if (!parsed.items.length && parsed.paragraphs.length <= 1) {
    return (
      <p className={`text-[13px] text-slate-600 leading-relaxed font-['Inter'] ${className}`}>
        {text}
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {parsed.intro && (
        <p className="text-[13px] font-medium text-slate-700 leading-relaxed font-['Inter']">
          {parsed.intro}
        </p>
      )}
      {parsed.paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className="text-[13px] font-medium text-slate-700 leading-relaxed font-['Inter']"
        >
          {paragraph}
        </p>
      ))}
      {parsed.items.length > 0 && (
        <ul className={`space-y-2 ${compact ? '' : 'max-h-[220px] overflow-y-auto scrollbar-transparent pr-1'}`}>
          {parsed.items.map((item, index) => (
            <li
              key={`${item.id ?? item.details}-${index}`}
              className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5"
            >
              {item.id && (
                <p className="text-[11px] font-bold text-[#1a2256] uppercase tracking-wide mb-1">
                  {item.id}
                </p>
              )}
              <p className="text-[12px] text-slate-700 leading-snug font-medium">{item.details}</p>
              {item.status && (
                <p className="text-[11px] text-slate-500 mt-1">
                  <span className="font-semibold text-slate-600">Status:</span> {item.status}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
