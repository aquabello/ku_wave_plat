/**
 * 고객 엔티티
 */
export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  address?: CustomerAddress;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 고객 주소
 */
export interface CustomerAddress {
  address: string;
  addressDetail?: string;
  zipCode: string;
}

/**
 * 고객 생성 DTO
 */
export interface CreateCustomerDto {
  email: string;
  name: string;
  phone: string;
  address?: CustomerAddress;
}

/**
 * 고객 수정 DTO
 */
export interface UpdateCustomerDto {
  email?: string;
  name?: string;
  phone?: string;
  address?: CustomerAddress;
}

/**
 * 고객 필터
 */
export interface CustomerFilter {
  search?: string;
}
