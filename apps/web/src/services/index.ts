import api from '@/lib/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  ecoScore: number;
  images: string[];
  badges: string[];
  // Campos de trazabilidad
  fechaProduccion?: string;
  origenRegion?: string;
  fechaVencimiento?: string;
  certificacionPdfUrl?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  motivoRechazo?: string;
  providerId?: string;
}

export interface ProductsResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface ProductFilters {
  category?: string;
  minEcoScore?: number;
  badge?: string;
  search?: string;
  page?: number;
  size?: number;
  status?: string;
}

export const productService = {
  getAll: async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
    const { data } = await api.get('/api/products', { params: filters });
    return data;
  },
  getById: async (id: string): Promise<Product> => {
    const { data } = await api.get(`/api/products/${id}`);
    return data;
  },
  // Productor: crear producto (JSON o FormData)
  createProduct: async (payload: FormData | Record<string, unknown>) => {
    if (payload instanceof FormData) {
      const { data } = await api.post('/api/products', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    }
    const { data } = await api.post('/api/products', payload);
    return data;
  },
  // Productor: actualizar producto
  updateProduct: async (id: string, formData: FormData) => {
    const { data } = await api.put(`/api/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export const authService = {
  login: async (email: string, password: string, turnstileToken: string) => {
    const { data } = await api.post('/api/auth/login', { email, password, turnstileToken });
    return data;
  },
  register: async (email: string, password: string, fullName: string, phone?: string, turnstileToken?: string) => {
    const { data } = await api.post('/api/auth/register', { email, password, fullName, phone, turnstileToken });
    return data;
  },
  registerProducer: async (producerData: Record<string, unknown>) => {
    const { data } = await api.post('/api/auth/register/producer', producerData);
    return data;
  },
  // Google OAuth 2.0 (exclusivo consumidores)
  googleAuth: async (googleToken: string) => {
    const { data } = await api.post('/api/auth/google', { token: googleToken });
    return data; // { token, user }
  },
  getMe: async () => {
    const { data } = await api.get('/api/auth/me');
    return data;
  },
};

export const paymentService = {
  createCheckoutSession: async (orderId: string) => {
    const { data } = await api.post('/api/payments/create-session', { orderId });
    return data; // { checkoutUrl }
  },
  createOrder: async (items: { productId: string; quantity: number }[]) => {
    const { data } = await api.post('/api/orders', { items });
    return data; // { orderId, totalAmount }
  },
  processLocalPayment: async (orderId: string, method: string, paymentDetails: any, amount: number) => {
    const { data } = await api.post('/api/payments/process-local', { orderId, method, paymentDetails, amount });
    return data; // { success, transactionRef, method }
  },
};

export const auditService = {
  getProductAudit: async (productId: string) => {
    const { data } = await api.get(`/api/audit/product/${productId}`);
    return data;
  },
  // Admin: obtener productos pendientes de auditoría
  getPendingProducts: async () => {
    const { data } = await api.get('/api/audit/pending');
    return data;
  },
  // Admin: aprobar producto
  approveProduct: async (productId: string, auditorId: string) => {
    const { data } = await api.post(`/api/audit/${productId}/approve`, { auditorId });
    return data;
  },
  // Admin: rechazar producto con observaciones
  rejectProduct: async (productId: string, auditorId: string, observaciones: string) => {
    const { data } = await api.post(`/api/audit/${productId}/reject`, {
      auditorId,
      observaciones,
    });
    return data;
  },
  // Admin: generar certificado PDF de auditoría
  generateCertificate: async (productId: string): Promise<Blob> => {
    const response = await api.post(
      `/api/audit/${productId}/generate-certificate`,
      {},
      { responseType: 'blob' }
    );
    return response.data;
  },
  // Productor: auditoría automática con validación química
  producerAnalyze: async (data: {
    product_id: string;
    product_name: string;
    ingredients: string[];
    category: string;
    description: string;
    provider_id: string;
  }) => {
    const { data: result } = await api.post('/api/audit/producer-analyze', data);
    return result as {
      eco_score: number;
      badges: string[];
      status: string;
      issues: string[];
      chemical_analysis: {
        findings: { ingredient: string; matched_as: string; risk: string; reason: string; regulation: string }[];
        risk_summary: { high: number; medium: number; low: number };
        total_penalty: number;
      };
      audit_hash: string;
    };
  },
};
