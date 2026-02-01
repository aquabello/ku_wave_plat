import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomersService {
  async findAll() {
    // TODO: Implement actual database query
    return [];
  }

  async findOne(id: string) {
    // TODO: Implement actual database query
    return { id };
  }
}
