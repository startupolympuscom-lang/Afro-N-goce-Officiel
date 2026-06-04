import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DispatchLayout } from './components/layout/DispatchLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import CMSLayout from './app/cms/layout';
import { Toaster } from 'sonner';
import { useDocumentStore } from './stores/useDocumentStore';

// Lazy loaded pages
const LandingPage = React.lazy(() => import('./app/LandingPage'));
const HistoryPage = React.lazy(() => import('./app/HistoryPage'));
const AfroDigitalPage = React.lazy(() => import('./app/AfroDigitalPage'));
const ButagazPage = React.lazy(() => import('./app/ButagazPage'));
const AirLiquidePage = React.lazy(() => import('./app/AirLiquidePage'));
const LoginPage = React.lazy(() => import('./app/login/page'));

// CMS
const CMSDashboardPage = React.lazy(() => import('./app/cms/page'));
const CMSHomePage = React.lazy(() => import('./app/cms/home/page'));
const CMSHistoryPage = React.lazy(() => import('./app/cms/history/page'));
const CMSIdentityPage = React.lazy(() => import('./app/cms/identity/page'));
const CMSProductsPage = React.lazy(() => import('./app/cms/products/page'));
const CMSNewsPage = React.lazy(() => import('./app/cms/news/page'));
const DispatchLoginPage = React.lazy(() => import('./app/dispatch/login/page'));
const DispatchSelectPage = React.lazy(() => import('./app/dispatch/select/page'));
const DispatchDashboardPage = React.lazy(() => import('./app/dispatch/gaz/dashboard/page'));
const DispatchDriversPage = React.lazy(() => import('./app/dispatch/gaz/drivers/page'));
const DispatchSettingsPage = React.lazy(() => import('./app/dispatch/gaz/settings/page'));
const DispatchClientsPage = React.lazy(() => import('./app/dispatch/gaz/clients/page'));
const DispatchCaissePage = React.lazy(() => import('./app/dispatch/gaz/caisse/page'));
const DispatchCommandePage = React.lazy(() => import('./app/dispatch/gaz/commande/page'));
const DispatchComptaPage = React.lazy(() => import('./app/dispatch/gaz/compta/page'));
const DispatchLivePage = React.lazy(() => import('./app/dispatch/gaz/live/page'));
const DispatchHRPage = React.lazy(() => import('./app/dispatch/gaz/hr/page'));
const DispatchHRPointagePage = React.lazy(() => import('./app/dispatch/gaz/hr/pointage/page'));
const DispatchHRConvoyeursPage = React.lazy(() => import('./app/dispatch/gaz/hr/convoyeurs/page'));
const DispatchStockPage = React.lazy(() => import('./app/dispatch/gaz/stock/page'));
const DispatchDriverSalePage = React.lazy(() => import('./app/dispatch/gaz/driver/sale/page'));
const DispatchDriverHistoryPage = React.lazy(() => import('./app/dispatch/gaz/driver/history/page'));
const DispatchDriverPointagePage = React.lazy(() => import('./app/dispatch/gaz/driver/pointage/page'));
const DashboardPage = React.lazy(() => import('./app/dashboard/page'));
const VehiculesPage = React.lazy(() => import('./app/vehicules/page'));
const ChauffeursPage = React.lazy(() => import('./app/chauffeurs/page'));
const ConformitePage = React.lazy(() => import('./app/conformite/page'));
const CarburantPage = React.lazy(() => import('./app/flotte/carburant/page'));
const LeasingPage = React.lazy(() => import('./app/flotte/leasing/page'));
const VidangePage = React.lazy(() => import('./app/flotte/vidange/page'));
const ChargesVariablesPage = React.lazy(() => import('./app/flotte/charges-variables/page'));
const MissionsPage = React.lazy(() => import('./app/flotte/missions/page'));
const MaintenancePage = React.lazy(() => import('./app/flotte/maintenance/page'));
const PneusPage = React.lazy(() => import('./app/flotte/pneus/page'));
const InfractionsPage = React.lazy(() => import('./app/flotte/infractions/page'));
const PrestatairesPage = React.lazy(() => import('./app/prestataires/page'));
const BudgetPage = React.lazy(() => import('./app/budget/page'));
const FinancePage = React.lazy(() => import('./app/finance/page'));
const RapportsPage = React.lazy(() => import('./app/rapports/page'));
const AuditPage = React.lazy(() => import('./app/audit/page'));
const ParametresPage = React.lazy(() => import('./app/parametres/page'));
const MasterTrackerPage = React.lazy(() => import('./app/master-tracker/page'));
const EcomPage = React.lazy(() => import('./app/ecom/page'));
const EcomAdminPage = React.lazy(() => import('./app/ecom/admin/page'));
const EcomCartPage = React.lazy(() => import('./app/ecom/cart/page'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

export default function App() {
  const fetchDocuments = useDocumentStore(s => s.fetchDocuments);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/notre-histoire" element={<HistoryPage />} />
          <Route path="/afro-digital" element={<AfroDigitalPage />} />
          <Route path="/butagaz" element={<ButagazPage />} />
          <Route path="/air-liquide" element={<AirLiquidePage />} />
          <Route path="/master-tracker" element={<MasterTrackerPage />} />
          <Route path="/ecom" element={<EcomPage />} />
          <Route path="/ecom/admin" element={<EcomAdminPage />} />
          <Route path="/ecom/cart" element={<EcomCartPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* CMS Routes */}
          <Route path="/cms" element={<CMSLayout />}>
            <Route index element={<CMSDashboardPage />} />
            <Route path="home" element={<CMSHomePage />} />
            <Route path="history" element={<CMSHistoryPage />} />
            <Route path="identity" element={<CMSIdentityPage />} />
            <Route path="products" element={<CMSProductsPage />} />
            <Route path="news" element={<CMSNewsPage />} />
          </Route>

          {/* Afro Dispatch Routes */}
          <Route path="/dispatch/login" element={<DispatchLoginPage />} />
          <Route path="/dispatch/select" element={<DispatchSelectPage />} />
          <Route path="/dispatch/gaz" element={<DispatchLayout />}>
            <Route path="dashboard" element={<DispatchDashboardPage />} />
            <Route path="drivers" element={<DispatchDriversPage />} />
            <Route path="settings" element={<DispatchSettingsPage />} />
            <Route path="clients" element={<DispatchClientsPage />} />
            <Route path="caisse" element={<DispatchCaissePage />} />
            <Route path="commande" element={<DispatchCommandePage />} />
            <Route path="compta" element={<DispatchComptaPage />} />
            <Route path="live" element={<DispatchLivePage />} />
            <Route path="hr" element={<DispatchHRPage />} />
            <Route path="hr/pointage" element={<DispatchHRPointagePage />} />
            <Route path="hr/convoyeurs" element={<DispatchHRConvoyeursPage />} />
            <Route path="stock" element={<DispatchStockPage />} />
            <Route path="driver/sale" element={<DispatchDriverSalePage />} />
            <Route path="driver/history" element={<DispatchDriverHistoryPage />} />
            <Route path="driver/pointage" element={<DispatchDriverPointagePage />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/fleet" element={<Navigate to="/dashboard" replace />} />
            
            {/* Routes accessibles à tous les rôles */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/vehicules" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><VehiculesPage /></ProtectedRoute>} />
            <Route path="/chauffeurs" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><ChauffeursPage /></ProtectedRoute>} />
            <Route path="/conformite" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><ConformitePage /></ProtectedRoute>} />
            <Route path="/flotte/carburant" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><CarburantPage /></ProtectedRoute>} />
            <Route path="/flotte/leasing" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><LeasingPage /></ProtectedRoute>} />
            <Route path="/flotte/vidange" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><VidangePage /></ProtectedRoute>} />
            <Route path="/flotte/charges-variables" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><ChargesVariablesPage /></ProtectedRoute>} />
            <Route path="/flotte/missions" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><MissionsPage /></ProtectedRoute>} />
            <Route path="/flotte/maintenance" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><MaintenancePage /></ProtectedRoute>} />
            <Route path="/flotte/pneus" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><PneusPage /></ProtectedRoute>} />
            <Route path="/flotte/infractions" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'chef_de_parc']}><InfractionsPage /></ProtectedRoute>} />
            
            {/* Routes accessibles aux admins et super admins */}
            <Route path="/prestataires" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><PrestatairesPage /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><FinancePage /></ProtectedRoute>} />
            <Route path="/budget" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><BudgetPage /></ProtectedRoute>} />
            <Route path="/rapports" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><RapportsPage /></ProtectedRoute>} />
            <Route path="/parametres" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><ParametresPage /></ProtectedRoute>} />
            
            {/* Routes accessibles uniquement aux super admins */}
            <Route path="/audit" element={<ProtectedRoute allowedRoles={['super_admin']}><AuditPage /></ProtectedRoute>} />
            
            <Route path="*" element={<div className="p-8 text-center text-text-secondary">Page introuvable</div>} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}
