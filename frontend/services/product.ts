import apiClient from './api';
import { Product } from '@/types';

export const fallbackProducts: Product[] = [
  {
    id: 1,
    name: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
    slug: 'sony-wh-1000xm5',
    sku: 'AUD-SNY-001',
    description: 'Industry-leading noise cancellation with two processors and 8 microphones. Up to 30-hour battery life with quick charging. Ultra-comfortable lightweight design.',
    price: 38500.00,
    stock_quantity: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    in_stock: true,
    is_low_stock: false,
  },
  {
    id: 2,
    name: 'Apple Watch Series 9 GPS 45mm Midnight',
    slug: 'apple-watch-series-9',
    sku: 'WCH-APL-002',
    description: 'Powerful S9 SiP chip with Double Tap gesture control. Advanced health and fitness tracking, ECG, blood oxygen, and brighter Always-On Retina display.',
    price: 49500.00,
    stock_quantity: 8,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    in_stock: true,
    is_low_stock: false,
  },
  {
    id: 3,
    name: 'Logitech MX Master 3S Wireless Performance Mouse',
    slug: 'logitech-mx-master-3s',
    sku: 'PER-LOG-003',
    description: 'Quiet clicks with 8K DPI any-surface tracking. MagSpeed electromagnetic scrolling. Ergonomic silhouette crafted for palm comfort.',
    price: 12500.00,
    stock_quantity: 24,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
    in_stock: true,
    is_low_stock: false,
  },
  {
    id: 4,
    name: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard',
    slug: 'keychron-q1-pro',
    sku: 'KEY-KCR-004',
    description: 'Full metal CNC aluminum body 75% layout. QMK/VIA programmable with hot-swappable mechanical switches and double-gasket acoustic design.',
    price: 21500.00,
    stock_quantity: 4,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    in_stock: true,
    is_low_stock: true,
  },
  {
    id: 5,
    name: 'Fujifilm X-T5 Mirrorless Camera Body Black',
    slug: 'fujifilm-x-t5',
    sku: 'CAM-FUJ-005',
    description: '40.2MP X-Trans CMOS 5 HR sensor with 7 stops of in-body image stabilization (IBIS). Classic dial-based manual exposure operations.',
    price: 195000.00,
    stock_quantity: 3,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
    in_stock: true,
    is_low_stock: true,
  },
  {
    id: 6,
    name: 'Anker 737 Power Bank (PowerCore 24K 140W)',
    slug: 'anker-737-power-bank',
    sku: 'PWR-ANK-006',
    description: 'Ultra-powerful 140W two-way fast charging with smart digital display. 24,000mAh capacity capable of charging laptops, phones, and tablets.',
    price: 14200.00,
    stock_quantity: 19,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1609592426504-89dff5f3fb1a?w=800&auto=format&fit=crop&q=80',
    in_stock: true,
    is_low_stock: false,
  },
  {
    id: 7,
    name: 'Bellroy Transit Backpack 28L Water-Resistant',
    slug: 'bellroy-transit-backpack',
    sku: 'BAG-BEL-007',
    description: 'Premium everyday carry and travel backpack. Separate quick-access laptop compartment, hidden side water bottle pockets, and recycled Baida ripstop.',
    price: 26800.00,
    stock_quantity: 12,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    in_stock: true,
    is_low_stock: false,
  },
  {
    id: 8,
    name: 'Bose SoundLink Flex Bluetooth Portable Speaker',
    slug: 'bose-soundlink-flex',
    sku: 'SPK-BOS-008',
    description: 'Clear, deep audio with PositionIQ technology that optimizes sound in any orientation. IP67 waterproof, dustproof, and floats in water.',
    price: 16500.00,
    stock_quantity: 16,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
    in_stock: true,
    is_low_stock: false,
  },
];

export const productService = {
  async getProducts(params?: { search?: string; sort?: string; in_stock_only?: boolean; per_page?: number }) {
    try {
      const response = await apiClient.get('/products', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, using fallback products:', error);
      let list = [...fallbackProducts];
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      }
      if (params?.in_stock_only) {
        list = list.filter(p => p.stock_quantity > 0);
      }
      return {
        success: true,
        data: list,
        meta: { current_page: 1, last_page: 1, per_page: list.length, total: list.length },
      };
    }
  },

  async getProduct(idOrSlug: string | number) {
    try {
      const response = await apiClient.get(`/products/${idOrSlug}`);
      return response.data.data as Product;
    } catch (error) {
      console.warn('Backend unavailable, locating in fallback catalog:', error);
      const match = fallbackProducts.find(
        p => p.id === Number(idOrSlug) || p.slug === idOrSlug
      );
      if (match) return match;
      throw error;
    }
  },

  async getAdminProducts(params?: { search?: string; status?: string; low_stock?: boolean; per_page?: number; page?: number }) {
    const response = await apiClient.get('/admin/products', { params });
    return response.data;
  },

  async createProduct(data: FormData | Partial<Product>) {
    // Note: apiClient automatically handles FormData and lets the browser generate the multipart boundary
    const response = await apiClient.post('/admin/products', data);
    return response.data;
  },

  async updateProduct(id: number | string, data: FormData | Partial<Product>) {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    if (isFormData) {
      // In PHP/Laravel, multipart PUT requests require method spoofing via POST with _method=PUT
      data.append('_method', 'PUT');
      const response = await apiClient.post(`/admin/products/${id}`, data);
      return response.data;
    }
    const response = await apiClient.put(`/admin/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: number | string) {
    const response = await apiClient.delete(`/admin/products/${id}`);
    return response.data;
  },

  async addInventory(id: number | string, data: { quantity: number; reason: string; action?: string }) {
    const response = await apiClient.post(`/admin/products/${id}/inventory/add`, {
      action: 'ADD',
      ...data,
    });
    return response.data;
  },

  async removeInventory(id: number | string, data: { quantity: number; reason: string; action?: string }) {
    const response = await apiClient.post(`/admin/products/${id}/inventory/remove`, {
      action: 'REMOVE',
      ...data,
    });
    return response.data;
  },

  async getInventoryHistory(id: number | string, params?: { per_page?: number; page?: number }) {
    const response = await apiClient.get(`/admin/products/${id}/inventory/history`, { params });
    return response.data;
  },

  async getLowStockProducts() {
    const response = await apiClient.get('/admin/products/low-stock');
    return response.data;
  },
};
