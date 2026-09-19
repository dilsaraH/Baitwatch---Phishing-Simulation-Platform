import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, Users, FileText, 
  LayoutTemplate, Rocket, Shield, LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Helper to derive the page title from the URL path
const getPageTitle = (pathname) => {
  if (pathname === '/admin') return 'Dashboard';
  if (pathname.startsWith('/admin/campaigns/new')) return 'Campaign Builder';
  if (pathname.startsWith('/admin/campaigns/')) return 'Campaign Results';
  if (pathname.startsWith('/admin/campaigns')) return 'Campaigns';
  if (pathname.startsWith('/admin/tenants')) return 'Tenants';
  if (pathname.startsWith('/admin/templates')) return 'Email Templates';
  if (pathname.startsWith('/admin/landing-pages')) return 'Landing Pages';
  if (pathname.startsWith('/admin/policies')) return 'Policies';
  return 'BaitWatch Admin';
};

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/tenants', label: 'Tenants', icon: Users },
    { to: '/admin/templates', label: 'Email Templates', icon: FileText },
    { to: '/admin/landing-pages', label: 'Landing Pages', icon: LayoutTemplate },
    { to: '/admin/campaigns', label: 'Campaigns', icon: Rocket },
    { to: '/admin/policies', label: 'Policies', icon: Shield },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* MOBILE OVERLAY BACKDROP */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/60 z-40 md:hidden transition-opacity" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-gray-900 text-gray-300 
        flex flex-col transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        {/* Header / Logo */}
        <div className="flex items-center justify-between h-16 px-6 bg-gray-950">
          <span className="text-xl font-bold text-white tracking-wide">BaitWatch<span className="text-blue-500">.</span></span>
          <button onClick={closeSidebar} className="md:hidden text-gray-400 hover:text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={closeSidebar} // Auto-close on mobile
                className={({ isActive }) => `
                  flex items-center px-4 min-h-[44px] rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white font-medium' 
                    : 'hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 bg-gray-950 border-t border-gray-800">
          <div className="flex items-center px-4 min-h-[44px] mb-2 overflow-hidden text-sm text-gray-400">
            <div className="truncate w-full font-medium" title={user?.email}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 min-h-[44px] text-left text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP BAR */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sm:px-6 flex-shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="mr-4 md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 truncate">
            {getPageTitle(location.pathname)}
          </h1>
        </header>

        {/* PAGE CONTENT MOUNT POINT */}
        <main className="flex-1 overflow-auto relative">
          <Outlet />
        </main>

      </div>
    </div>
  );
}