import { JobExecutionLog } from './types';
/**
 * 1. Outbox Lease Recovery Job:
 * Recovers processing outbox events whose lease expired so other workers can process them.
 */
export declare function runLeaseRecoveryJob(now?: Date): Promise<number>;
/**
 * 2. Guest Cart Cleanup Job:
 * Identifies and cleans up abandoned guest carts whose explicit expiresAt timestamp has elapsed.
 * Does not touch user carts or invent retention policies.
 */
export declare function runGuestCartCleanupJob(now?: Date): Promise<number>;
/**
 * 3. Auth Token / Session Audit Job:
 * Inspects user session states and logs anomaly metrics (e.g., active vs suspended users).
 * TTL handles physical token expiry; this reports operational posture.
 */
export declare function runAuthTokenAuditJob(): Promise<{
    totalUsers: number;
    suspendedUsers: number;
}>;
/**
 * 4. Expired Content Deactivation Job:
 * Automatically deactivates content modules whose endsAt date has passed.
 */
export declare function runExpiredContentJob(now?: Date): Promise<number>;
/**
 * 5. Report Health Metrics Job:
 * Summarizes outbox backlog and process health metrics for operational visibility.
 */
export declare function runHealthReportJob(): Promise<Record<string, unknown>>;
export declare class CronScheduler {
    private isRunning;
    private timers;
    private runningJobs;
    private executionLogs;
    private jobs;
    /**
     * Starts all scheduled cron jobs.
     */
    start(): void;
    /**
     * Stops all scheduled cron jobs cleanly.
     */
    stop(): void;
    /**
     * Runs a specific job once by name, preventing overlapping runs of the same job.
     */
    runJob(name: string): Promise<boolean>;
    private logExecution;
    getExecutionLogs(): JobExecutionLog[];
    getIsRunning(): boolean;
    getRegisteredJobs(): string[];
}
export declare const cronScheduler: CronScheduler;
