import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent } from './select/select.component';
import { CheckboxComponent } from './checkbox/checkbox.component';
import { RadioComponent, RadioGroupComponent } from './radio/radio.component';
import { SwitchComponent } from './switch/switch.component';
import { QuantityStepperComponent } from './quantity-stepper/quantity-stepper.component';

describe('Form Primitives', () => {
  describe('SelectComponent', () => {
    let component: SelectComponent;
    let fixture: ComponentFixture<SelectComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SelectComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(SelectComponent);
      component = fixture.componentInstance;
      component.options = [
        { value: 'opt1', label: 'الخيار الأول' },
        { value: 'opt2', label: 'الخيار الثاني' },
      ];
      fixture.detectChanges();
    });

    it('should create and render options', () => {
      const select = fixture.nativeElement.querySelector('select');
      expect(select).toBeTruthy();
      expect(select.querySelectorAll('option').length).toBe(2);
    });

    it('should update value on select change', () => {
      let emitted: string | number = '';
      component.valueChange.subscribe((val) => {
        emitted = val;
      });

      const select = fixture.nativeElement.querySelector('select');
      select.value = 'opt1';
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.value).toBe('opt1');
      expect(emitted).toBe('opt1');
    });
  });

  describe('CheckboxComponent', () => {
    let component: CheckboxComponent;
    let fixture: ComponentFixture<CheckboxComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [CheckboxComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(CheckboxComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create and toggle on change', () => {
      let emitted = false;
      component.checkedChange.subscribe((val) => {
        emitted = val;
      });

      const input = fixture.nativeElement.querySelector('input');
      input.checked = true;
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.checked).toBeTrue();
      expect(emitted).toBeTrue();
    });
  });

  describe('RadioGroupComponent and RadioComponent', () => {
    let groupComponent: RadioGroupComponent;
    let groupFixture: ComponentFixture<RadioGroupComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [RadioGroupComponent, RadioComponent],
      }).compileComponents();

      groupFixture = TestBed.createComponent(RadioGroupComponent);
      groupComponent = groupFixture.componentInstance;
      groupFixture.detectChanges();
    });

    it('should create radio group', () => {
      expect(groupComponent).toBeTruthy();
    });

    it('should update value and emit valueChange on selection', () => {
      let emitted: unknown = null;
      groupComponent.valueChange.subscribe((val) => {
        emitted = val;
      });

      groupComponent.selectValue('optA');
      expect(groupComponent.selectedValue).toBe('optA');
      expect(emitted).toBe('optA');
    });
  });

  describe('SwitchComponent', () => {
    let component: SwitchComponent;
    let fixture: ComponentFixture<SwitchComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SwitchComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(SwitchComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should toggle switch on click', () => {
      let emitted = false;
      component.checkedChange.subscribe((val) => {
        emitted = val;
      });

      const button = fixture.nativeElement.querySelector('button');
      button.click();
      fixture.detectChanges();

      expect(component.checked).toBeTrue();
      expect(emitted).toBeTrue();
    });
  });

  describe('QuantityStepperComponent', () => {
    let component: QuantityStepperComponent;
    let fixture: ComponentFixture<QuantityStepperComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [QuantityStepperComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(QuantityStepperComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should increment and decrement within bounds', () => {
      component.min = 1;
      component.max = 5;
      component.value = 2;
      fixture.detectChanges();

      component.increment();
      expect(component.value).toBe(3);

      component.decrement();
      expect(component.value).toBe(2);

      component.decrement();
      expect(component.value).toBe(1);

      // Should not go below min
      component.decrement();
      expect(component.value).toBe(1);
    });

    it('should clamp manually typed input', () => {
      component.min = 1;
      component.max = 10;
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      input.value = '99';
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.value).toBe(10);
    });
  });
});
