import { CompanySettings, Client, Product, Invoice } from './types';

const SETTINGS_KEY = 'billu_settings';
const CLIENTS_KEY = 'billu_clients';
const PRODUCTS_KEY = 'billu_products';
const INVOICES_KEY = 'billu_invoices';
const LAST_SYNC_KEY = 'billu_last_sync_timestamp';

export const DEFAULT_SETTINGS: CompanySettings = {
  id: 'default',
  name: 'Acme Solutions Pvt Ltd',
  tagline: 'Leading Business Technology & Services',
  email: 'contact@acmesolutions.in',
  phone: '+91 98765 43210',
  address: 'Suite 402, Pinnacle Business Park, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400069',
  gstin: '27AABCU9603R1ZM',
  pan: 'AABCU9603R',
  bankName: 'HDFC Bank Ltd',
  accountNumber: '50200012345678',
  ifsc: 'HDFC0000123',
  upiId: 'acmesolutions@hdfcbank',
  logoUrl: '',
  signatureUrl: '',
  terms: '1. Payment due within 15 days of invoice date.\n2. Interest @ 18% p.a. will be charged on overdue payments.\n3. Goods once sold will not be taken back.',
  notes: 'Thank you for your business! Please scan the QR code or transfer to the bank account above.',
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
  {
    id: 'client-3',
    name: 'Bangalore Web Labs',
    phone: '+91 99887 66554',
    email: 'billing@weblabs.io',
    billingAddress: '42, 100 Feet Rd, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    gstin: '29AABCB8899M1ZU',
    createdAt: new Date().toISOString(),
  }
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
  {
    id: 'prod-4',
    name: 'Thermal Receipt Rolls (Box of 50)',
    description: '3-inch high-density thermal paper rolls for POS printers',
    hsn: '481190',
    price: 1200,
    unit: 'box',
    taxRate: 12,
    stock: 100,
    createdAt: new Date().toISOString(),
  }
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
      {
        id: 'item-2',
        productId: 'prod-3',
        name: 'Hardware POS Barcode Scanner Pro',
        description: 'Wireless Bluetooth scanner',
        hsn: '847190',
        quantity: 2,
        unit: 'pcs',
        price: 4500,
        discountPercent: 5,
        taxRate: 18,
        amount: 8550,
        taxAmount: 1539,
      }
    ],
    subtotal: 43550,
    discountType: 'flat',
    discountValue: 0,
    discountAmount: 0,
    taxType: 'GST_INTRA_STATE',
    taxAmount: 7839,
    cgstAmount: 3919.5,
    sgstAmount: 3919.5,
    igstAmount: 0,
    roundOff: 0.10,
    grandTotal: 51389,
    notes: 'Thank you for your partnership!',
    terms: 'Payment due within 15 days.',
    status: 'paid',
    paymentReceivedDate: '2026-10-03',
    paymentMode: 'UPI',
    createdAt: '2026-10-01T10:00:00Z',
  }
];

class StorageService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // --- SETTINGS ---
  getSettings(): CompanySettings {
    if (!this.isBrowser()) return DEFAULT_SETTINGS;
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: CompanySettings): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  // --- CLIENTS ---
  getClients(): Client[] {
    if (!this.isBrowser()) return DEFAULT_CLIENTS;
    try {
      const data = localStorage.getItem(CLIENTS_KEY);
      if (!data) {
        this.saveClients(DEFAULT_CLIENTS);
        return DEFAULT_CLIENTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_CLIENTS;
    }
  }

  saveClients(clients: Client[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }

  addClient(client: Omit<Client, 'id' | 'createdAt'>): Client {
    const clients = this.getClients();
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    clients.unshift(newClient);
    this.saveClients(clients);
    return newClient;
  }

  updateClient(client: Client): void {
    const clients = this.getClients().map(c => (c.id === client.id ? client : c));
    this.saveClients(clients);
  }

  deleteClient(id: string): void {
    const clients = this.getClients().filter(c => c.id !== id);
    this.saveClients(clients);
  }

  // --- PRODUCTS ---
  getProducts(): Product[] {
    if (!this.isBrowser()) return DEFAULT_PRODUCTS;
    try {
      const data = localStorage.getItem(PRODUCTS_KEY);
      if (!data) {
        this.saveProducts(DEFAULT_PRODUCTS);
        return DEFAULT_PRODUCTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_PRODUCTS;
    }
  }

  saveProducts(products: Product[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    products.unshift(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  updateProduct(product: Product): void {
    const products = this.getProducts().map(p => (p.id === product.id ? product : p));
    this.saveProducts(products);
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
  }

  // --- INVOICES ---
  getInvoices(): Invoice[] {
    if (!this.isBrowser()) return DEFAULT_INVOICES;
    try {
      const data = localStorage.getItem(INVOICES_KEY);
      if (!data) {
        this.saveInvoices(DEFAULT_INVOICES);
        return DEFAULT_INVOICES;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_INVOICES;
    }
  }

  saveInvoices(invoices: Invoice[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find(inv => inv.id === id);
  }

  addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Invoice {
    const invoices = this.getInvoices();
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    invoices.unshift(newInvoice);
    this.saveInvoices(invoices);
    return newInvoice;
  }

  updateInvoice(invoice: Invoice): void {
    const invoices = this.getInvoices().map(inv => (inv.id === invoice.id ? invoice : inv));
    this.saveInvoices(invoices);
  }

  deleteInvoice(id: string): void {
    const invoices = this.getInvoices().filter(inv => inv.id !== id);
    this.saveInvoices(invoices);
  }

  getNextInvoiceNumber(): string {
    const invoices = this.getInvoices();
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `INV-${year}-${count.toString().padStart(4, '0')}`;
  }

  // --- SYNC CACHING & TTL (Limit Neon DB calls) ---
  getLastSync(): number {
    if (!this.isBrowser()) return 0;
    try {
      const val = localStorage.getItem(LAST_SYNC_KEY);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  setLastSync(timestamp: number = Date.now()): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
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
