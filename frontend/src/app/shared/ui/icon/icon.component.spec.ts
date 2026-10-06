import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let component: IconComponent;
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    component.name = 'check';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render SVG for registered icon', () => {
    component.name = 'check';
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('should support accessible label with role="img"', () => {
    component.name = 'check';
    component.ariaLabel = 'تم بنجاح';
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('aria-label')).toBe('تم بنجاح');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    const title = svg.querySelector('title');
    expect(title?.textContent).toBe('تم بنجاح');
  });

  it('should support spin animation', () => {
    component.name = 'spinner';
    component.spin = true;
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.classList.contains('spinning')).toBeTrue();
  });
});
