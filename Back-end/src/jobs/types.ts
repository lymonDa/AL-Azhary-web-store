import { IOutboxEventDocument } from '../modules/notifications/models/outbox-event.model';

export interface OutboxWorkerOptions {
  pollIntervalMs?: number;
  maxAttempts?: number;
  batchSize?: number;
  concurrency?: number;
  leaseDurationMs?: number;
  shutdownTimeoutMs?: number;
  workerId?: string;
}

export interface RetryPolicyOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
}

export interface DispatchResult {
  delivered: boolean;
  channelResults?: {
    email?: { sent: boolean; messageId?: string; error?: string };
    realtime?: { emitted: boolean; rooms?: string[] };
  };
}

export type OutboxHandler = (event: IOutboxEventDocument) => Promise<DispatchResult>;

export interface ScheduledJob {
  name: string;
  intervalMs: number;
  runOnStart?: boolean;
  execute: () => Promise<void>;
}

export interface JobExecutionLog {
  jobName: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  success: boolean;
  error?: string;
}
