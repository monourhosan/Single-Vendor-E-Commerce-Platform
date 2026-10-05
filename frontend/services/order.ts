import apiClient from './api';
import { Order } from '@/types';

export interface CheckoutPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  payment_gateway: 'bkash' | 'sslcommerz' | 'cod';
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  shipping_cost?: number;
  defer_payment?: boolean;
}

export const orderService = {
  async checkout(payload: CheckoutPayload) {
    try {
      const response = await apiClient.post('/checkout', payload);
      return response.data;
    } catch (error: any) {
      // In offline sandbox simulation mode
      if (!error.response && typeof window !== 'undefined') {
        const mockOrderNumber = 'ORD-' + Date.now().toString().slice(-6);
        const subtotal = payload.items.reduce((acc, i) => acc + (i.quantity * 1000), 0);
        const total = subtotal + (payload.shipping_cost || 60);

        if (payload.defer_payment) {
          return {
            success: true,
            order: { order_number: mockOrderNumber, total },
            order_number: mockOrderNumber,
            order_id: Math.floor(Math.random() * 1000) + 1,
          };
        }

        if (payload.payment_gateway === 'bkash') {
          return {
            success: true,
            redirect_url: `/checkout/simulator?gateway=bkash&paymentID=BKASH_DEMO_${Date.now()}&order=${mockOrderNumber}&amount=${total}`,
            order: { order_number: mockOrderNumber, total },
          };
        }
        if (payload.payment_gateway === 'sslcommerz') {
          return {
            success: true,
            redirect_url: `/checkout/simulator?gateway=sslcommerz&paymentID=SSLC_DEMO_${Date.now()}&order=${mockOrderNumber}&amount=${total}`,
            order: { order_number: mockOrderNumber, total },
          };
        }
        return {
          success: true,
          redirect_url: `/payment/success?order=${mockOrderNumber}&gateway=cod`,
          order: { order_number: mockOrderNumber, total },
        };
      }
      throw error;
    }
  },

  async getOrder(id: string | number) {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data.data as Order;
    } catch {
      return fallbackOrders.find((o) => o.id === Number(id) || o.order_number === String(id)) || fallbackOrders[0];
    }
  },

  async trackOrder(orderNumber: string) {
    try {
      const response = await apiClient.get(`/orders/track/${orderNumber}`);
      return response.data;
    } catch {
      const ord = fallbackOrders.find((o) => o.order_number.toLowerCase() === orderNumber.toLowerCase()) || fallbackOrders[0];
      return {
        success: true,
        order: ord,
        delivery: ord.delivery,
        timeline: ord.delivery?.response?.timeline || [
          { status: 'Order Placed & Confirmed', time: 'Today 10:00 AM' },
          { status: 'CarryBee Courier Assigned', time: 'Today 12:30 PM' },
          { status: 'Package In Transit', time: 'Today 03:00 PM' },
        ],
      };
    }
  },

  async getAdminOrders(params?: { search?: string; order_status?: string; payment_status?: string; per_page?: number }) {
    try {
      const response = await apiClient.get('/admin/orders', { params });
      return response.data;
    } catch {
      let filtered = [...fallbackOrders];
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.toLowerCase().includes(q)
        );
      }
      if (params?.order_status) {
        filtered = filtered.filter((o) => o.order_status === params.order_status);
      }
      if (params?.payment_status) {
        filtered = filtered.filter((o) => o.payment_status === params.payment_status);
      }
      return {
        success: true,
        data: filtered,
        meta: { current_page: 1, last_page: 1, per_page: 15, total: filtered.length },
      };
    }
  },

  async updateOrderStatus(id: number, status: { order_status: string; payment_status?: string }) {
    try {
      const response = await apiClient.put(`/admin/orders/${id}/status`, status);
      return response.data;
    } catch {
      const ord = fallbackOrders.find((o) => o.id === id);
      if (ord) {
        ord.order_status = status.order_status as any;
        if (status.payment_status) ord.payment_status = status.payment_status as any;
      }
      return { success: true, message: 'Status updated locally' };
    }
  },

  async getCustomerOrders() {
    try {
      const response = await apiClient.get('/customer/orders');
      return response.data;
    } catch {
      return { success: true, data: fallbackOrders.slice(0, 2) };
    }
  },
};

