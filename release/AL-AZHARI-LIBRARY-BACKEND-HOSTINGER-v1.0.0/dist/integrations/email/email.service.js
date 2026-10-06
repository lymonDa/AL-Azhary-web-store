"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.NodemailerEmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../../config");
const email_templates_1 = require("./email.templates");
const AppError_1 = require("../../common/errors/AppError");
const errorCodes_1 = require("../../common/errors/errorCodes");
class NodemailerEmailService {
    transporter = null;
    sentEmails = [];
    constructor() {
        this.initTransporter();
    }
    initTransporter() {
        if (config_1.env.NODE_ENV === 'test') {
            // In test mode, we record sent emails without opening live SMTP connections
            return;
        }
        if (!config_1.env.SMTP_HOST || config_1.env.SMTP_HOST === 'smtp.example.com') {
            config_1.logger.info('SMTP not fully configured; using development stub for email delivery');
            return;
        }
        try {
            this.transporter = nodemailer_1.default.createTransport({
                host: config_1.env.SMTP_HOST,
                port: config_1.env.SMTP_PORT,
                secure: config_1.env.SMTP_SECURE,
                auth: config_1.env.SMTP_USER && config_1.env.SMTP_PASSWORD
                    ? {
                        user: config_1.env.SMTP_USER,
                        pass: config_1.env.SMTP_PASSWORD,
                    }
                    : undefined,
            });
        }
        catch (err) {
            config_1.logger.error({ err }, 'Failed to initialize Nodemailer transporter');
        }
    }
    /**
     * Sanitizes variables to ensure no secrets or sensitive proof URLs are sent.
     */
    sanitizeVariables(variables) {
        const clean = {};
        const forbidden = ['password', 'passwordHash', 'token', 'secret', 'proofUrl', 'secureUrl'];
        for (const [key, val] of Object.entries(variables)) {
            if (forbidden.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
                continue;
            }
            clean[key] = val;
        }
        return clean;
    }
    async send(input) {
        if (!input.to || !input.to.includes('@')) {
            throw new AppError_1.AppError(errorCodes_1.ErrorCodes.VALIDATION_ERROR, 'Invalid recipient email address', 400);
        }
        const cleanVariables = this.sanitizeVariables(input.variables);
        const rendered = (0, email_templates_1.renderEmailTemplate)(input.template, input.locale, cleanVariables);
        // If running in test mode or unconfigured stub
        if (config_1.env.NODE_ENV === 'test' || !this.transporter) {
            this.sentEmails.push({
                ...input,
                variables: cleanVariables,
                subject: rendered.subject,
                sentAt: new Date(),
            });
            config_1.logger.debug({ to: input.to, template: input.template, dedupeKey: input.dedupeKey }, 'Recorded email delivery (test/stub mode)');
            return {
                providerMessageId: `mock-email-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                delivered: true,
            };
        }
        try {
            const info = await this.transporter.sendMail({
                from: config_1.env.EMAIL_FROM,
                to: input.to,
                subject: rendered.subject,
                text: rendered.text,
                html: rendered.html,
                headers: {
                    'X-Dedupe-Key': input.dedupeKey,
                },
            });
            config_1.logger.info({ messageId: info.messageId, to: input.to, template: input.template, dedupeKey: input.dedupeKey }, 'Email sent successfully via SMTP');
            return {
                providerMessageId: info.messageId,
                delivered: true,
            };
        }
        catch (error) {
            config_1.logger.error({ err: error, to: input.to, template: input.template, dedupeKey: input.dedupeKey }, 'SMTP email delivery failed');
            throw new AppError_1.AppError(errorCodes_1.ErrorCodes.EMAIL_DELIVERY_FAILED, 'Email delivery failed', 502, {
                to: input.to,
                template: input.template,
                dedupeKey: input.dedupeKey,
            });
        }
    }
    clearSentEmails() {
        this.sentEmails.length = 0;
    }
}
exports.NodemailerEmailService = NodemailerEmailService;
exports.emailService = new NodemailerEmailService();
//# sourceMappingURL=email.service.js.map