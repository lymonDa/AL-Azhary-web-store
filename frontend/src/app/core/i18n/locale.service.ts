import { Injectable, computed, inject, signal } from '@angular/core';
import { PlatformService } from '../storage/platform.service';
import { SafeStorage } from '../storage/safe-storage';
import { DirectionService, type TextDirection } from './direction.service';

export type AppLocale = 'ar' | 'en';

const LOCALE_STORAGE_KEY = 'al_azhari_locale';

@Injectable({
  providedIn: 'root',
})
export class LocaleService {
  private readonly platform = inject(PlatformService);
  private readonly storage = inject(SafeStorage);
  private readonly directionService = inject(DirectionService);

  private readonly currentLocaleSignal = signal<AppLocale>(this.getInitialLocale());

  readonly currentLocale = this.currentLocaleSignal.asReadonly();
  readonly isArabic = computed(() => this.currentLocale() === 'ar');
  readonly isEnglish = computed(() => this.currentLocale() === 'en');
  readonly direction = this.directionService.direction;

  constructor() {
    this.applyLocale(this.currentLocaleSignal());
  }

  setLocale(locale: AppLocale): void {
    if (locale !== 'ar' && locale !== 'en') {
      return;
    }
    this.currentLocaleSignal.set(locale);
    this.storage.setItem(LOCALE_STORAGE_KEY, locale);
    this.applyLocale(locale);
  }

  private getInitialLocale(): AppLocale {
    const saved = this.storage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') {
      return saved;
    }
    return 'ar';
  }

  private applyLocale(locale: AppLocale): void {
    const dir: TextDirection = locale === 'ar' ? 'rtl' : 'ltr';
    this.directionService.setDirection(dir);

    if (this.platform.isBrowser) {
      this.platform.document.documentElement.setAttribute('lang', locale);
    }
  }
}
