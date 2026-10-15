import { CompanySettings, Client, Product, Invoice, User } from './types';

const BASE_SETTINGS_KEY = 'billu_settings';
const BASE_CLIENTS_KEY = 'billu_clients';
const BASE_PRODUCTS_KEY = 'billu_products';
const BASE_INVOICES_KEY = 'billu_invoices';
const BASE_LAST_SYNC_KEY = 'billu_last_sync_timestamp';

const AUTH_USER_KEY = 'billu_auth_user';
const AUTH_TOKEN_KEY = 'billu_auth_token';

export const DEFAULT_SETTINGS: CompanySettings = {
  id: 'default',
  name: 'My Business',
  tagline: 'Smart Invoicing & Billing',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gstin: '',
  pan: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  upiId: '',
  logoUrl: '',
  signatureUrl: '',
  terms: '1. Payment due within 15 days of invoice date.\n2. Interest @ 18% p.a. will be charged on overdue payments.\n3. Goods once sold will not be taken back.',
  notes: 'Thank you for your business!',
  currency: 'INR',
  currencySymbol: '₹',
  taxType: 'GST',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'client-1',
    name: 'Reliance Infocomm Ltd',
    phone: '+91 98200 11223',
    email: 'procurement@relianceinfo.com',
    billingAddress: 'Tower B, Tech Park, Bandra Kurla Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    gstin: '27AABCR1234F1Z5',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'client-2',
    name: 'Tata Consultancy Systems',
    phone: '+91 98330 44556',
    email: 'accounts@tatacs.com',
    billingAddress: 'Infocity Campus, Hinjawadi Phase 1',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411057',
    gstin: '27AAACT5678K1ZQ',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Cloud Infrastructure Setup & Maintenance',
    description: 'High-availability Kubernetes and Neon DB cluster deployment',
    hsn: '998313',
    price: 35000,
    unit: 'service',
    taxRate: 18,
    stock: 99,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Enterprise Mobile App Development',
    description: 'Next.js + Capacitor cross-platform iOS & Android billing suite',
    hsn: '998314',
    price: 75000,
    unit: 'service',
    taxRate: 18,
    stock: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Hardware POS Barcode Scanner Pro',
    description: 'Wireless Bluetooth 2D QR and Barcode scanner for retail',
    hsn: '847190',
    price: 4500,
    unit: 'pcs',
    taxRate: 18,
    stock: 25,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-0001',
    date: '2026-10-01',
    dueDate: '2026-10-16',
    clientId: 'client-1',
    client: DEFAULT_CLIENTS[0],
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        name: 'Cloud Infrastructure Setup & Maintenance',
        description: 'Neon DB cluster deployment and monitoring',
        hsn: '998313',
        quantity: 1,
        unit: 'service',
        price: 35000,
        discountPercent: 0,
        taxRate: 18,
        amount: 35000,
        taxAmount: 6300,
      },
    ],
    subtotal: 35000,
    discountType: 'flat',
    discountValue: 0,
    discountAmount: 0,
    taxType: 'GST_INTRA_STATE',
    taxAmount: 6300,
    cgstAmount: 3150,
    sgstAmount: 3150,
    igstAmount: 0,
    roundOff: 0,
    grandTotal: 41300,
    notes: 'Thank you for your business!',
    terms: 'Payment due within 15 days.',
    status: 'paid',
    paymentReceivedDate: '2026-10-03',
    paymentMode: 'UPI',
    createdAt: '2026-10-01T10:00:00Z',
  },
];

class StorageService {
  private currentUserId: string | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // --- USER CONTEXT & MULTI-TENANCY ISOLATION ---
  setUserId(userId: string | null): void {
    this.currentUserId = userId;
  }

  getUserId(): string | null {
    return this.currentUserId;
  }

  private getKey(base: string): string {
    return this.currentUserId ? `${base}_${this.currentUserId}` : base;
  }

  // --- AUTHENTICATION STORAGE (For Capacitor & Client Resilience) ---
  getStoredToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  getStoredUser(): User | null {
    if (!this.isBrowser()) return null;
    try {
      const data = localStorage.getItem(AUTH_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setStoredAuth(user: User, token: string): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      this.setUserId(user.id);
    } catch (e) {
      console.error('Failed to store auth state', e);
    }
  }

  clearAuth(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      this.currentUserId = null;
    } catch (e) {
      console.error('Failed to clear auth state', e);
    }
  }

