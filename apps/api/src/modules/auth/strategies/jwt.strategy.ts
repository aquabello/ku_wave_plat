import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // tokenVer 검증: JWT의 tokenVer과 DB 비교 → 불일치 시 강제 재로그인
    const user = await this.usersService.findBySeq(payload.sub);
    if (!user || (user.tokenVer ?? 1) !== (payload.tokenVer ?? 0)) {
      throw new UnauthorizedException('권한이 변경되었습니다. 다시 로그인해주세요.');
    }

    return {
      seq: payload.sub,
      userId: payload.userId,
      userName: payload.userName,
      userType: payload.userType,
    };
  }
}
