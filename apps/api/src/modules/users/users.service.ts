import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TbUser } from './entities/tb-user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(TbUser)
    private readonly userRepository: Repository<TbUser>,
  ) {}

  /**
   * 아이디로 사용자 조회 (삭제되지 않은 사용자만)
   * isDel이 'Y'가 아닌 경우 (NULL 또는 'N')
   */
  async findByUserId(userId: string): Promise<TbUser | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.tu_id = :userId', { userId })
      .andWhere('(user.tu_isdel IS NULL OR user.tu_isdel != :deleted)', {
        deleted: 'Y',
      })
      .getOne();
  }

  /**
   * 마지막 접속 시간 업데이트
   */
  async updateLastAccessDate(seq: number): Promise<void> {
    await this.userRepository.update(seq, {
      lastAccessDate: new Date(),
    });
  }

  /**
   * 접근 토큰 초기화 (로그아웃)
   */
  async clearAccessToken(seq: number): Promise<void> {
    await this.userRepository.update(seq, {
      accessToken: null,
    });
  }

  /**
   * seq로 사용자 조회 (삭제되지 않은 사용자만)
   */
  async findBySeq(seq: number): Promise<TbUser | null> {
    const user = await this.userRepository.findOne({
      where: { seq },
    });

    // 삭제된 사용자 제외
    if (user && user.isDel === 'Y') {
      return null;
    }

    return user;
  }

  /**
   * 회원 정보 업데이트
   * @param seq 사용자 시퀀스
   * @param updateUserDto 업데이트할 데이터
   * @returns 업데이트된 사용자 정보 (비밀번호 제외)
   */
  async updateUser(seq: number, updateUserDto: UpdateUserDto): Promise<Omit<TbUser, 'password'>> {
    const user = await this.findBySeq(seq);

    if (!user) {
      throw new NotFoundException('해당 회원을 찾을 수 없습니다');
    }

    // 업데이트할 필드만 적용
    if (updateUserDto.name !== undefined) {
      user.name = updateUserDto.name;
    }
    if (updateUserDto.phone !== undefined) {
      user.phone = updateUserDto.phone;
    }
    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email;
    }

    const updatedUser = await this.userRepository.save(user);

    // 비밀번호 제외하고 반환
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * 비밀번호 초기화
   * @param seq 사용자 시퀀스
   * @param resetPasswordDto 새 비밀번호
   */
  async resetPassword(seq: number, resetPasswordDto: ResetPasswordDto): Promise<void> {
    const user = await this.findBySeq(seq);

    if (!user) {
      throw new NotFoundException('해당 회원을 찾을 수 없습니다');
    }

    // 비밀번호 해싱 (bcrypt 라운드 10)
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // 비밀번호 업데이트
    await this.userRepository.update(seq, {
      password: hashedPassword,
    });
  }

  /**
   * 회원 소프트 삭제 (isDel = 'Y')
   * @param seq 사용자 시퀀스
   */
  async softDelete(seq: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { seq },
    });

    if (!user || user.isDel === 'Y') {
      throw new NotFoundException('해당 회원을 찾을 수 없습니다');
    }

    // 소프트 삭제
    await this.userRepository.update(seq, {
      isDel: 'Y',
    });
  }

  async findAll() {
    // TODO: Implement actual database query
    return [];
  }

  async findOne(id: string) {
    // TODO: Implement actual database query
    return { id };
  }
}
