import { EmailService, SendEmailInput, SendEmailResult } from './email.types';
export declare class NodemailerEmailService implements EmailService {
    private transporter;
    readonly sentEmails: Array<SendEmailInput & {
        subject: string;
        sentAt: Date;
    }>;
    constructor();
    private initTransporter;
    /**
     * Sanitizes variables to ensure no secrets or sensitive proof URLs are sent.
     */
    private sanitizeVariables;
    send(input: SendEmailInput): Promise<SendEmailResult>;
    clearSentEmails(): void;
}
export declare const emailService: NodemailerEmailService;
