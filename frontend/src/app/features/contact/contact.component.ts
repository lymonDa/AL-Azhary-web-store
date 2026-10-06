import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppConfigStore } from '../../core/config/app-config.store';
import { LocaleService } from '../../core/i18n/locale.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="az-contact-page">
      <header class="az-contact-page__header">
        <h1 class="az-contact-page__title">
          {{ isArabic() ? 'تواصل معنا' : 'Contact Us' }}
        </h1>
        <p class="az-contact-page__subtitle">
          {{
            isArabic()
              ? 'يسعدنا الرد على استفساراتكم بخصوص الكتب الأزهرية والمناهج الدراسية وطلبات التوصيل'
              : 'We are glad to assist you with inquiries regarding textbooks, orders, and delivery'
          }}
        </p>
      </header>

      <div class="az-contact-cards-grid">
        <!-- WHATSAPP CARD -->
        @if (whatsappUrl()) {
          <div class="az-contact-card az-contact-card--whatsapp">
            <span class="az-contact-card__icon" aria-hidden="true">💬</span>
            <h2 class="az-contact-card__title">
              {{ isArabic() ? 'المحادثة الفورية (واتساب)' : 'WhatsApp Chat' }}
            </h2>
            <p class="az-contact-card__detail" dir="ltr">
              {{ contact().whatsappNumber }}
            </p>
            <p class="az-contact-card__hint">
              {{ isArabic() ? 'أسرع وسيلة للتواصل المباشر مع خدمة العملاء' : 'Fastest channel to reach our customer support' }}
            </p>
            <a
              [href]="whatsappUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="az-contact-card__action az-contact-card__action--whatsapp"
            >
              {{ isArabic() ? 'فتح المحادثة الآن' : 'Start WhatsApp Chat' }}
            </a>
          </div>
        }

        <!-- PHONE CARD -->
        @if (contact().phone) {
          <div class="az-contact-card">
            <span class="az-contact-card__icon" aria-hidden="true">📞</span>
            <h2 class="az-contact-card__title">
              {{ isArabic() ? 'الاتصال الهاتفي' : 'Phone Call' }}
            </h2>
            <p class="az-contact-card__detail" dir="ltr">
              {{ contact().phone }}
            </p>
            <p class="az-contact-card__hint">
              {{ isArabic() ? 'متاح طوال ساعات العمل الرسمية' : 'Available during official business hours' }}
            </p>
            <a
              [href]="'tel:' + contact().phone"
              class="az-contact-card__action"
            >
              {{ isArabic() ? 'اتصال هاتفي' : 'Call Now' }}
            </a>
          </div>
        }

        <!-- EMAIL CARD -->
        @if (contact().email) {
          <div class="az-contact-card">
            <span class="az-contact-card__icon" aria-hidden="true">✉️</span>
            <h2 class="az-contact-card__title">
              {{ isArabic() ? 'البريد الإلكتروني' : 'Email Address' }}
            </h2>
            <p class="az-contact-card__detail" dir="ltr">
              {{ contact().email }}
            </p>
            <p class="az-contact-card__hint">
              {{ isArabic() ? 'للاستفسارات الرسمية والتعاون' : 'For formal inquiries and partnerships' }}
            </p>
            <a
              [href]="'mailto:' + contact().email"
              class="az-contact-card__action"
            >
              {{ isArabic() ? 'إرسال بريد' : 'Send Email' }}
            </a>
          </div>
        }

        <!-- ADDRESS & HOURS CARD -->
        <div class="az-contact-card">
          <span class="az-contact-card__icon" aria-hidden="true">📍</span>
          <h2 class="az-contact-card__title">
            {{ isArabic() ? 'المقر وساعات العمل' : 'Location & Hours' }}
          </h2>
          @if (addressText()) {
            <p class="az-contact-card__detail">
              {{ addressText() }}
            </p>
          }
          @if (businessHoursText()) {
            <p class="az-contact-card__hint">
              🕒 {{ businessHoursText() }}
            </p>
          }
          @if (serviceabilityText()) {
            <p class="az-contact-card__service-note">
              🚚 {{ serviceabilityText() }}
            </p>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  protected readonly configStore = inject(AppConfigStore);
  protected readonly localeService = inject(LocaleService);

  protected readonly contact = this.configStore.contact;

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }

  protected addressText(): string | null {
    const addr = this.contact().address;
    if (!addr) return null;
    return this.isArabic() ? addr.ar : addr.en || addr.ar;
  }

  protected businessHoursText(): string | null {
    const hours = this.configStore.config().businessHours;
    if (!hours) return null;
    return this.isArabic() ? hours.ar : hours.en || hours.ar;
  }

  protected serviceabilityText(): string | null {
    const copy = this.configStore.config().serviceabilityCopy;
    if (!copy) return null;
    return this.isArabic() ? copy.ar : copy.en || copy.ar;
  }

  protected whatsappUrl(): string | null {
    const rawNumber = this.contact().whatsappNumber;
    if (!rawNumber) return null;
    const sanitized = rawNumber.replace(/[^0-9]/g, '');
    return sanitized ? `https://wa.me/${sanitized}` : null;
  }
}
