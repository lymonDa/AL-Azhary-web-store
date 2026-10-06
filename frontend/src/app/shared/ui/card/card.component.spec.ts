import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardContentComponent,
  CardFooterComponent,
} from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CardComponent,
        CardHeaderComponent,
        CardTitleComponent,
        CardContentComponent,
        CardFooterComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the card component', () => {
    expect(component).toBeTruthy();
  });

  it('should apply card variant and md padding by default', () => {
    const card = fixture.nativeElement.querySelector('.az-card');
    expect(card.classList.contains('az-card--card')).toBeTrue();
    expect(card.classList.contains('az-card--padding-md')).toBeTrue();
  });

  it('should apply variant and padding classes properly', () => {
    fixture.componentRef.setInput('variant', 'raised');
    fixture.componentRef.setInput('padding', 'lg');
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.az-card');
    expect(card.classList.contains('az-card--raised')).toBeTrue();
    expect(card.classList.contains('az-card--padding-lg')).toBeTrue();
    expect(card.classList.contains('az-card--interactive')).toBeTrue();
  });
});
