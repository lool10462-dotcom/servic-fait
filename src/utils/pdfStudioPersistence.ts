export interface PdfStudioHistoryItem {
  id: string;
  userId?: string;
  toolType: string;
  toolTitle: string;
  originalName: string;
  outputName: string;
  originalSize: number;
  outputSize: number;
  timestamp: string;
  status: 'completed' | 'error';
  elementPreservationSummary?: string;
}

const PDF_STUDIO_HISTORY_KEY = 'cniplc_pdf_studio_history';

export function getPdfStudioHistory(userId?: string): PdfStudioHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = userId ? `${PDF_STUDIO_HISTORY_KEY}_${userId}` : PDF_STUDIO_HISTORY_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load PDF Studio history:', err);
    return [];
  }
}

export function savePdfStudioHistoryItem(item: PdfStudioHistoryItem): void {
  if (typeof window === 'undefined') return;
  try {
    const key = item.userId ? `${PDF_STUDIO_HISTORY_KEY}_${item.userId}` : PDF_STUDIO_HISTORY_KEY;
    const existing = getPdfStudioHistory(item.userId);
    const updated = [item, ...existing.filter(i => i.id !== item.id)].slice(0, 50);
    localStorage.setItem(key, JSON.stringify(updated));
    // Also save to global key for guest fallback
    if (item.userId) {
      const globalList = getPdfStudioHistory();
      const updatedGlobal = [item, ...globalList.filter(i => i.id !== item.id)].slice(0, 50);
      localStorage.setItem(PDF_STUDIO_HISTORY_KEY, JSON.stringify(updatedGlobal));
    }
  } catch (err) {
    console.error('Failed to save PDF Studio history item:', err);
  }
}

export function clearPdfStudioHistory(userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = userId ? `${PDF_STUDIO_HISTORY_KEY}_${userId}` : PDF_STUDIO_HISTORY_KEY;
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Failed to clear PDF Studio history:', err);
  }
}
