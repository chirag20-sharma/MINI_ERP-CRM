export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details: unknown = null
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(entity = 'Resource') {
    super(404, 'NOT_FOUND', `${entity} not found`);
  }
}

export class ChallanNotFoundError extends AppError {
  constructor() {
    super(404, 'CHALLAN_NOT_FOUND', 'Challan not found');
  }
}

export class ProductNotFoundError extends AppError {
  constructor(productId?: string) {
    super(
      404,
      'PRODUCT_NOT_FOUND',
      productId ? `Product not found: ${productId}` : 'Product not found'
    );
  }
}

export class CustomerNotFoundError extends AppError {
  constructor() {
    super(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(409, 'INVALID_STATUS_TRANSITION', `Cannot transition challan from ${from} to ${to}`);
  }
}

export class InsufficientStockError extends AppError {
  constructor(
    public readonly items: Array<{
      productName: string;
      available: number;
      requested: number;
    }>
  ) {
    super(400, 'INSUFFICIENT_STOCK', 'Insufficient stock to fulfill request', items);
  }
}

