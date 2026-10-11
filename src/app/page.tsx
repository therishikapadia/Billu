'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CompanySettings, Client, Product, Invoice } from '@/lib/types';
import { storage, DEFAULT_SETTINGS, DEFAULT_CLIENTS, DEFAULT_PRODUCTS, DEFAULT_INVOICES } from '@/lib/storage';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav, NavTab } from '@/components/BottomNav';
import { DashboardScreen } from '@/components/DashboardScreen';
import { InvoicesScreen } from '@/components/InvoicesScreen';
import { CreateBillScreen } from '@/components/CreateBillScreen';
import { ProductsScreen } from '@/components/ProductsScreen';
import { ClientsScreen } from '@/components/ClientsScreen';
import { SettingsScreen } from '@/components/SettingsScreen';
import { InvoiceDetailModal } from '@/components/InvoiceDetailModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isNeonConnected, setIsNeonConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Core Data - initialized to static constants to prevent SSR hydration mismatch
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [clients, setClients] = useState<Client[]>(DEFAULT_CLIENTS);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [invoices, setInvoices] = useState<Invoice[]>(DEFAULT_INVOICES);

  // Remote Sync Function with TTL Caching (limits unnecessary Neon DB queries)
  const syncWithRemote = useCallback(async (force = false) => {
    // If not forced and data was synced recently (< 15 mins), skip remote query
    if (!force && !storage.shouldSync(15)) {
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      if (data.connected) {
        setIsNeonConnected(true);
        try {
          const [sRes, cRes, pRes, iRes] = await Promise.all([
            fetch('/api/settings').then(r => r.json()),
            fetch('/api/clients').then(r => r.json()),
            fetch('/api/products').then(r => r.json()),
            fetch('/api/invoices').then(r => r.json()),
          ]);

          if (sRes.data) {
            setSettings((prev) => ({ ...prev, ...sRes.data }));
            storage.saveSettings({ ...storage.getSettings(), ...sRes.data });
          }
          if (cRes.data && cRes.data.length > 0) {
            setClients(cRes.data);
            storage.saveClients(cRes.data);
          }
          if (pRes.data && pRes.data.length > 0) {
            setProducts(pRes.data);
            storage.saveProducts(pRes.data);
          }
          if (iRes.data && iRes.data.length > 0) {
            setInvoices(iRes.data);
            storage.saveInvoices(iRes.data);
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
  }, []);

  // Client-side mount: Load persisted local storage immediately (0ms, zero network)
  useEffect(() => {
    setSettings(storage.getSettings());
    setClients(storage.getClients());
    setProducts(storage.getProducts());
    setInvoices(storage.getInvoices());

    // Only query DB if cache TTL expired or on first launch
    syncWithRemote(false);
  }, [syncWithRemote]);

  // --- SETTINGS HANDLERS ---
  const handleSaveSettings = async (newSettings: CompanySettings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);

    if (isNeonConnected) {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
        await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete client from Neon DB', e);
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
        await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete product from Neon DB', e);
      }
    }
  };

  // --- INVOICE HANDLERS ---
  const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice = storage.addInvoice(invoiceData);
    setInvoices(storage.getInvoices());

    if (isNeonConnected) {
      try {
        await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newInvoice,
            clientData: newInvoice.client,
          }),
        });
      } catch (e) {
        console.error('Failed to sync invoice to Neon DB', e);
      }
    }

    // Open detail modal for the created invoice
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
          headers: { 'Content-Type': 'application/json' },
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
        await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete invoice from Neon DB', e);
      }
    }
  };

  // Screen title logic
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Billu';
      case 'invoices':
        return 'Invoices';
      case 'create':
        return 'New Bill';
      case 'products':
        return 'Products';
      case 'clients':
        return 'Clients';
      case 'settings':
        return 'Settings';
      default:
        return 'Billu';
    }
  };

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
      />

      {/* Main Screen Content */}
      <main className="app-content">
        {activeTab === 'dashboard' && (
          <DashboardScreen
            invoices={invoices}
            settings={settings}
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

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            onSaveSettings={handleSaveSettings}
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
