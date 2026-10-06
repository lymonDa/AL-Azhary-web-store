import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../ui/button/button.component';
import {
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardContentComponent,
  CardFooterComponent,
} from '../ui/card/card.component';
import { BadgeComponent } from '../ui/badge/badge.component';
import { FormFieldComponent } from '../forms/form-field/form-field.component';
import { TextInputComponent } from '../forms/input/text-input.component';
import { TextareaComponent } from '../forms/textarea/textarea.component';
import { SelectComponent, SelectOption } from '../forms/select/select.component';
import { CheckboxComponent } from '../forms/checkbox/checkbox.component';
import {
  RadioGroupComponent,
  RadioComponent,
} from '../forms/radio/radio.component';
import { SwitchComponent } from '../forms/switch/switch.component';
import { QuantityStepperComponent } from '../forms/quantity-stepper/quantity-stepper.component';
import { StatusBadgeComponent } from '../status/status-badge.component';
import { ModalComponent } from '../overlay/modal/modal.component';
import { ConfirmDialogComponent } from '../overlay/modal/confirm-dialog.component';
import { ToastContainerComponent } from '../overlay/toast/toast-container.component';
import { ToastService } from '../overlay/toast/toast.service';
import { ToastTone } from '../overlay/toast/toast.model';

@Component({
  selector: 'app-stylebook',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    CardFooterComponent,
    BadgeComponent,
    FormFieldComponent,
    TextInputComponent,
    TextareaComponent,
    SelectComponent,
    CheckboxComponent,
    RadioGroupComponent,
    RadioComponent,
    SwitchComponent,
    QuantityStepperComponent,
    StatusBadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
    ToastContainerComponent,
  ],
  templateUrl: './stylebook.component.html',
  styleUrl: './stylebook.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StylebookComponent {
  private readonly toastService = inject(ToastService);

  readonly currentDirection = signal<'rtl' | 'ltr'>('rtl');

  // Form Demo Models
  demoText = 'أحمد محمود';
  demoPassword = 'secretpassword';
  demoNotes = 'يرجى تغليف الكتب بعناية';
  demoSelectedOption = 'sharia';
  demoSelectOptions: SelectOption[] = [
    { value: 'sharia', label: 'كلية الشريعة والقانون' },
    { value: 'usul', label: 'كلية أصول الدين' },
    { value: 'arabic', label: 'كلية اللغة العربية' },
    { value: 'studies', label: 'كلية الدراسات الإسلامية والعربية' },
  ];
  demoCheckbox1 = true;
  demoRadioVal = 'delivery';
  demoSwitchVal = true;
  demoQuantity = 2;

  // Modal / Confirm Demo States
  isModalOpen = false;
  isConfirmOpen = false;

  toggleDirection(): void {
    this.currentDirection.update((dir) => (dir === 'rtl' ? 'ltr' : 'rtl'));
  }

  triggerToast(tone: ToastTone): void {
    switch (tone) {
      case 'success':
        this.toastService.success('تمت إضافة الكتاب إلى السلة بنجاح');
        break;
      case 'info':
        this.toastService.info('تم نسخ الرقم المرجعي للطلب إلى الحافظة');
        break;
      case 'warning':
        this.toastService.warning('تنبيه: الكمية المتبقية في المخزن محدودة');
        break;
      case 'error':
        this.toastService.error('فشل إرسال إشعار الدفع، يرجى إعادة المحاولة');
        break;
    }
  }

  onConfirmAction(): void {
    this.isConfirmOpen = false;
    this.toastService.warning('تم تنفيذ إجراء الإلغاء');
  }
}
