import { Clock, X as XIcon } from 'lucide-react';

interface VoiceIdleModalProps {
  open: boolean;
  onClose: () => void;
}

export const VoiceIdleModal = ({ open, onClose }: VoiceIdleModalProps) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-[10000] animate-in fade-in duration-300" />
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800 font-['Inter']">
                    Hands-free mode paused
                  </h4>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    No activity for 5 minutes
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors shrink-0"
                aria-label="Close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[13px] text-slate-600 leading-relaxed">
              The voice assistant has been set to idle to save resources. Tap Hands-Free Mode again
              when you are ready to continue.
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#1a2256] hover:bg-[#1a2256]/90 text-white rounded-lg text-[13px] font-bold transition-all active:scale-[0.98]"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