  // Helper to attach authorization header on API calls
  getAuthHeaders(): Record<string, string> {
    const token = this.getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- SETTINGS (Scoped to active User) ---
  getSettings(fallbackUser?: User | null): CompanySettings {
    if (!this.isBrowser()) return DEFAULT_SETTINGS;
    try {
      const key = this.getKey(BASE_SETTINGS_KEY);
      const data = localStorage.getItem(key);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
      // If personalized for new user
      if (fallbackUser) {
        return {
          ...DEFAULT_SETTINGS,
          id: fallbackUser.id,
          userId: fallbackUser.id,
          name: fallbackUser.companyName || `${fallbackUser.name}'s Business`,
          email: fallbackUser.email,
          phone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          gstin: '',
          pan: '',
          bankName: '',
          accountNumber: '',
          ifsc: '',
          upiId: '',
          logoUrl: '',
          signatureUrl: '',
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: CompanySettings): void {
    if (!this.isBrowser()) return;
    try {
      const key = this.getKey(BASE_SETTINGS_KEY);
      localStorage.setItem(key, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  // --- CLIENTS (Scoped to active User) ---
  getClients(): Client[] {
    if (!this.isBrowser()) return DEFAULT_CLIENTS;
    try {
      const key = this.getKey(BASE_CLIENTS_KEY);
      const data = localStorage.getItem(key);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  saveClients(clients: Client[]): void {
    if (!this.isBrowser()) return;
    const key = this.getKey(BASE_CLIENTS_KEY);
    localStorage.setItem(key, JSON.stringify(clients));
  }

  addClient(client: Omit<Client, 'id' | 'createdAt'>): Client {
    const clients = this.getClients();
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    clients.unshift(newClient);
    this.saveClients(clients);
    return newClient;
  }

  updateClient(client: Client): void {
    const clients = this.getClients().map((c) => (c.id === client.id ? client : c));
    this.saveClients(clients);
  }

  deleteClient(id: string): void {
    const clients = this.getClients().filter((c) => c.id !== id);
    this.saveClients(clients);
  }

  // --- PRODUCTS (Scoped to active User) ---
  getProducts(): Product[] {
    if (!this.isBrowser()) return DEFAULT_PRODUCTS;
    try {
      const key = this.getKey(BASE_PRODUCTS_KEY);
      const data = localStorage.getItem(key);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  saveProducts(products: Product[]): void {
    if (!this.isBrowser()) return;
    const key = this.getKey(BASE_PRODUCTS_KEY);
    localStorage.setItem(key, JSON.stringify(products));
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    products.unshift(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  updateProduct(product: Product): void {
    const products = this.getProducts().map((p) => (p.id === product.id ? product : p));
    this.saveProducts(products);
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    this.saveProducts(products);
  }

  // --- INVOICES (Scoped to active User) ---
  getInvoices(): Invoice[] {
    if (!this.isBrowser()) return DEFAULT_INVOICES;
    try {
      const key = this.getKey(BASE_INVOICES_KEY);
      const data = localStorage.getItem(key);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  saveInvoices(invoices: Invoice[]): void {
    if (!this.isBrowser()) return;
    const key = this.getKey(BASE_INVOICES_KEY);
    localStorage.setItem(key, JSON.stringify(invoices));
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find((inv) => inv.id === id);
  }

  addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Invoice {
    const invoices = this.getInvoices();
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      userId: this.currentUserId || undefined,
      createdAt: new Date().toISOString(),
    };
    invoices.unshift(newInvoice);
    this.saveInvoices(invoices);
    return newInvoice;
  }

  updateInvoice(invoice: Invoice): void {
    const invoices = this.getInvoices().map((inv) => (inv.id === invoice.id ? invoice : inv));
    this.saveInvoices(invoices);
  }

  deleteInvoice(id: string): void {
    const invoices = this.getInvoices().filter((inv) => inv.id !== id);
    this.saveInvoices(invoices);
  }

  getNextInvoiceNumber(): string {
    const invoices = this.getInvoices();
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `INV-${year}-${count.toString().padStart(4, '0')}`;
  }

  // --- SYNC CACHING & TTL (Per-User Caching) ---
  getLastSync(): number {
    if (!this.isBrowser()) return 0;
    try {
      const key = this.getKey(BASE_LAST_SYNC_KEY);
      const val = localStorage.getItem(key);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  setLastSync(timestamp: number = Date.now()): void {
    if (!this.isBrowser()) return;
    try {
      const key = this.getKey(BASE_LAST_SYNC_KEY);
      localStorage.setItem(key, timestamp.toString());
    } catch (e) {
      console.error('Failed to update sync timestamp', e);
    }
  }

  shouldSync(ttlMinutes = 15): boolean {
    const lastSync = this.getLastSync();
    if (!lastSync) return true;
    const elapsedMs = Date.now() - lastSync;
    return elapsedMs > ttlMinutes * 60 * 1000;
  }
}

export const storage = new StorageService();
