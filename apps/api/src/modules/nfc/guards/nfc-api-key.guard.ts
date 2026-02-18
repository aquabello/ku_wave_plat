import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbNfcReader } from '../entities/tb-nfc-reader.entity';

@Injectable()
export class NfcApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(TbNfcReader)
    private readonly nfcReaderRepository: Repository<TbNfcReader>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-nfc-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key가 제공되지 않았습니다');
    }

    // Query reader by API key
    const reader = await this.nfcReaderRepository.findOne({
      where: {
        readerApiKey: apiKey,
        readerIsdel: 'N',
      },
      relations: ['space'],
    });

    if (!reader) {
      throw new UnauthorizedException('유효하지 않은 API Key');
    }

    if (reader.readerStatus === 'INACTIVE') {
      throw new ForbiddenException('비활성 리더기');
    }

    // Inject reader info into request
    request.nfcReader = {
      readerSeq: reader.readerSeq,
      spaceSeq: reader.spaceSeq,
      readerName: reader.readerName,
      readerCode: reader.readerCode,
    };

    return true;
  }
}
