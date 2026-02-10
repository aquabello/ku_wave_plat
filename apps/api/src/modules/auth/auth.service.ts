import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsersService } from '@modules/users/users.service';
import { MenusService } from '@modules/menus/menus.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private menusService: MenusService,
  ) {}

  /**
   * 사용자 인증 (아이디 + 비밀번호 검증)
   */
  async validateUser(userId: string, password: string): Promise<any> {
    const user = await this.usersService.findByUserId(userId);

    if (!user || !user.password) {
      return null;
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // 비밀번호를 제외한 사용자 정보 반환
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Access Token 생성
   */
  private generateAccessToken(payload: Record<string, any>): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Refresh Token 생성 (별도 만료시간 적용)
   */
  private generateRefreshToken(payload: Record<string, any>): string {
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_EXPIRATION',
      '7d',
    );
    return this.jwtService.sign(payload, { expiresIn });
  }

  /**
   * 로그아웃 처리
   */
  async logout(userSeq: number) {
    await this.usersService.clearAllTokens(userSeq);
    return { message: '로그아웃되었습니다' };
  }

  /**
   * 로그인 처리
   */
  async login(loginDto: LoginDto) {
    // 사용자 검증
    const user = await this.validateUser(loginDto.id, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('로그인에 실패하였습니다');
    }

    // 승인된 회원만 로그인 가능
    if (user.step !== 'OK') {
      throw new UnauthorizedException('승인된 회원만 로그인할 수 있습니다');
    }

    // JWT 페이로드 생성 (tokenVer: 권한 변경 시 강제 재로그인용)
    const payload = {
      sub: user.seq,
      userId: user.id,
      userName: user.name,
      userType: user.type,
      tokenVer: user.tokenVer ?? 1,
    };

    // 마지막 접속 시간 업데이트
    await this.usersService.updateLastAccessDate(user.seq);

    // 토큰 생성
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({
      sub: user.seq,
      userId: user.id,
      tokenVer: user.tokenVer ?? 1,
    });

    // 리프레시 토큰 DB 저장
    await this.usersService.saveRefreshToken(user.seq, refreshToken);

    // 메뉴 권한 조회: SUPER → 전체 메뉴, 그 외 → 사용자 할당 메뉴
    let menus;
    if (user.type === 'SUPER') {
      menus = await this.menusService.findAllMenuTree();
    } else {
      const userMenus = await this.menusService.findUserMenus(user.seq);
      menus = userMenus.menuTree;
    }

    // 응답 생성
    return {
      accessToken,
      refreshToken,
      user: {
        seq: user.seq,
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        step: user.step,
      },
      menus,
    };
  }

  /**
   * 토큰 갱신 (Refresh Token → 새 Access Token + 새 Refresh Token)
   */
  async refresh(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    // 1. JWT 서명 및 만료 검증
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('리프레시 토큰이 만료되었거나 유효하지 않습니다');
    }

    // 2. DB에서 사용자 조회
    const user = await this.usersService.findBySeq(payload.sub);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    // 3. DB 저장된 리프레시 토큰과 비교 (토큰 로테이션 보안)
    if (user.refreshToken !== refreshToken) {
      // 토큰 불일치 → 탈취 가능성 → 모든 토큰 무효화
      await this.usersService.clearAllTokens(user.seq);
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다. 다시 로그인해주세요.');
    }

    // 4. tokenVer 검증 (권한 변경 감지)
    if ((user.tokenVer ?? 1) !== (payload.tokenVer ?? 0)) {
      await this.usersService.clearAllTokens(user.seq);
      throw new UnauthorizedException('권한이 변경되었습니다. 다시 로그인해주세요.');
    }

    // 5. 새 토큰 쌍 발급 (로테이션)
    const newAccessToken = this.generateAccessToken({
      sub: user.seq,
      userId: user.id,
      userName: user.name,
      userType: user.type,
      tokenVer: user.tokenVer ?? 1,
    });

    const newRefreshToken = this.generateRefreshToken({
      sub: user.seq,
      userId: user.id,
      tokenVer: user.tokenVer ?? 1,
    });

    // 6. 새 리프레시 토큰 DB 저장 (이전 토큰 무효화)
    await this.usersService.saveRefreshToken(user.seq, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
