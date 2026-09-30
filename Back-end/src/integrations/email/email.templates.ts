import { EmailTemplate, EmailLocale } from './email.types';

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

function replaceVariables(text: string, variables: Record<string, string | number>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const safeVal = String(value);
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), safeVal);
  }
  return result;
}

export function renderEmailTemplate(
  template: EmailTemplate,
  locale: EmailLocale,
  variables: Record<string, string | number>,
): RenderedEmail {
  switch (template) {
    case 'verify_email': {
      if (locale === 'ar') {
        const subject = 'تفعيل حسابك - مكتبة الأزهري';
        const body = `مرحباً {{name}}،\n\nشكراً لتسجيلك في مكتبة الأزهري. يرجى تأكيد بريدك الإلكتروني عبر الرابط التالي:\n{{verificationUrl}}\n\nإذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة بأمان.`;
        return {
          subject,
          text: replaceVariables(body, variables),
          html: `<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>مرحباً {{name}}،</h2>
            <p>شكراً لتسجيلك في مكتبة الأزهري. يرجى تأكيد بريدك الإلكتروني عبر الرابط أدناه:</p>
            <p><a href="{{verificationUrl}}" style="background: #1e3a8a; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">تأكيد البريد الإلكتروني</a></p>
            <p>إذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة بأمان.</p>
          </div>`
            .replace(/{{name}}/g, String(variables.name ?? ''))
            .replace(/{{verificationUrl}}/g, String(variables.verificationUrl ?? '')),
        };
      } else {
        const subject = 'Verify your account - Al-Azhari Library';
        const body = `Hello {{name}},\n\nThank you for registering at Al-Azhari Library. Please verify your email using the following link:\n{{verificationUrl}}\n\nIf you did not request this, you can safely ignore this email.`;
        return {
          subject,
          text: replaceVariables(body, variables),
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Hello {{name}},</h2>
            <p>Thank you for registering at Al-Azhari Library. Please verify your email using the button below:</p>
            <p><a href="{{verificationUrl}}" style="background: #1e3a8a; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </div>`
            .replace(/{{name}}/g, String(variables.name ?? ''))
            .replace(/{{verificationUrl}}/g, String(variables.verificationUrl ?? '')),
        };
      }
    }

    case 'password_reset': {
      if (locale === 'ar') {
        const subject = 'إعادة تعيين كلمة المرور - مكتبة الأزهري';
        const body = `مرحباً {{name}}،\n\nتلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. يمكنك إعادة تعيينها عبر الرابط التالي:\n{{resetUrl}}\n\nالرابط صالح لفترة محدودة. إذا لم تطلب ذلك، يرجى تجاهل هذه الرسالة.`;
        return {
          subject,
          text: replaceVariables(body, variables),
          html: `<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>مرحباً {{name}}،</h2>
            <p>تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك. انقر على الرابط التالي لإنشاء كلمة مرور جديدة:</p>
            <p><a href="{{resetUrl}}" style="background: #b91c1c; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">إعادة تعيين كلمة المرور</a></p>
            <p>إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة.</p>
          </div>`
            .replace(/{{name}}/g, String(variables.name ?? ''))
            .replace(/{{resetUrl}}/g, String(variables.resetUrl ?? '')),
        };
      } else {
        const subject = 'Password Reset Request - Al-Azhari Library';
        const body = `Hello {{name}},\n\nWe received a request to reset your password. You can reset it using the following link:\n{{resetUrl}}\n\nIf you did not request this, you can safely ignore this email.`;
        return {
          subject,
          text: replaceVariables(body, variables),
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Hello {{name}},</h2>
            <p>We received a request to reset your password. Click the link below to set a new password:</p>
            <p><a href="{{resetUrl}}" style="background: #b91c1c; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </div>`
            .replace(/{{name}}/g, String(variables.name ?? ''))
            .replace(/{{resetUrl}}/g, String(variables.resetUrl ?? '')),
        };
      }
    }

    case 'order_confirmation': {
      if (locale === 'ar') {
        const subject = replaceVariables('تأكيد استلام الطلب {{orderReference}} - مكتبة الأزهري', variables);
        const body = replaceVariables(
          `شكراً لك على طلبك!\n\nرقم الطلب: {{orderReference}}\nالإجمالي: {{totalFormatted}} {{currency}}\n\nسنقوم بمراجعة طلبك وإعلامك بالخطوات التالية فوراً.`,
          variables,
        );
        return {
          subject,
          text: body,
          html: `<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>شكراً لك على طلبك من مكتبة الأزهري!</h2>
            <p><strong>رقم الطلب:</strong> ${variables.orderReference ?? ''}</p>
            <p><strong>الإجمالي:</strong> ${variables.totalFormatted ?? ''} ${variables.currency ?? 'EGP'}</p>
            <p>سنقوم بمراجعة طلبك وإعلامك بالخطوات التالية فوراً.</p>
          </div>`,
        };
      } else {
        const subject = replaceVariables('Order Confirmation {{orderReference}} - Al-Azhari Library', variables);
        const body = replaceVariables(
          `Thank you for your order!\n\nOrder Reference: {{orderReference}}\nTotal: {{totalFormatted}} {{currency}}\n\nWe will review your order and update you with next steps shortly.`,
          variables,
        );
        return {
          subject,
          text: body,
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Thank you for your order from Al-Azhari Library!</h2>
            <p><strong>Order Reference:</strong> ${variables.orderReference ?? ''}</p>
            <p><strong>Total:</strong> ${variables.totalFormatted ?? ''} ${variables.currency ?? 'EGP'}</p>
            <p>We will review your order and update you shortly.</p>
          </div>`,
        };
      }
    }

    case 'payment_update': {
      if (locale === 'ar') {
        const subject = replaceVariables('تحديث حالة الدفع للطلب {{orderReference}}', variables);
        const body = replaceVariables(
          `مرحباً، تم تحديث حالة الدفع لطلبك {{orderReference}} إلى: {{status}}.\n\nملاحظات: {{note}}`,
          variables,
        );
        return {
          subject,
          text: body,
          html: `<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h3>تحديث حالة الدفع</h3>
            <p>تم تحديث حالة الدفع للطلب <strong>${variables.orderReference ?? ''}</strong> إلى: <strong>${variables.status ?? ''}</strong>.</p>
            ${variables.note ? `<p>ملاحظات: ${variables.note}</p>` : ''}
          </div>`,
        };
      } else {
        const subject = replaceVariables('Payment Update for Order {{orderReference}}', variables);
        const body = replaceVariables(
          `Hello, the payment status for order {{orderReference}} has been updated to: {{status}}.\n\nNotes: {{note}}`,
          variables,
        );
        return {
          subject,
          text: body,
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h3>Payment Status Update</h3>
            <p>The payment status for order <strong>${variables.orderReference ?? ''}</strong> is now: <strong>${variables.status ?? ''}</strong>.</p>
            ${variables.note ? `<p>Notes: ${variables.note}</p>` : ''}
          </div>`,
        };
      }
    }

    case 'service_update': {
      if (locale === 'ar') {
        const subject = replaceVariables('تحديث طلب الخدمة {{serviceReference}} - مكتبة الأزهري', variables);
        const body = replaceVariables(
          `تم تحديث طلب الخدمة {{serviceReference}}.\nالحالة: {{status}}.\n{{details}}`,
          variables,
        );
        return {
          subject,
          text: body,
          html: `<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h3>تحديث طلب الخدمة</h3>
            <p>رقم طلب الخدمة: <strong>${variables.serviceReference ?? ''}</strong></p>
            <p>الحالة: <strong>${variables.status ?? ''}</strong></p>
            ${variables.details ? `<p>${variables.details}</p>` : ''}
          </div>`,
        };
      } else {
        const subject = replaceVariables('Service Request Update {{serviceReference}} - Al-Azhari Library', variables);
        const body = replaceVariables(
          `Your service request {{serviceReference}} has been updated.\nStatus: {{status}}.\n{{details}}`,
          variables,
        );
        return {
          subject,
          text: body,
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h3>Service Request Update</h3>
            <p>Service Reference: <strong>${variables.serviceReference ?? ''}</strong></p>
            <p>Status: <strong>${variables.status ?? ''}</strong></p>
            ${variables.details ? `<p>${variables.details}</p>` : ''}
          </div>`,
        };
      }
    }
  }
}
