import { Injectable } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';

export interface RealtimeMessage<T = unknown> {
  readonly event: string;
  readonly payload: T;
  readonly timestamp: string;
}

export interface IRealtimeService {
  readonly isConnected: boolean;
  connect(): void;
  disconnect(): void;
  listen<T = unknown>(eventName: string): Observable<RealtimeMessage<T>>;
}

/**
 * RealtimeService establishes the foundation interface for WebSocket/Socket.IO
 * communication.
 *
 * NOTE: As mandated by Phase 0 architecture specification, no actual socket connection
 * is initiated until Phase 8.
 */
@Injectable({
  providedIn: 'root',
})
export class RealtimeService implements IRealtimeService {
  readonly isConnected = false;

  connect(): void {
    // Foundation skeleton: connection deferred to Phase 8
  }

  disconnect(): void {
    // Foundation skeleton
  }

  listen<T = unknown>(): Observable<RealtimeMessage<T>> {
    return EMPTY;
  }
}
