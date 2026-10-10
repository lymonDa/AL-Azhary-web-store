export type StatusKind =
  | 'order'
  | 'payment'
  | 'service'
  | 'inventory'
  | 'shipping'
  | 'preorder'
  | 'return'
  | 'custom';
export type StatusTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface StatusPresentationMeta {
  labelAr: string;
  labelEn: string;
  tone: StatusTone;
  icon: string;
}
