export interface CompanySettings {
  id: string;
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  logoUrl?: string;
  signatureUrl?: string;
  terms: string;
  notes: string;
  currency: string;
  currencySymbol: string;
  taxType: 'GST' | 'VAT' | 'SALES_TAX';
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  billingAddress: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  hsn?: string;
  price: number;
  unit: 'pcs' | 'kg' | 'm' | 'hrs' | 'box' | 'pkt' | 'set' | 'service';
  taxRate: number; // e.g. 0, 5, 12, 18, 28
  stock?: number;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  hsn?: string;
  quantity: number;
  unit: string;
  price: number;
  discountPercent: number;
  taxRate: number;
  amount: number; // Calculated (qty * price * (1 - discount%))
  taxAmount: number; // Calculated
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientId: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'percent' | 'flat';
  discountValue: number;
  discountAmount: number;
  taxType: 'GST_INTER_STATE' | 'GST_INTRA_STATE' | 'FLAT_TAX'; // CGST+SGST vs IGST
  taxAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  roundOff: number;
  grandTotal: number;
  notes?: string;
  terms?: string;
  signatureData?: string; // Base64 data URL
  signatureType?: 'drawn' | 'uploaded' | 'none';
  signatoryName?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  paymentReceivedDate?: string;
  paymentMode?: 'UPI' | 'Bank Transfer' | 'Cash' | 'Cheque';
  createdAt: string;
}
