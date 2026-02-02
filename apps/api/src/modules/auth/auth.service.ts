import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '@modules/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
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
   * 로그아웃 처리
   */
  async logout(userSeq: number) {
    await this.usersService.clearAccessToken(userSeq);
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

    // JWT 페이로드 생성
    const payload = {
      sub: user.seq,
      userId: user.id,
      userName: user.name,
      userType: user.type,
    };

    // 마지막 접속 시간 업데이트
    await this.usersService.updateLastAccessDate(user.seq);

    // 응답 생성
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        seq: user.seq,
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        step: user.step,
      },
    };
  }

}
