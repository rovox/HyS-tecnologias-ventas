import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class WebhookKeyGuard implements CanActivate {
    private readonly failures;
    canActivate(context: ExecutionContext): boolean;
}
