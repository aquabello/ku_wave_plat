import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiPcApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key가 제공되지 않았습니다');
    }

    const expected = this.configService.get<string>('AI_PC_API_KEY');
    if (!expected || apiKey !== expected) {
      throw new UnauthorizedException('유효하지 않은 API Key');
    }

    return true;
  }
}
