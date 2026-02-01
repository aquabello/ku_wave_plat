/**
 * 상품 카테고리
 */
export enum ProductCategory {
  FOOD = 'food',
  BEVERAGE = 'beverage',
  DESSERT = 'dessert',
  OTHER = 'other',
}

/**
 * 상품 엔티티
 */
export interface Product {
  id: string;
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 상품 생성 DTO
 */
export interface CreateProductDto {
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  stock: number;
  imageUrl?: string;
}

/**
 * 상품 수정 DTO
 */
export interface UpdateProductDto {
  name?: string;
  description?: string;
  category?: ProductCategory;
  price?: number;
  stock?: number;
  imageUrl?: string;
  isActive?: boolean;
}

/**
 * 상품 필터
 */
export interface ProductFilter {
  category?: ProductCategory;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}
