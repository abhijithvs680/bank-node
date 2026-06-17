import { useEffect, useState } from 'react';
import { Bell, CheckCircle, Loader2, Mail, X as XIcon } from 'lucide-react';
import { ReadableAiContent } from '@/components/ReadableAiContent';
import {
  buildNotifyActivityDescription,
  logDealNotifyActivity,
  mapNotifyType,
  type DealEmailRecipient,
  type DealNotifyPendingData,
} from '@/services/dealNoteService';
import { emitNotifyCancelledOutcome, emitNotifySentOutcome } from '@/utils/dealModalVoiceFeedback';

export type { DealNotifyPendingData as DealNotifyModalData };

type NotifyModalState = 'preview' | 'sent' | 'cancelled';

interface DealNotifyModalProps {
  open: boolean;
  dealId: string;
  data: DealNotifyPendingData | null;
  onClose: () => void;
  onSent?: () => void;
  variant?: 'standalone' | 'stacked';
}

export const DealNotifyModal = ({
  open,
  dealId,
  data,
  onClose,
  onSent,
  variant = 'standalone',
}: DealNotifyModalProps) => {
  const [state, setState] = useState<NotifyModalState>('preview');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setState('preview');
      setSending(false);
      setSendError(null);
    }
  }, [open, data?.notify_title]);

  useEffect(() => {
    if (state !== 'sent') return;
    const timer = setTimeout(() => handleClose(), 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    const onModalAction = (e: Event) => {
      const action = (e as CustomEvent).detail?.action;
      if (!open) return;
      if (action === 'send_notify') void handleSend();
      if (action === 'cancel_notify' || action === 'close_all' || action === 'cancel_all') handleCancel();
    };
    document.addEventListener('ai-deal-modal-action', onModalAction);
    return () => document.removeEventListener('ai-deal-modal-action', onModalAction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data, dealId]);

  if (!open || !data) return null;

  const notifyType = mapNotifyType(data.notify_type);
  const recipientSummary =
    data.recipients.length === 1
      ? `${data.recipients[0].name} <${data.recipients[0].email}>`
      : `${data.recipients.length} recipients`;

  const handleSend = async () => {
    if (!dealId) return;
    setSending(true);
    setSendError(null);
    try {
      await logDealNotifyActivity(dealId, {
        event_title: data.notify_title,
        event_type: notifyType,
        description: buildNotifyActivityDescription(data.notify_message, data.recipients),
        reference_id: data.noteReferenceId,
      });
      setState('sent');
      emitNotifySentOutcome(data.notify_title, recipientSummary);
      onSent?.();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Failed to log notification');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    emitNotifyCancelledOutcome(data.notify_title);
    setState('cancelled');
    setSendError(null);
    onClose();
  };

  const handleClose = () => {
    if (state === 'preview') {
      emitNotifyCancelledOutcome(data.notify_title);
    }
    setState('preview');
    setSendError(null);
    onClose();
  };

  const renderRecipient = (recipient: DealEmailRecipient) => (
    <div key={`${recipient.email}-${recipient.name}`} className="flex flex-col gap-0.5">
      <span className="text-slate-700 font-semibold">
        {recipient.name}
        {recipient.role ? ` (${recipient.role})` : ''}
      </span>
      <span className="text-slate-500 font-medium">{recipient.email}</span>
    </div>
  );

  const positionClass =
    variant === 'stacked'
      ? 'relative w-full max-h-[calc((100vh-5rem)/2)] min-h-[220px]'
      : 'fixed right-6 top-6 z-[9999] max-h-[calc(100vh-3rem)]';

  return (
    <div
      className={`${positionClass} w-[400px] bg-white rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-slate-100 transform transition-transform duration-300 animate-in slide-in-from-right duration-300 flex flex-col overflow-hidden`}
    >
      {state === 'preview' && (
        <>
          <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-5">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="w-4 h-4 text-green-600 shrink-0" />
              <h4 className="text-[14px] font-bold text-slate-800 font-['Inter'] truncate">
                {data.notify_title}
              </h4>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors shrink-0"
              aria-label="Close"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-transparent px-5 py-3 space-y-3">
            <div className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                  Email
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Subject
                </span>
                <span className="text-slate-700 font-semibold text-[12px]">{data.email.subject}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  To
                </span>
                <div className="space-y-2">{data.recipients.map(renderRecipient)}</div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Message
              </span>
              <ReadableAiContent text={data.notify_message} compact />
            </div>
          </div>

          <div className="shrink-0 px-5 pb-5 pt-2 border-t border-slate-100 space-y-2">
            {sendError && (
              <p className="text-[11px] text-red-600 font-medium">{sendError}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={sending}
                className="flex-1 rounded-[10px] h-9 border border-slate-200 hover:bg-slate-50 text-[12px] font-bold text-slate-700 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending}
                className="px-5 rounded-[10px] h-9 bg-green-600 hover:bg-green-700 text-white text-[12px] font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Send
              </button>
            </div>
          </div>
        </>
      )}

      {state === 'sent' && (
        <div className="p-5 flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
          <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shadow-sm">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div className="text-center">
            <h4 className="text-[14px] font-bold text-slate-800 font-['Inter']">
              Notification sent successfully
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 font-medium font-['Inter'] px-2">
              {notifyType} logged for {recipientSummary}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
