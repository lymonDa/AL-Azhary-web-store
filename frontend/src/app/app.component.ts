import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocaleService } from './core/i18n/locale.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly localeService = inject(LocaleService);

  readonly title = 'مكتبة الأزهري';
  readonly currentLocale = this.localeService.currentLocale;
  readonly direction = this.localeService.direction;
}
