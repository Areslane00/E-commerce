export type OrderStatus = 'En attente' | 'Confirmée' | 'Expédiée' | 'Livrée' | 'Annulée';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price?: number | null; // Prix avant promotion (barré)
  category: string;
  image_url: string | null;
  stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  quantity: number;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  notes: string | null;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
}

export interface UserProfile {
  id: string;
  role: 'admin' | 'user';
  email?: string | null;
  full_name?: string | null;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  average_order: number;
  today_orders: number;
  out_of_stock: number;
  low_stock: number;
  revenue_by_day: {
    date: string;
    revenue: number;
    orders_count: number;
  }[];
  top_products: {
    product_name: string;
    total_sold: number;
    total_revenue: number;
  }[];
  orders_by_status: {
    status: OrderStatus;
    count: number;
  }[];
}

export interface CheckoutFormData {
  customer_name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  notes?: string;
}
