import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
export type RealtimePayload = {
    type: string;
    entity: string;
    id: string;
    at: string;
    byUserId?: string;
    patch?: Record<string, unknown>;
    affects?: string[];
};
export declare class RealtimeService {
    private readonly bus;
    emit(type: string, entity: string, id: string, opts?: {
        byUserId?: string;
        patch?: Record<string, unknown>;
        affects?: string[];
    }): void;
    stream(): Observable<MessageEvent>;
}
