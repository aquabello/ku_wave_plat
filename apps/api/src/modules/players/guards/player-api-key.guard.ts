import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbPlayer } from '../entities/tb-player.entity';

@Injectable()
export class PlayerApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(TbPlayer)
    private readonly playerRepository: Repository<TbPlayer>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('API Key가 필요합니다.');
    }

    // Bearer {api_key} 형식 파싱
    const [bearer, apiKey] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !apiKey) {
      throw new UnauthorizedException('유효하지 않은 API Key 형식입니다.');
    }

    // API Key로 플레이어 조회
    const player = await this.playerRepository.findOne({
      where: {
        playerApiKey: apiKey,
        playerIsdel: 'N',
      },
    });

    if (!player) {
      throw new UnauthorizedException('유효하지 않은 API Key입니다.');
    }

    if (player.playerApproval !== 'APPROVED') {
      throw new UnauthorizedException('승인되지 않은 플레이어입니다.');
    }

    // request 객체에 플레이어 정보 저장
    request.player = player;

    return true;
  }
}
