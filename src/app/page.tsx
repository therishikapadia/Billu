'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CompanySettings,
  Client,
  Product,
  Invoice,
  User,
  Supplier,
  Purchase,
  Expense,
  Receipt,
  Payment,
} from '@/lib/types';
import { storage, DEFAULT_SETTINGS } from '@/lib/storage';
import { accountingStorage } from '@/lib/accounting-storage';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav, NavTab } from '@/components/BottomNav';
import { DashboardScreen } from '@/components/DashboardScreen';
import { InvoicesScreen } from '@/components/InvoicesScreen';
import { CreateBillScreen } from '@/components/CreateBillScreen';
import { PurchasesScreen } from '@/components/PurchasesScreen';
import { CreatePurchaseScreen } from '@/components/CreatePurchaseScreen';
import { ExpensesScreen } from '@/components/ExpensesScreen';
import { ReceiptsPaymentsScreen } from '@/components/ReceiptsPaymentsScreen';
import { ReportsScreen } from '@/components/ReportsScreen';
import { MoreMenuScreen } from '@/components/MoreMenuScreen';
import { SuppliersScreen } from '@/components/SuppliersScreen';
import { ProductsScreen } from '@/components/ProductsScreen';
import { ClientsScreen } from '@/components/ClientsScreen';
import { SettingsScreen } from '@/components/SettingsScreen';
import { InvoiceDetailModal } from '@/components/InvoiceDetailModal';
import { AuthScreen } from '@/components/AuthScreen';
import { SplashScreen } from '@/components/SplashScreen';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  const currentUserRef = useRef<User | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    if (!isAuthChecking) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [isAuthChecking]);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isNeonConnected, setIsNeonConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Core Data - scoped to logged in user
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Accounting Module Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: storage.getAuthHeaders(),
      });
    } catch (e) {
      console.warn('Logout endpoint call failed', e);
    }
    storage.clearAuth();
    accountingStorage.setUserId(null);
    setCurrentUser(null);
    setSettings(DEFAULT_SETTINGS);
    setClients([]);
    setProducts([]);
    setInvoices([]);
    setSuppliers([]);
    setPurchases([]);
    setExpenses([]);
    setReceipts([]);
    setPayments([]);
    setActiveTab('dashboard');
  }, []);

  // Remote Sync Function with TTL Caching
  const syncWithRemote = useCallback(
    async (force = false, userToSync?: User | null) => {
      const activeUser = userToSync || currentUserRef.current;
      if (!activeUser) return;

      if (!force && !storage.shouldSync(15)) {
        return;
      }

      setIsSyncing(true);
      try {
        const authHeaders = storage.getAuthHeaders();
        const res = await fetch('/api/db-status');
        const data = await res.json();

        if (data.connected) {
          setIsNeonConnected(true);
          try {
            // Trigger DB migration check in background
            fetch('/api/migrate', { method: 'POST', headers: authHeaders }).catch(() => {});

            const [sRes, cRes, pRes, iRes, supRes, purRes, expRes, recRes, payRes] = await Promise.all([
              fetch('/api/settings', { headers: authHeaders }).then((r) => r.json()).catch(() => ({})),
              fetch('/api/clients', { headers: authHeaders }).then((r) => r.json()).catch(() => ({})),
              fetch('/api/products', { headers: authHeaders }).then((r) => r.json()).catch(() => ({})),
              fetch('/api/invoices', { headers: authHeaders }).then((r) => r.json()).catch(() => ({})),
              fetch('/api/suppliers', { headers: authHeaders }).then((r) => r.json()).catch(() => ({})),
              fetch('/api/purchases', { headers: authHeaders }).then((r) => r.json()).catch(() => ({})),
              fetch('/api/expenses', { headers: authHeaders }).then((r) => r.json()).catch(() => ({})),
              fetch('/api/receipts', { headers: authHeaders }).then((r) => r.json()).catch(() => ({})),
              fetch('/api/payments', { headers: authHeaders }).then((r) => r.json()).catch(() => ({})),
            ]);

            // If session expired
            if (sRes.status === 401 || cRes.status === 401) {
              handleLogout();
              return;
            }

            if (sRes.data) {
              setSettings((prev) => ({ ...prev, ...sRes.data }));
              storage.saveSettings({ ...storage.getSettings(activeUser), ...sRes.data });
            }
            if (cRes.data) {
              setClients(cRes.data);
              storage.saveClients(cRes.data);
            }
            if (pRes.data) {
              setProducts(pRes.data);
              storage.saveProducts(pRes.data);
            }
            if (iRes.data) {
              setInvoices(iRes.data);
              storage.saveInvoices(iRes.data);
            }
            if (supRes.data) {
              setSuppliers(supRes.data);
              accountingStorage.saveSuppliers(supRes.data);
            }
            if (purRes.data) {
              setPurchases(purRes.data);
              accountingStorage.savePurchases(purRes.data);
            }
            if (expRes.data) {
              setExpenses(expRes.data);
              accountingStorage.saveExpenses(expRes.data);
            }
            if (recRes.data) {
              setReceipts(recRes.data);
              accountingStorage.saveReceipts(recRes.data);
            }
            if (payRes.data) {
              setPayments(payRes.data);
              accountingStorage.savePayments(payRes.data);
            }
            storage.setLastSync();
          } catch (syncErr) {
            console.warn('Neon remote sync fallback to local', syncErr);
          }
        } else {
          setIsNeonConnected(false);
        }
      } catch {
        setIsNeonConnected(false);
      } finally {
        setIsSyncing(false);
      }
    },
    [handleLogout]
  );

  // Load user data into state
  const loadUserData = (user: User) => {
    storage.setUserId(user.id);
    accountingStorage.setUserId(user.id);
    setCurrentUser(user);
    setSettings(storage.getSettings(user));
    setClients(storage.getClients());
    setProducts(storage.getProducts());
    setInvoices(storage.getInvoices());
    setSuppliers(accountingStorage.getSuppliers());
    setPurchases(accountingStorage.getPurchases());
    setExpenses(accountingStorage.getExpenses());
    setReceipts(accountingStorage.getReceipts());
    setPayments(accountingStorage.getPayments());
  };

  // Check auth session on startup
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      try {
        const storedUser = storage.getStoredUser();
        const headers = storage.getAuthHeaders();

        if (storedUser && isMounted) {
          loadUserData(storedUser);
        }

        // Verify with backend
        const res = await fetch('/api/auth/me', { headers });
        if (res.ok) {
          const authData = await res.json();
          if (authData.authenticated && authData.user && isMounted) {
            loadUserData(authData.user);
            syncWithRemote(false, authData.user);
          } else if (isMounted) {
            storage.clearAuth();
            setCurrentUser(null);
          }
        } else if (isMounted) {
          storage.clearAuth();
          setCurrentUser(null);
        }
      } catch {
        const storedUser = storage.getStoredUser();
        if (storedUser && isMounted) {
          loadUserData(storedUser);
        }
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [syncWithRemote]);

  const handleAuthSuccess = (user: User, token: string) => {
    storage.setStoredAuth(user, token);
    loadUserData(user);
    setActiveTab('dashboard');
    setTimeout(() => {
      syncWithRemote(true, user);
    }, 200);
  };

  // --- SETTINGS HANDLERS ---
  const handleSaveSettings = async (newSettings: CompanySettings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);

    if (isNeonConnected) {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(newSettings),
        });
      } catch (e) {
        console.error('Failed to sync settings to Neon DB', e);
      }
    }
  };

  // --- CLIENT HANDLERS ---
  const handleAddClient = async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    const newClient = storage.addClient(clientData);
    setClients(storage.getClients());

    if (isNeonConnected) {
      try {
        await fetch('/api/clients', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(newClient),
        });
      } catch (e) {
        console.error('Failed to sync client to Neon DB', e);
      }
    }
    return newClient;
  };

  const handleUpdateClient = async (client: Client) => {
    storage.updateClient(client);
    setClients(storage.getClients());

    if (isNeonConnected) {
      try {
        await fetch('/api/clients', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(client),
        });
      } catch (e) {
        console.error('Failed to sync client update to Neon DB', e);
      }
    }
  };

  const handleDeleteClient = async (id: string) => {
    storage.deleteClient(id);
    setClients(storage.getClients());

    if (isNeonConnected) {
      try {
        await fetch(`/api/clients?id=${id}`, {
          method: 'DELETE',
          headers: storage.getAuthHeaders(),
        });
      } catch (e) {
        console.error('Failed to delete client from Neon DB', e);
      }
    }
  };

  // --- SUPPLIER HANDLERS ---
  const handleAddSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> => {
    const newSupplier = accountingStorage.addSupplier(supplierData);
    setSuppliers(accountingStorage.getSuppliers());

    if (isNeonConnected) {
      try {
        await fetch('/api/suppliers', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(newSupplier),
        });
      } catch (e) {
        console.error('Failed to sync supplier to Neon DB', e);
      }
    }
    return newSupplier;
  };

  const handleUpdateSupplier = async (supplier: Supplier) => {
    accountingStorage.updateSupplier(supplier);
    setSuppliers(accountingStorage.getSuppliers());

    if (isNeonConnected) {
      try {
        await fetch('/api/suppliers', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(supplier),
        });
      } catch (e) {
        console.error('Failed to sync supplier update to Neon DB', e);
      }
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    accountingStorage.deleteSupplier(id);
    setSuppliers(accountingStorage.getSuppliers());

    if (isNeonConnected) {
      try {
        await fetch(`/api/suppliers?id=${id}`, {
          method: 'DELETE',
          headers: storage.getAuthHeaders(),
        });
      } catch (e) {
        console.error('Failed to delete supplier from Neon DB', e);
      }
    }
  };

  // --- PRODUCT HANDLERS ---
  const handleAddProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct = storage.addProduct(productData);
    setProducts(storage.getProducts());

    if (isNeonConnected) {
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(newProduct),
        });
      } catch (e) {
        console.error('Failed to sync product to Neon DB', e);
      }
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    storage.updateProduct(product);
    setProducts(storage.getProducts());

    if (isNeonConnected) {
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(product),
        });
      } catch (e) {
        console.error('Failed to sync product update to Neon DB', e);
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    storage.deleteProduct(id);
    setProducts(storage.getProducts());

    if (isNeonConnected) {
      try {
        await fetch(`/api/products?id=${id}`, {
          method: 'DELETE',
          headers: storage.getAuthHeaders(),
        });
      } catch (e) {
        console.error('Failed to delete product from Neon DB', e);
      }
    }
  };

  // --- INVOICE HANDLERS ---
  const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice = storage.addInvoice(invoiceData);
    setInvoices(storage.getInvoices());

    // Automatically decrement product stock for items sold
    if (Array.isArray(newInvoice.items)) {
      newInvoice.items.forEach((item) => {
        if (item.productId) {
          const currentProd = storage.getProducts().find((p) => p.id === item.productId);
          if (currentProd && currentProd.stock !== undefined) {
            const updatedProd = { ...currentProd, stock: Math.max(0, currentProd.stock - (item.quantity || 1)) };
            storage.updateProduct(updatedProd);
          }
        }
      });
      setProducts(storage.getProducts());
    }

    if (isNeonConnected) {
      try {
        await fetch('/api/invoices', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify({
            ...newInvoice,
            clientData: newInvoice.client,
          }),
        });
      } catch (e) {
        console.error('Failed to sync invoice to Neon DB', e);
      }
    }

    setSelectedInvoice(newInvoice);
    setActiveTab('invoices');
  };

  const handleToggleInvoiceStatus = async (invoice: Invoice) => {
    const updatedStatus: Invoice['status'] = invoice.status === 'paid' ? 'pending' : 'paid';
    const updated: Invoice = {
      ...invoice,
      status: updatedStatus,
      paymentReceivedDate: updatedStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
    };
    storage.updateInvoice(updated);
    setInvoices(storage.getInvoices());
    if (selectedInvoice && selectedInvoice.id === invoice.id) {
      setSelectedInvoice(updated);
    }

    if (isNeonConnected) {
      try {
        await fetch('/api/invoices', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify({
            ...updated,
            clientData: updated.client,
          }),
        });
      } catch (e) {
        console.error('Failed to sync invoice status to Neon DB', e);
      }
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    storage.deleteInvoice(id);
    setInvoices(storage.getInvoices());

    if (isNeonConnected) {
      try {
        await fetch(`/api/invoices?id=${id}`, {
          method: 'DELETE',
          headers: storage.getAuthHeaders(),
        });
      } catch (e) {
        console.error('Failed to delete invoice from Neon DB', e);
      }
    }
  };

  // --- PURCHASE HANDLERS ---
  const handleSavePurchase = async (purchaseData: Omit<Purchase, 'id' | 'createdAt'>) => {
    const newPurchase = accountingStorage.addPurchase(purchaseData);
    setPurchases(accountingStorage.getPurchases());

    // Automatically increment product stock for items received
    if (Array.isArray(newPurchase.items)) {
      newPurchase.items.forEach((item) => {
        if (item.productId) {
          const currentProd = storage.getProducts().find((p) => p.id === item.productId);
          if (currentProd) {
            const updatedProd = {
              ...currentProd,
              stock: (currentProd.stock || 0) + (item.quantity || 1),
              purchasePrice: item.price || currentProd.purchasePrice,
            };
            storage.updateProduct(updatedProd);
          }
        }
      });
      setProducts(storage.getProducts());
    }

    if (isNeonConnected) {
      try {
        await fetch('/api/purchases', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(newPurchase),
        });
      } catch (e) {
        console.error('Failed to sync purchase to Neon DB', e);
      }
    }

    setActiveTab('purchases');
  };

  const handleTogglePurchaseStatus = async (purchase: Purchase) => {
    const updatedStatus: Purchase['status'] = purchase.status === 'paid' ? 'pending' : 'paid';
    const updated: Purchase = {
      ...purchase,
      status: updatedStatus,
    };
    accountingStorage.updatePurchase(updated);
    setPurchases(accountingStorage.getPurchases());

    if (isNeonConnected) {
      try {
        await fetch('/api/purchases', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(updated),
        });
      } catch (e) {
        console.error('Failed to sync purchase status to Neon DB', e);
      }
    }
  };

  const handleDeletePurchase = async (id: string) => {
    accountingStorage.deletePurchase(id);
    setPurchases(accountingStorage.getPurchases());

    if (isNeonConnected) {
      try {
        await fetch(`/api/purchases?id=${id}`, {
          method: 'DELETE',
          headers: storage.getAuthHeaders(),
        });
      } catch (e) {
        console.error('Failed to delete purchase from Neon DB', e);
      }
    }
  };

  // --- EXPENSE HANDLERS ---
  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense = accountingStorage.addExpense(expenseData);
    setExpenses(accountingStorage.getExpenses());

    if (isNeonConnected) {
      try {
        await fetch('/api/expenses', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(newExpense),
        });
      } catch (e) {
        console.error('Failed to sync expense to Neon DB', e);
      }
    }
  };

  const handleDeleteExpense = async (id: string) => {
    accountingStorage.deleteExpense(id);
    setExpenses(accountingStorage.getExpenses());

    if (isNeonConnected) {
      try {
        await fetch(`/api/expenses?id=${id}`, {
          method: 'DELETE',
          headers: storage.getAuthHeaders(),
        });
      } catch (e) {
        console.error('Failed to delete expense from Neon DB', e);
      }
    }
  };

  // --- RECEIPTS & PAYMENTS HANDLERS ---
  const handleAddReceipt = async (receiptData: Omit<Receipt, 'id' | 'createdAt'>) => {
    const newReceipt = accountingStorage.addReceipt(receiptData);
    setReceipts(accountingStorage.getReceipts());

    // If linked to an invoice, update invoice status or amount paid
    if (receiptData.referenceId) {
      const inv = storage.getInvoices().find((i) => i.id === receiptData.referenceId);
      if (inv) {
        const newPaid = (inv.amountPaid || 0) + receiptData.amount;
        const isFullyPaid = newPaid >= inv.grandTotal;
        const updatedInvoice: Invoice = {
          ...inv,
          amountPaid: newPaid,
          status: isFullyPaid ? 'paid' : inv.status,
          paymentReceivedDate: isFullyPaid ? receiptData.date : inv.paymentReceivedDate,
        };
        storage.updateInvoice(updatedInvoice);
        setInvoices(storage.getInvoices());
      }
    }

    if (isNeonConnected) {
      try {
        await fetch('/api/receipts', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(newReceipt),
        });
      } catch (e) {
        console.error('Failed to sync receipt to Neon DB', e);
      }
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    accountingStorage.deleteReceipt(id);
    setReceipts(accountingStorage.getReceipts());

    if (isNeonConnected) {
      try {
        await fetch(`/api/receipts?id=${id}`, {
          method: 'DELETE',
          headers: storage.getAuthHeaders(),
        });
      } catch (e) {
        console.error('Failed to delete receipt from Neon DB', e);
      }
    }
  };

  const handleAddPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment = accountingStorage.addPayment(paymentData);
    setPayments(accountingStorage.getPayments());

    // If linked to a purchase, update purchase status or amount paid
    if (paymentData.referenceId) {
      const pur = accountingStorage.getPurchases().find((p) => p.id === paymentData.referenceId);
      if (pur) {
        const newPaid = (pur.amountPaid || 0) + paymentData.amount;
        const isFullyPaid = newPaid >= pur.grandTotal;
        const updatedPurchase: Purchase = {
          ...pur,
          amountPaid: newPaid,
          status: isFullyPaid ? 'paid' : pur.status,
        };
        accountingStorage.updatePurchase(updatedPurchase);
        setPurchases(accountingStorage.getPurchases());
      }
    }

    if (isNeonConnected) {
      try {
        await fetch('/api/payments', {
          method: 'POST',
          headers: storage.getAuthHeaders(),
          body: JSON.stringify(newPayment),
        });
      } catch (e) {
        console.error('Failed to sync payment to Neon DB', e);
      }
    }
  };

  const handleDeletePayment = async (id: string) => {
    accountingStorage.deletePayment(id);
    setPayments(accountingStorage.getPayments());

    if (isNeonConnected) {
      try {
        await fetch(`/api/payments?id=${id}`, {
          method: 'DELETE',
          headers: storage.getAuthHeaders(),
        });
      } catch (e) {
        console.error('Failed to delete payment from Neon DB', e);
      }
    }
  };

  // Screen title logic
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Billu';
      case 'invoices':
        return 'Sales Invoices';
      case 'create':
        return 'New Bill';
      case 'purchases':
        return 'Purchases';
      case 'create-purchase':
        return 'New Purchase';
      case 'expenses':
        return 'Expenses';
      case 'receipts-payments':
        return 'Money In & Out';
      case 'products':
        return 'Products & Stock';
      case 'clients':
        return 'Customers';
      case 'suppliers':
        return 'Suppliers';
      case 'reports':
        return 'Reports & P&L';
      case 'more':
        return 'All Modules';
      case 'settings':
        return 'Settings';
      default:
        return 'Billu';
    }
  };

  // Opening Splash Screen while initializing workspace
  if (showSplash) {
    return <SplashScreen />;
  }

  // Not logged in -> Show Auth Screen
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="device-viewport">
      {/* Mobile/Tablet Sticky App Header */}
      <MobileHeader
        title={getHeaderTitle()}
        showBack={activeTab !== 'dashboard'}
        onBack={() => setActiveTab('dashboard')}
        onOpenSettings={() => setActiveTab('settings')}
        isSettingsActive={activeTab === 'settings'}
        isSyncing={isSyncing}
        onSync={() => syncWithRemote(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Screen Content */}
      <main className="app-content">
        {activeTab === 'dashboard' && (
          <DashboardScreen
            invoices={invoices}
            settings={settings}
            purchases={purchases}
            expenses={expenses}
            onNavigate={setActiveTab}
            onSelectInvoice={setSelectedInvoice}
            onShareInvoice={setSelectedInvoice}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesScreen
            invoices={invoices}
            onSelectInvoice={setSelectedInvoice}
            onShareInvoice={setSelectedInvoice}
            onToggleStatus={handleToggleInvoiceStatus}
            onDeleteInvoice={handleDeleteInvoice}
            onCreateNew={() => setActiveTab('create')}
          />
        )}

        {activeTab === 'create' && (
          <CreateBillScreen
            clients={clients}
            products={products}
            settings={settings}
            onSaveInvoice={handleSaveInvoice}
            onQuickAddClient={handleAddClient}
            nextInvoiceNumber={storage.getNextInvoiceNumber()}
          />
        )}

        {activeTab === 'purchases' && (
          <PurchasesScreen
            purchases={purchases}
            onToggleStatus={handleTogglePurchaseStatus}
            onDeletePurchase={handleDeletePurchase}
            onCreateNew={() => setActiveTab('create-purchase')}
          />
        )}

        {activeTab === 'create-purchase' && (
          <CreatePurchaseScreen
            suppliers={suppliers}
            products={products}
            settings={settings}
            onSavePurchase={handleSavePurchase}
            onQuickAddSupplier={handleAddSupplier}
            nextPurchaseNumber={accountingStorage.getNextPurchaseNumber()}
            onCancel={() => setActiveTab('purchases')}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesScreen
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'receipts-payments' && (
          <ReceiptsPaymentsScreen
            receipts={receipts}
            payments={payments}
            clients={clients}
            suppliers={suppliers}
            invoices={invoices}
            purchases={purchases}
            onAddReceipt={handleAddReceipt}
            onDeleteReceipt={handleDeleteReceipt}
            onAddPayment={handleAddPayment}
            onDeletePayment={handleDeletePayment}
          />
        )}

        {activeTab === 'products' && (
          <ProductsScreen
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsScreen
            clients={clients}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersScreen
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsScreen
            invoices={invoices}
            purchases={purchases}
            expenses={expenses}
            receipts={receipts}
            payments={payments}
            clients={clients}
            suppliers={suppliers}
          />
        )}

        {activeTab === 'more' && (
          <MoreMenuScreen
            onNavigate={setActiveTab}
            productsCount={products.length}
            clientsCount={clients.length}
            suppliersCount={suppliers.length}
            purchasesCount={purchases.length}
            expensesCount={expenses.length}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            onSaveSettings={handleSaveSettings}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Invoice Detail / Actions Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        settings={settings}
        onClose={() => setSelectedInvoice(null)}
        onToggleStatus={handleToggleInvoiceStatus}
      />
    </div>
  );
}
