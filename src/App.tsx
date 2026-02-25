import { useState } from 'react';
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

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('Dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard': return <Dashboard />;
      case 'Add Transaction': return <AddTransaction />;
      case 'Debt': return <DebtPage />;
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
