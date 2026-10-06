export type ToastTone = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  tone: ToastTone;
  message: string;
  durationMs?: number;
  dismissible?: boolean;
}
