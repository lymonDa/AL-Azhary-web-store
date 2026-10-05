import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { LocaleService } from './core/i18n/locale.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), LocaleService],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have the default Arabic title and rtl direction', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('مكتبة الأزهري');
    expect(app.currentLocale()).toEqual('ar');
    expect(app.direction()).toEqual('rtl');
  });

  it('should render skip to content link and router-outlet container', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector('.skip-link');
    expect(skipLink?.textContent).toContain('الانتقال إلى المحتوى الرئيسي');
    expect(compiled.querySelector('#main-content')).toBeTruthy();
  });
});
