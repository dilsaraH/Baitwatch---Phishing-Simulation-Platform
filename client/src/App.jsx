import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireRole from './routes/RequireRole';

import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import CampaignBuilder from './pages/admin/CampaignBuilder';
import CampaignResults from './pages/admin/CampaignResults';
import TemplatesList from './pages/admin/TemplatesList';
import CampaignsList from './pages/admin/CampaignsList';
import TenantsList from './pages/admin/TenantsList';
import EmployeesList from './pages/admin/EmployeesList';
import LandingPagesList from './pages/admin/LandingPagesList';

// Temporary placeholders
const AdminDashboard = () => <div className="p-8">Admin Dashboard Overview</div>;
const TenantDashboard = () => <div className="p-8">Tenant User Dashboard</div>;
const PoliciesList = () => <div className="p-8">Policies (Coming Soon)</div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* PLATFORM ADMIN ROUTES */}
          <Route path="/admin" element={
            <RequireRole role="PLATFORM_ADMIN">
              <AdminLayout />
            </RequireRole>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="campaigns/new" element={<CampaignBuilder />} />
            <Route path="campaigns/:id" element={<CampaignResults />} />
            
            <Route path="tenants" element={<TenantsList />} />
            <Route path="tenants/:id/employees" element={<EmployeesList />} />
            <Route path="templates" element={<TemplatesList />} />
            <Route path="landing-pages" element={<LandingPagesList />} />
            <Route path="campaigns" element={<CampaignsList />} />
            <Route path="policies" element={<PoliciesList />} />
        </Route>

          {/* TENANT USER ROUTES */}
          <Route path="/tenant" element={
            <RequireRole role="TENANT_USER">
              {/* <TenantLayout /> will go here later */}
              <TenantDashboard />
            </RequireRole>
          }>
            {/* Tenant routes will inject here */}
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;