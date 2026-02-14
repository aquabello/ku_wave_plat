import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TbUser } from './entities/tb-user.entity';
import { UpdateUserDto, ResetPasswordDto, UserQueryDto, CreateUserDto } from './dto';
import { UserListItemDto, UserListResponseDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(TbUser)
    private readonly userRepository: Repository<TbUser>,
  ) {}

  /**
   * 사용자 리스트 조회 (삭제되지 않은 사용자만, 페이징)
   */
  async findAll(query: UserQueryDto): Promise<UserListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('u')
      .where('(u.tu_isdel IS NULL OR u.tu_isdel != :deleted)', {
        deleted: 'Y',
      });

    if (query.search) {
      qb.andWhere(
        '(u.tu_id LIKE :search OR u.tu_name LIKE :search OR u.tu_email LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [users, total] = await qb
      .orderBy('u.seq', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const items: UserListItemDto[] = users.map((u, index) => ({
      no: total - skip - index,
      seq: u.seq,
      id: u.id,
      name: u.name,
      lastAccessDate: u.lastAccessDate,
      step: u.step,
      approvedDate: u.approvedDate,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

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
   * 리프레시 토큰 저장
   */
  async saveRefreshToken(seq: number, refreshToken: string): Promise<void> {
    await this.userRepository.update(seq, {
      refreshToken,
    });
  }

  /**
   * 모든 토큰 초기화 (로그아웃 시)
   */
  async clearAllTokens(seq: number): Promise<void> {
    await this.userRepository.update(seq, {
      accessToken: null,
      refreshToken: null,
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
   * 회원 등록 (아이디, 이름만)
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<TbUser, 'password'>> {
    // 아이디 중복 체크
    const existing = await this.findByUserId(createUserDto.id);
    if (existing) {
      throw new ConflictException('이미 사용 중인 아이디입니다');
    }

    const user = this.userRepository.create({
      id: createUserDto.id,
      name: createUserDto.name,
      step: 'NORMAL',
    });

    const savedUser = await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
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
    if (updateUserDto.step !== undefined) {
      user.step = updateUserDto.step;
      // 승인(OK) 시 승인일시 자동 설정
      if (updateUserDto.step === 'OK') {
        user.approvedDate = new Date();
      }
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
}
