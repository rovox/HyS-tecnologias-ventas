import { MessageEvent } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import type { User } from '@prisma/client';
import { RealtimeService } from './realtime.service';
type AuthRequest = {
    user: User;
};
export declare class RealtimeController {
    private readonly realtime;
    private readonly jwt;
    constructor(realtime: RealtimeService, jwt: JwtService);
    ticket(req: AuthRequest): Promise<{
        token: string;
        expiresIn: number;
    }>;
    events(accessToken?: string): Promise<Observable<MessageEvent>>;
}
export {};
