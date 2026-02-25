import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';
import { PageTransition } from './components/layout/PageTransition';
import type { PageType } from './components/layout/BottomNav';

import { Dashboard } from './pages/Dashboard';
import { AddTransaction } from './pages/AddTransaction';
import { DebtPage } from './pages/Debt';
import { VacationPage } from './pages/Vacation';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Subscriptions } from './pages/Subscriptions';
import { Auth } from './pages/Auth';
import { useBudgetStore } from './store/useBudgetStore';
import { supabase } from './lib/supabase';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('Dashboard');
  const [session, setSession] = useState<any>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  const processSubscriptions = useBudgetStore(state => state.processSubscriptions);
  const fetchCloudData = useBudgetStore(state => state.fetchCloudData);

  useEffect(() => {
    processSubscriptions();

    // Check if cloud mode is enabled
    const configured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    setIsSupabaseConfigured(configured);

    if (configured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchCloudData();
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) fetchCloudData();
      });

      return () => subscription.unsubscribe();
    }
  }, [processSubscriptions, fetchCloudData]);

  if (isSupabaseConfigured && !session) {
    return (
      <>
        <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' } }} />
        <Auth />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard': return <Dashboard />;
      case 'Add Transaction': return <AddTransaction />;
      case 'Debt': return <DebtPage />;
      case 'Subscriptions': return <Subscriptions />;
      case 'Vacation': return <VacationPage />;
      case 'History': return <History />;
      case 'Settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } }
        }}
      />

      <AnimatePresence mode="wait">
        <PageTransition pageKey={currentPage}>
          {renderPage()}
        </PageTransition>
      </AnimatePresence>

    </AppLayout>
  );
}
