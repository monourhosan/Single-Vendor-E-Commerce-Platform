export * from './payment';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  status: 'active' | 'inactive' | 'archived';
  image: string | null;
  in_stock: boolean;
  is_low_stock: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryLog {
  id: number;
  product_id: number;
  product?: Product;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  type: string;
  reason: string | null;
  user_id?: number | null;
  admin_name?: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  product_image?: string | null;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Payment {
  id: number;
  order_id: number;
  order_number?: string;
  gateway: 'bkash' | 'sslcommerz' | 'cod';
  transaction_id: string | null;
  amount: number;
  status: 'initiated' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  response_payload?: Record<string, any> | null;
  created_at?: string;
}

export interface Delivery {
  id: number;
  order_id: number;
  order_number?: string;
  courier: string;
  consignment_id: string | null;
  tracking_number: string | null;
  status: 'pending' | 'booked' | 'in_transit' | 'delivered' | 'returned' | 'cancelled';
  response?: Record<string, any> | null;
  created_at?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  payment?: Payment | null;
  delivery?: Delivery | null;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  total_products: number;
  low_stock_alerts: number;
  deliveries: Record<string, number>;
}

export interface PublicSettings {
  store_name: string;
  currency: string;
  currency_symbol: string;
  shipping_inside_dhaka: number;
  shipping_outside_dhaka: number;
  default_shipping_cost: number;
  active_gateways: string[];
}
