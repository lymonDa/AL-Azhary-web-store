import { EmailTemplate, EmailLocale } from './email.types';
export interface RenderedEmail {
    subject: string;
    text: string;
    html: string;
}
export declare function renderEmailTemplate(template: EmailTemplate, locale: EmailLocale, variables: Record<string, string | number>): RenderedEmail;
