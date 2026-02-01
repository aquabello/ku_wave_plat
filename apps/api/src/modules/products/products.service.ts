import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  async findAll() {
    // TODO: Implement actual database query
    return [];
  }

  async findOne(id: string) {
    // TODO: Implement actual database query
    return { id };
  }
}