export const fallbackOrders: Order[] = [
  {
    id: 1,
    order_number: 'ORD-20261003-90124',
    customer_name: 'Farhan Ahmed',
    customer_email: 'farhan.ahmed@example.com',
    customer_phone: '+8801712345678',
    delivery_address: 'House 42, Road 11, Block D, Banani, Dhaka 1213',
    subtotal: 51000,
    shipping_cost: 60,
    total: 51060,
    payment_status: 'paid',
    order_status: 'shipped',
    created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    items: [
      { id: 101, order_id: 1, product_id: 1, product_name: 'Sony WH-1000XM5 Wireless Headphones', quantity: 1, price: 38500, subtotal: 38500 },
      { id: 102, order_id: 1, product_id: 3, product_name: 'Logitech MX Master 3S Mouse', quantity: 1, price: 12500, subtotal: 12500 },
    ],
    delivery: {
      id: 201,
      order_id: 1,
      courier: 'carrybee',
      consignment_id: 'CB-CON-20261003-55102',
      tracking_number: 'CB-TRK-78A91F2',
      status: 'in_transit',
      response: {
        timeline: [
          { status: 'Order Booked with CarryBee Hub', time: 'Yesterday 10:00 AM' },
          { status: 'Parcel Picked Up by Courier Agent', time: 'Yesterday 04:00 PM' },
          { status: 'In Transit to Banani Sorting Center', time: 'Today 08:30 AM' },
        ],
      },
    },
  },
  {
    id: 2,
    order_number: 'ORD-20261002-88410',
    customer_name: 'Nadia Rahman',
    customer_email: 'nadia.rahman@example.com',
    customer_phone: '+8801819876543',
    delivery_address: 'Road 4, House 18, Nasirabad Housing Society, Chattogram',
    subtotal: 49500,
    shipping_cost: 120,
    total: 49620,
    payment_status: 'paid',
    order_status: 'delivered',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    items: [
      { id: 103, order_id: 2, product_id: 2, product_name: 'Apple Watch Series 9 GPS 45mm', quantity: 1, price: 49500, subtotal: 49500 },
    ],
    delivery: {
      id: 202,
      order_id: 2,
      courier: 'carrybee',
      consignment_id: 'CB-CON-20261002-44199',
      tracking_number: 'CB-TRK-8819283',
      status: 'delivered',
      response: {
        timeline: [
          { status: 'Parcel Picked Up by CarryBee Hub', time: '2 days ago' },
          { status: 'Dispatched to Chattogram Regional Hub', time: 'Yesterday' },
          { status: 'Delivered to Nadia Rahman (Signature Verified)', time: 'Today 11:30 AM' },
        ],
      },
    },
  },
  {
    id: 3,
    order_number: 'ORD-20261004-12948',
    customer_name: 'Tanvir Hassan',
    customer_email: 'tanvir.h@example.com',
    customer_phone: '+8801912987654',
    delivery_address: 'Apartment 5B, Road 18, Sector 7, Uttara, Dhaka',
    subtotal: 26800,
    shipping_cost: 60,
    total: 26860,
    payment_status: 'paid',
    order_status: 'processing',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    items: [
      { id: 104, order_id: 3, product_id: 7, product_name: 'Bellroy Transit Backpack 28L', quantity: 1, price: 26800, subtotal: 26800 },
    ],
    delivery: {
      id: 203,
      order_id: 3,
      courier: 'carrybee',
      consignment_id: 'CB-CON-20261004-99881',
      tracking_number: 'CB-TRK-9001882',
      status: 'booked',
      response: {
        timeline: [
          { status: 'Consignment Booked in CarryBee Courier Sandbox', time: 'Today 01:00 PM' },
        ],
      },
    },
  },
  {
    id: 4,
    order_number: 'ORD-20261004-33819',
    customer_name: 'Saima Chowdhury',
    customer_email: 'saima.c@example.com',
    customer_phone: '+8801755667788',
    delivery_address: 'House 14, Road 27, Dhanmondi, Dhaka',
    subtotal: 17500,
    shipping_cost: 60,
    total: 17560,
    payment_status: 'pending',
    order_status: 'pending',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    items: [
      { id: 105, order_id: 4, product_id: 12, product_name: 'Nothing Ear (2024) Wireless Earbuds', quantity: 1, price: 17500, subtotal: 17500 },
    ],
  },
  {
    id: 5,
    order_number: 'ORD-20261001-44719',
    customer_name: 'Rafiqul Islam',
    customer_email: 'rafiqul.i@example.com',
    customer_phone: '+8801611223344',
    delivery_address: 'Kashani Villa, Zindabazar, Sylhet',
    subtotal: 14200,
    shipping_cost: 120,
    total: 14320,
    payment_status: 'failed',
    order_status: 'cancelled',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    items: [
      { id: 106, order_id: 5, product_id: 6, product_name: 'Anker 737 Power Bank (PowerCore 24K)', quantity: 1, price: 14200, subtotal: 14200 },
    ],
  },
];
