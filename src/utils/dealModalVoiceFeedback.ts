/** Notifies the voice agent of modal outcomes without expecting a spoken reply. */
export function emitDealModalOutcome(message: string) {
  document.dispatchEvent(
    new CustomEvent('ai-deal-modal-outcome', { detail: { message } })
  );
}

export function emitNoteSavedOutcome(noteTitle: string, noteId?: string) {
  const idPart = noteId ? ` Note ID: ${noteId}.` : '';
  emitDealModalOutcome(
    `The user saved the note "${noteTitle}" to this deal.${idPart} It is now logged in activity.`
  );
}

export function emitNoteCancelledOutcome(noteTitle: string) {
  emitDealModalOutcome(`The user cancelled the note preview "${noteTitle}". It was not saved.`);
}

export function emitNotifySentOutcome(notifyTitle: string, recipientSummary: string) {
  emitDealModalOutcome(
    `The user sent the notification "${notifyTitle}". It has been logged to activity for ${recipientSummary}.`
  );
}

export function emitNotifyCancelledOutcome(notifyTitle: string) {
  emitDealModalOutcome(
    `The user cancelled the notification preview "${notifyTitle}". It was not sent or logged.`
  );
}
