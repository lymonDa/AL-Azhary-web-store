export type EmailTemplate = 'verify_email' | 'password_reset' | 'order_confirmation' | 'payment_update' | 'service_update';
export type EmailLocale = 'ar' | 'en';
export interface SendEmailInput {
    to: string;
    template: EmailTemplate;
    locale: EmailLocale;
    variables: Record<string, string | number>;
    dedupeKey: string;
}
export interface SendEmailResult {
    providerMessageId?: string;
    delivered: boolean;
}
export interface EmailService {
    send(input: SendEmailInput): Promise<SendEmailResult>;
}
