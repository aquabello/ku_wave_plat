/**
 * 주문 상태
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * 주문 엔티티
 */
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 주문 아이템
 */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

/**
 * 배송 주소
 */
export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  addressDetail?: string;
  zipCode: string;
}

/**
 * 주문 생성 DTO
 */
export interface CreateOrderDto {
  customerId: string;
  items: CreateOrderItemDto[];
  shippingAddress: ShippingAddress;
}

/**
 * 주문 아이템 생성 DTO
 */
export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

/**
 * 주문 상태 변경 DTO
 */
export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

/**
 * 주문 필터
 */
export interface OrderFilter {
  status?: OrderStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
