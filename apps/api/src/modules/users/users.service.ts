import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async findAll() {
    // TODO: Implement actual database query
    return [];
  }

  async findOne(id: string) {
    // TODO: Implement actual database query
    return { id };
  }
}
