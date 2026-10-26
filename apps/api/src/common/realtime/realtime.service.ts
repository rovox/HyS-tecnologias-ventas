import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, interval, map, merge } from 'rxjs';

export type RealtimePayload = {
  type: string;
  entity: string;
  id: string;
  at: string;
  byUserId?: string;
  patch?: Record<string, unknown>;
  /** Other entities whose views change with this one. */
  affects?: string[];
};

@Injectable()
export class RealtimeService {
  private readonly bus = new Subject<RealtimePayload>();

  emit(
    type: string,
    entity: string,
    id: string,
    opts: { byUserId?: string; patch?: Record<string, unknown>; affects?: string[] } = {},
  ) {
    this.bus.next({
      type,
      entity,
      id,
      at: new Date().toISOString(),
      byUserId: opts.byUserId,
      patch: opts.patch,
      affects: opts.affects?.length ? opts.affects : undefined,
    });
  }

  stream(): Observable<MessageEvent> {
    const events$ = this.bus.asObservable().pipe(
      map(
        (data): MessageEvent => ({
          data: JSON.stringify(data),
        }),
      ),
    );
    const heartbeat$ = interval(25_000).pipe(
      map(
        (): MessageEvent => ({
          data: JSON.stringify({ type: 'heartbeat', entity: 'system', id: 'ping', at: new Date().toISOString() }),
        }),
      ),
    );
    return merge(events$, heartbeat$);
  }
}
