import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
export type RealtimePayload = {
    type: string;
    entity: string;
    id: string;
    at: string;
    byUserId?: string;
    patch?: Record<string, unknown>;
};
export declare class RealtimeService {
    private readonly bus;
    emit(type: string, entity: string, id: string, opts?: {
        byUserId?: string;
        patch?: Record<string, unknown>;
    }): void;
    stream(): Observable<MessageEvent>;
}
