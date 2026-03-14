import { PartialType } from '@nestjs/swagger';
import { CreateSocketCommandDto } from './create-socket-command.dto';

export class UpdateSocketCommandDto extends PartialType(CreateSocketCommandDto) {}
