import { ErrorHandler, Injectable, inject } from '@angular/core';
import { PlatformService } from '../storage/platform.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandler implements ErrorHandler {
  private readonly platform = inject(PlatformService);

  handleError(error: unknown): void {
    const errorPrefix = this.platform.isServer ? '[Server Error]' : '[Client Error]';
    console.error(`${errorPrefix} Unhandled Application Error:`, error);
  }
}
