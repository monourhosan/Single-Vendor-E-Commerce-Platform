import apiClient from './api';
import { DashboardStats, PublicSettings } from '@/types';

export const settingsService = {
  async getPublicSettings(): Promise<PublicSettings> {
    try {
      const response = await apiClient.get('/settings/public');
      return response.data;
    } catch {
      return {
        store_name: 'ShopLagbe E-Commerce',
        currency: 'BDT',
        currency_symbol: '৳',
        shipping_inside_dhaka: 60,
        shipping_outside_dhaka: 120,
        default_shipping_cost: 60,
        active_gateways: ['bkash', 'sslcommerz', 'cod'],
      };
    }
  },

  async getAdminSettings() {
    try {
      const response = await apiClient.get('/admin/settings');
      return response.data.data;
    } catch {
      return {
        general: [
          { key: 'store_name', value: 'ShopLagbe E-Commerce', group: 'general', description: 'Store name' },
          { key: 'store_email', value: 'support@shoplagbe.com', group: 'general', description: 'Support email' },
          { key: 'store_phone', value: '+880 1700-000000', group: 'general', description: 'Support phone' },
        ],
        delivery: [
          { key: 'default_shipping_cost', value: '60', group: 'delivery', description: 'Base shipping cost' },
          { key: 'shipping_inside_dhaka', value: '60', group: 'delivery', description: 'Inside Dhaka fee' },
          { key: 'shipping_outside_dhaka', value: '120', group: 'delivery', description: 'Outside Dhaka fee' },
          { key: 'carrybee_base_url', value: 'https://api.carrybee.com/v1', group: 'delivery', description: 'CarryBee API endpoint' },
          { key: 'carrybee_client_id', value: 'carrybee_sandbox_client_id', group: 'delivery', description: 'CarryBee Client ID' },
          { key: 'carrybee_client_secret', value: '••••••••••••••••••••', group: 'delivery', description: 'CarryBee Client Secret' },
        ],
        payment: [
          { key: 'bkash_base_url', value: 'https://tokenized.sandbox.bka.sh/v2.0', group: 'payment', description: 'bKash sandbox URL' },
          { key: 'bkash_app_key', value: 'sandbox_bkash_app_key_demo', group: 'payment', description: 'bKash App Key' },
          { key: 'bkash_app_secret', value: '••••••••••••••••••••', group: 'payment', description: 'bKash App Secret' },
          { key: 'sslc_store_id', value: 'testbox', group: 'payment', description: 'SSLCommerz Store ID' },
          { key: 'sslc_store_password', value: '••••••••', group: 'payment', description: 'SSLCommerz Store Password' },
          { key: 'sslc_sandbox', value: 'true', group: 'payment', description: 'SSLCommerz Sandbox Mode' },
        ],
      };
    }
  },

  async updateSettings(settings: Array<{ key: string; value: any; group?: string; type?: string }>) {
    const response = await apiClient.post('/admin/settings', { settings });
    return response.data;
  },

  async getDashboardStats(): Promise<{ stats: DashboardStats; recent_orders: any[] }> {
    try {
      const response = await apiClient.get('/admin/dashboard/stats');
      return response.data;
    } catch {
      return {
        stats: {
          total_revenue: 385000,
          total_orders: 18,
          pending_orders: 3,
          total_products: 12,
          low_stock_alerts: 2,
          deliveries: { booked: 5, in_transit: 8, delivered: 5 },
        },
        recent_orders: [],
      };
    }
  },
};
