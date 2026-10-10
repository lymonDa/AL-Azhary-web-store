import { Component, ChangeDetectionStrategy, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LocaleService } from '../../../core/i18n/locale.service';
import { AccountStore } from '../../../core/account/account.store';
import { ToastService } from '../../../shared/overlay/toast/toast.service';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import type { CustomerAddress } from '../../../domain/models/customer.model';
import type { CreateAddressRequestDto, UpdateAddressRequestDto } from '../../../core/api/dto/customer.dto';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    SkeletonComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="az-addresses" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">
      <div class="az-addresses__header">
        <div class="az-addresses__title-wrap">
          <h1 class="az-addresses__title">{{ isArabic() ? 'دفتر العناوين' : 'Saved Addresses' }}</h1>
          <p class="az-addresses__desc">
            {{ isArabic() ? 'إدارة عناوين الشحن والتوصيل لاستخدامها المباشر أثناء الطلب والشراء.' : 'Manage your shipping and delivery addresses for seamless checkout.' }}
          </p>
        </div>
        <button
          type="button"
          class="az-addresses__add-btn"
          (click)="openAddModal()"
        >
          <app-icon name="plus" [size]="18"></app-icon>
          <span>{{ isArabic() ? 'إضافة عنوان جديد' : 'Add New Address' }}</span>
        </button>
      </div>

      <!-- Loading Skeletons -->
      @if (accountStore.isLoadingAddresses() && addresses().length === 0) {
        <div class="az-addresses__grid">
          <div class="az-addresses__skeleton-card">
            <app-skeleton width="120px" height="24px"></app-skeleton>
            <app-skeleton width="200px" height="18px" style="margin-top: 12px;"></app-skeleton>
            <app-skeleton width="100%" height="40px" style="margin-top: 12px;"></app-skeleton>
          </div>
          <div class="az-addresses__skeleton-card">
            <app-skeleton width="120px" height="24px"></app-skeleton>
            <app-skeleton width="200px" height="18px" style="margin-top: 12px;"></app-skeleton>
            <app-skeleton width="100%" height="40px" style="margin-top: 12px;"></app-skeleton>
          </div>
        </div>
      } @else if (addresses().length > 0) {
        <!-- Address Cards Grid -->
        <div class="az-addresses__grid">
          @for (addr of addresses(); track addr.id) {
            <div class="az-addresses__card" [class.az-addresses__card--default]="addr.isDefault">
              <div class="az-addresses__card-head">
                <div class="az-addresses__card-title-row">
                  <span class="az-addresses__card-label">{{ addr.label || (isArabic() ? 'عنوان' : 'Address') }}</span>
                  @if (addr.isDefault) {
                    <span class="az-addresses__default-badge">
                      <app-icon name="check" [size]="12"></app-icon>
                      <span>{{ isArabic() ? 'العنوان الافتراضي' : 'Default Address' }}</span>
                    </span>
                  }
                </div>
                <div class="az-addresses__card-actions">
                  <button
                    type="button"
                    class="az-addresses__action-icon-btn"
                    (click)="openEditModal(addr)"
                    [attr.aria-label]="isArabic() ? 'تعديل العنوان' : 'Edit address'"
                  >
                    <app-icon name="edit" [size]="16"></app-icon>
                  </button>
                  <button
                    type="button"
                    class="az-addresses__action-icon-btn az-addresses__action-icon-btn--danger"
                    (click)="openDeleteConfirm(addr)"
                    [attr.aria-label]="isArabic() ? 'حذف العنوان' : 'Delete address'"
                  >
                    <app-icon name="trash" [size]="16"></app-icon>
                  </button>
                </div>
              </div>

              <div class="az-addresses__card-body">
                <p class="az-addresses__recipient">
                  <app-icon name="user" [size]="16" class="az-addresses__icon"></app-icon>
                  <span class="font-semibold">{{ addr.recipientName }}</span>
                  <span class="az-addresses__phone" dir="ltr">({{ addr.recipientPhone }})</span>
                </p>
                <p class="az-addresses__location">
                  <app-icon name="map-pin" [size]="16" class="az-addresses__icon"></app-icon>
                  <span>
                    {{ addr.governorate }}، {{ addr.city }}، {{ addr.area }} — {{ addr.street }}، مبنى {{ addr.buildingNumber }}
                    @if (addr.floor) { ، طابق {{ addr.floor }} }
                    @if (addr.apartment) { ، شقة {{ addr.apartment }} }
                  </span>
                </p>
                @if (addr.landmark) {
                  <p class="az-addresses__landmark">
                    <span class="az-addresses__sub-label">{{ isArabic() ? 'علامة مميزة:' : 'Landmark:' }}</span>
                    <span>{{ addr.landmark }}</span>
                  </p>
                }
              </div>

              @if (!addr.isDefault) {
                <div class="az-addresses__card-foot">
                  <button
                    type="button"
                    class="az-addresses__set-default-btn"
                    (click)="onSetDefault(addr)"
                  >
                    <span>{{ isArabic() ? 'تعيين كعنوان افتراضي' : 'Set as default' }}</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <app-empty-state
          icon="📍"
          [title]="isArabic() ? 'لا توجد عناوين مسجلة حتى الآن' : 'No addresses saved yet'"
          [description]="isArabic() ? 'أضف عنوان استلام لتسريع إتمام الطلبات القادمة.' : 'Add your shipping addresses for rapid checkout.'"
          [actionText]="isArabic() ? 'إضافة عنوان جديد' : 'Add New Address'"
          (actionClick)="openAddModal()"
        ></app-empty-state>
      }

      <!-- ADD / EDIT ADDRESS MODAL -->
      @if (showModal()) {
        <div class="az-addresses__modal-backdrop">
          <button
            type="button"
            class="az-addresses__modal-dismiss"
            tabindex="-1"
            aria-hidden="true"
            (click)="closeModal()"
          ></button>
          <div class="az-addresses__modal" role="dialog" aria-modal="true">
            <div class="az-addresses__modal-header">
              <h2 class="az-addresses__modal-title">
                {{ isEditing()
                  ? (isArabic() ? 'تعديل العنوان' : 'Edit Address')
                  : (isArabic() ? 'إضافة عنوان جديد' : 'Add New Address')
                }}
              </h2>
              <button type="button" class="az-addresses__modal-close" (click)="closeModal()" aria-label="Close">
                <app-icon name="x" [size]="20"></app-icon>
              </button>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSaveAddress()" class="az-addresses__modal-form">
              <!-- Label -->
              <div class="az-addresses__form-row">
                <div class="az-addresses__field">
                  <label for="label" class="az-addresses__form-label">{{ isArabic() ? 'تسمية العنوان (اختياري)' : 'Address Label (Optional)' }}</label>
                  <input id="label" type="text" formControlName="label" class="az-addresses__form-input" [placeholder]="isArabic() ? 'مثال: المنزل، المكتب، السكن الجامعي' : 'e.g. Home, Office, Campus'" />
                </div>
              </div>

              <!-- Recipient Name & Phone -->
              <div class="az-addresses__form-row az-addresses__form-row--2">
                <div class="az-addresses__field">
                  <label for="recipientName" class="az-addresses__form-label">
                    {{ isArabic() ? 'اسم المستلم' : 'Recipient Name' }} <span class="text-error">*</span>
                  </label>
                  <input id="recipientName" type="text" formControlName="recipientName" class="az-addresses__form-input" />
                  @if (isFieldInvalid('recipientName')) {
                    <span class="az-addresses__field-error">{{ isArabic() ? 'اسم المستلم مطلوب (حرفين على الأقل)' : 'Recipient name required (min 2 chars)' }}</span>
                  }
                </div>
                <div class="az-addresses__field">
                  <label for="recipientPhone" class="az-addresses__form-label">
                    {{ isArabic() ? 'رقم هاتف المستلم' : 'Recipient Phone' }} <span class="text-error">*</span>
                  </label>
                  <input id="recipientPhone" type="tel" formControlName="recipientPhone" class="az-addresses__form-input" dir="ltr" placeholder="01012345678" />
                  @if (isFieldInvalid('recipientPhone')) {
                    <span class="az-addresses__field-error">{{ isArabic() ? 'رقم هاتف صحيح مطلوب' : 'Valid phone required' }}</span>
                  }
                </div>
              </div>

              <!-- Governorate, City, Area -->
              <div class="az-addresses__form-row az-addresses__form-row--3">
                <div class="az-addresses__field">
                  <label for="governorate" class="az-addresses__form-label">{{ isArabic() ? 'المحافظة' : 'Governorate' }} <span class="text-error">*</span></label>
                  <input id="governorate" type="text" formControlName="governorate" class="az-addresses__form-input" placeholder="قنا" />
                </div>
                <div class="az-addresses__field">
                  <label for="city" class="az-addresses__form-label">{{ isArabic() ? 'المدينة / المركز' : 'City' }} <span class="text-error">*</span></label>
                  <input id="city" type="text" formControlName="city" class="az-addresses__form-input" placeholder="قنا" />
                </div>
                <div class="az-addresses__field">
                  <label for="area" class="az-addresses__form-label">{{ isArabic() ? 'المنطقة / الحي' : 'Area' }} <span class="text-error">*</span></label>
                  <input id="area" type="text" formControlName="area" class="az-addresses__form-input" placeholder="وسط البلد" />
                </div>
              </div>

              <!-- Street, Building Number -->
              <div class="az-addresses__form-row az-addresses__form-row--2">
                <div class="az-addresses__field">
                  <label for="street" class="az-addresses__form-label">{{ isArabic() ? 'الشارع' : 'Street' }} <span class="text-error">*</span></label>
                  <input id="street" type="text" formControlName="street" class="az-addresses__form-input" placeholder="شارع عمر أفندي" />
                </div>
                <div class="az-addresses__field">
                  <label for="buildingNumber" class="az-addresses__form-label">{{ isArabic() ? 'رقم المبنى' : 'Building No.' }} <span class="text-error">*</span></label>
                  <input id="buildingNumber" type="text" formControlName="buildingNumber" class="az-addresses__form-input" placeholder="12" />
                </div>
              </div>

              <!-- Floor, Apartment, Landmark -->
              <div class="az-addresses__form-row az-addresses__form-row--3">
                <div class="az-addresses__field">
                  <label for="floor" class="az-addresses__form-label">{{ isArabic() ? 'الطابق (اختياري)' : 'Floor' }}</label>
                  <input id="floor" type="text" formControlName="floor" class="az-addresses__form-input" />
                </div>
                <div class="az-addresses__field">
                  <label for="apartment" class="az-addresses__form-label">{{ isArabic() ? 'الشقة (اختياري)' : 'Apartment' }}</label>
                  <input id="apartment" type="text" formControlName="apartment" class="az-addresses__form-input" />
                </div>
                <div class="az-addresses__field">
                  <label for="landmark" class="az-addresses__form-label">{{ isArabic() ? 'علامة مميزة (اختياري)' : 'Landmark' }}</label>
                  <input id="landmark" type="text" formControlName="landmark" class="az-addresses__form-input" />
                </div>
              </div>

              <!-- Is Default Checkbox -->
              <div class="az-addresses__checkbox-row">
                <label class="az-addresses__checkbox-label">
                  <input type="checkbox" formControlName="isDefault" class="az-addresses__checkbox" />
                  <span>{{ isArabic() ? 'تعيين هذا العنوان كعنوان افتراضي للشحن' : 'Set as default shipping address' }}</span>
                </label>
              </div>

              <!-- Modal Actions -->
              <div class="az-addresses__modal-actions">
                <button type="button" class="az-addresses__cancel-btn" (click)="closeModal()">
                  {{ isArabic() ? 'إلغاء' : 'Cancel' }}
                </button>
                <button type="submit" class="az-addresses__save-btn" [disabled]="form.invalid || isSubmitting()">
                  @if (isSubmitting()) {
                    <app-icon name="loader" [size]="16" class="animate-spin"></app-icon>
                    <span>{{ isArabic() ? 'جاري الحفظ...' : 'Saving...' }}</span>
                  } @else {
                    <span>{{ isArabic() ? 'حفظ العنوان' : 'Save Address' }}</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- DELETE CONFIRMATION MODAL -->
      @if (addressToDelete(); as target) {
        <div class="az-addresses__modal-backdrop">
          <button
            type="button"
            class="az-addresses__modal-dismiss"
            tabindex="-1"
            aria-hidden="true"
            (click)="cancelDelete()"
          ></button>
          <div class="az-addresses__modal az-addresses__modal--sm" role="dialog" aria-modal="true">
            <div class="az-addresses__modal-header">
              <h2 class="az-addresses__modal-title">{{ isArabic() ? 'تأكيد حذف العنوان' : 'Confirm Delete Address' }}</h2>
              <button type="button" class="az-addresses__modal-close" (click)="cancelDelete()" aria-label="Close">
                <app-icon name="x" [size]="20"></app-icon>
              </button>
            </div>
            <div class="az-addresses__modal-body">
              <p class="az-addresses__confirm-text">
                {{ isArabic()
                  ? 'هل أنت متأكد من رغبتك في حذف هذا العنوان من دفتر عناوينك؟ لا يمكن التراجع عن هذه الخطوة.'
                  : 'Are you sure you want to delete this address from your saved address book?'
                }}
              </p>
              <div class="az-addresses__confirm-details">
                <span class="font-semibold">{{ target.recipientName }}</span> —
                <span>{{ target.governorate }}، {{ target.city }}، {{ target.street }}</span>
              </div>
            </div>
            <div class="az-addresses__modal-actions">
              <button type="button" class="az-addresses__cancel-btn" (click)="cancelDelete()">
                {{ isArabic() ? 'إلغاء' : 'Cancel' }}
              </button>
              <button
                type="button"
                class="az-addresses__delete-confirm-btn"
                [disabled]="isDeleting()"
                (click)="confirmDelete(target.id)"
              >
                @if (isDeleting()) {
                  <span>{{ isArabic() ? 'جاري الحذف...' : 'Deleting...' }}</span>
                } @else {
                  <span>{{ isArabic() ? 'نعم، حذف العنوان' : 'Delete' }}</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./addresses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly localeService = inject(LocaleService);
  readonly accountStore = inject(AccountStore);
  private readonly toast = inject(ToastService);

  readonly isArabic = computed(() => this.localeService.currentLocale() !== 'en');
  readonly addresses = computed(() => this.accountStore.addresses());

  readonly showModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingId = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);

  readonly addressToDelete = signal<CustomerAddress | null>(null);
  readonly isDeleting = signal<boolean>(false);

  readonly form = this.fb.group({
    label: [''],
    recipientName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    recipientPhone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(?:\+?20|0)?1[0125][0-9]{8}$|^\+?[1-9]\d{6,14}$/),
      ],
    ],
    governorate: ['', [Validators.required]],
    city: ['', [Validators.required]],
    area: ['', [Validators.required]],
    street: ['', [Validators.required]],
    buildingNumber: ['', [Validators.required]],
    floor: [''],
    apartment: [''],
    landmark: [''],
    isDefault: [false],
  });

  ngOnInit(): void {
    this.accountStore.loadAddresses().subscribe();
  }

  isFieldInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.form.reset({
      isDefault: this.addresses().length === 0,
    });
    this.showModal.set(true);
  }

  openEditModal(addr: CustomerAddress): void {
    this.isEditing.set(true);
    this.editingId.set(addr.id);
    this.form.patchValue({
      label: addr.label ?? '',
      recipientName: addr.recipientName,
      recipientPhone: addr.recipientPhone,
      governorate: addr.governorate,
      city: addr.city,
      area: addr.area,
      street: addr.street,
      buildingNumber: addr.buildingNumber,
      floor: addr.floor ?? '',
      apartment: addr.apartment ?? '',
      landmark: addr.landmark ?? '',
      isDefault: addr.isDefault,
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.isSubmitting.set(false);
  }

  onSaveAddress(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    this.isSubmitting.set(true);

    if (this.isEditing() && this.editingId()) {
      const updateDto: UpdateAddressRequestDto = {
        label: val.label ? val.label.trim() : null,
        recipientName: val.recipientName?.trim(),
        recipientPhone: val.recipientPhone?.trim(),
        governorate: val.governorate?.trim(),
        city: val.city?.trim(),
        area: val.area?.trim(),
        street: val.street?.trim(),
        buildingNumber: val.buildingNumber?.trim(),
        floor: val.floor ? val.floor.trim() : null,
        apartment: val.apartment ? val.apartment.trim() : null,
        landmark: val.landmark ? val.landmark.trim() : null,
        isDefault: !!val.isDefault,
      };

      this.accountStore.updateAddress(this.editingId()!, updateDto).subscribe({
        next: () => {
          this.closeModal();
          this.toast.success(this.isArabic() ? 'تم تحديث العنوان بنجاح!' : 'Address updated successfully!');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toast.error(err?.message || (this.isArabic() ? 'تعذر تحديث العنوان.' : 'Failed to update address.'));
        },
      });
    } else {
      const createDto: CreateAddressRequestDto = {
        label: val.label ? val.label.trim() : null,
        recipientName: val.recipientName!.trim(),
        recipientPhone: val.recipientPhone!.trim(),
        governorate: val.governorate!.trim(),
        city: val.city!.trim(),
        area: val.area!.trim(),
        street: val.street!.trim(),
        buildingNumber: val.buildingNumber!.trim(),
        floor: val.floor ? val.floor.trim() : null,
        apartment: val.apartment ? val.apartment.trim() : null,
        landmark: val.landmark ? val.landmark.trim() : null,
        isDefault: !!val.isDefault,
      };

      this.accountStore.createAddress(createDto).subscribe({
        next: () => {
          this.closeModal();
          this.toast.success(this.isArabic() ? 'تمت إضافة العنوان بنجاح!' : 'Address added successfully!');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toast.error(err?.message || (this.isArabic() ? 'تعذر إضافة العنوان.' : 'Failed to add address.'));
        },
      });
    }
  }

  onSetDefault(addr: CustomerAddress): void {
    this.accountStore.setDefaultAddress(addr.id).subscribe({
      next: () => {
        this.toast.success(this.isArabic() ? 'تم تعيين العنوان الافتراضي بنجاح!' : 'Default address updated!');
      },
      error: (err) => {
        this.toast.error(err?.message || (this.isArabic() ? 'تعذر تعيين العنوان كافتراضي.' : 'Failed to set default address.'));
      },
    });
  }

  openDeleteConfirm(addr: CustomerAddress): void {
    this.addressToDelete.set(addr);
  }

  cancelDelete(): void {
    this.addressToDelete.set(null);
    this.isDeleting.set(false);
  }

  confirmDelete(id: string): void {
    this.isDeleting.set(true);
    this.accountStore.deleteAddress(id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.addressToDelete.set(null);
        this.toast.success(this.isArabic() ? 'تم حذف العنوان بنجاح.' : 'Address deleted successfully.');
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.toast.error(err?.message || (this.isArabic() ? 'تعذر حذف العنوان.' : 'Failed to delete address.'));
      },
    });
  }
}
