import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Users, Key, Plus, Loader2, AlertCircle, ArrowRight, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TenantsManager() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // User Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [passwordScore, setPasswordScore] = useState(0); // Added for strength meter
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Tenant Modal States
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantDomain, setNewTenantDomain] = useState('');
  const [isSavingTenant, setIsSavingTenant] = useState(false);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load tenants");
      setTenants(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTenants();
  }, [token]);

  // --- PASSWORD STRENGTH LOGIC ---
  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setNewUserPassword(pwd);
    
    let score = 0;
    if (!pwd) {
      setPasswordScore(0);
      return;
    }
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    // Cap at 4 for a 4-segment visual bar
    setPasswordScore(Math.min(score, 4));
  };

  const getStrengthColor = () => {
    if (passwordScore === 0) return 'bg-gray-200';
    if (passwordScore === 1) return 'bg-red-500';
    if (passwordScore === 2) return 'bg-orange-500';
    if (passwordScore === 3) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const getStrengthLabel = () => {
    if (passwordScore === 0) return '';
    if (passwordScore === 1) return 'Weak';
    if (passwordScore === 2) return 'Fair';
    if (passwordScore === 3) return 'Good';
    return 'Strong';
  };

  // --- USER CREATION LOGIC ---
  const openUserModal = (tenantId) => {
    setSelectedTenantId(tenantId);
    setNewUserEmail('');
    setNewUserPassword('');
    setPasswordScore(0);
    setShowUserModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSavingUser(true);
    setError(null);

    try {
      const res = await fetch(`/api/tenants/${selectedTenantId}/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user");
      }

      await fetchTenants();
      setShowUserModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSavingUser(false);
    }
  };

  // --- TENANT CREATION LOGIC ---
  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setIsSavingTenant(true);
    setError(null);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newTenantName, domain: newTenantDomain })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create tenant");
      }

      await fetchTenants();
      setShowTenantModal(false);
      setNewTenantName('');
      setNewTenantDomain('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSavingTenant(false);
    }
  };

  // --- TENANT DELETION LOGIC ---
  const handleDeleteTenant = async (tenantId, tenantName) => {
    if (!window.confirm(`Are you sure you want to delete ${tenantName}? This will fail if they have active campaigns or employees.`)) {
      return;
    }

    setError(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete tenant");
      }

      await fetchTenants(); 
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building className="w-6 h-6 mr-3 text-indigo-600" />
            Tenants & Users
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Manage client organizations and their portal access.</p>
        </div>
        <button 
          onClick={() => setShowTenantModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Organization
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex text-red-700 shadow-sm rounded-r-md">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map(tenant => (
          <div key={tenant.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{tenant.name}</h2>
                  <p className="text-sm text-gray-500">{tenant.domain || 'No domain specified'}</p>
                </div>
                <button 
                  onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                  title="Delete Organization"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex items-center font-medium">
                  <Users className="w-4 h-4 mr-2 text-indigo-600" />
                  {tenant.employees?.length || 0} Targets
                </div>
                <Link 
                  to={`/admin/tenants/${tenant.id}/employees`} 
                  className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center hover:underline"
                >
                  Manage <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Portal Accounts</h3>
                {tenant.users.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No accounts created.</p>
                ) : (
                  <ul className="space-y-2">
                    {tenant.users.map(u => (
                      <li key={u.id} className="text-sm flex items-center bg-blue-50 text-blue-800 px-3 py-1.5 rounded font-medium">
                        <Key className="w-3 h-3 mr-2 text-blue-600" /> {u.email}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={() => openUserModal(tenant.id)}
                className="w-full bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors flex justify-center items-center text-sm shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Portal Account
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE TENANT MODAL */}
      {showTenantModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-indigo-600" /> Create Organization
            </h2>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Organization Name</label>
                <input 
                  type="text" required value={newTenantName} onChange={e => setNewTenantName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Domain (Optional)</label>
                <input 
                  type="text" value={newTenantDomain} onChange={e => setNewTenantDomain(e.target.value)}
                  placeholder="e.g. acme.com"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex gap-3 mt-6 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowTenantModal(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingTenant} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex justify-center items-center transition-colors shadow-sm">
                  {isSavingTenant ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL WITH PASSWORD STRENGTH */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2 text-indigo-600" /> Create Portal Login
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="client@domain.com"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input 
                  type="text" required value={newUserPassword} onChange={handlePasswordChange}
                  placeholder="Min. 8 characters"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                
                {/* Visual Strength Meter */}
                <div className="mt-2">
                  <div className="flex h-1.5 w-full gap-1 rounded-full overflow-hidden bg-gray-100">
                    {[1, 2, 3, 4].map((segment) => (
                      <div 
                        key={segment} 
                        className={`h-full flex-1 transition-colors duration-300 ${
                          passwordScore >= segment ? getStrengthColor() : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs font-semibold ${
                      passwordScore <= 1 ? 'text-red-500' : 
                      passwordScore === 2 ? 'text-orange-500' : 
                      passwordScore === 3 ? 'text-blue-500' : 'text-emerald-500'
                    }`}>
                      {getStrengthLabel()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {newUserPassword.length}/8 chars
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  // Disable button if saving or if password is less than 8 characters
                  disabled={isSavingUser || newUserPassword.length < 8} 
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex justify-center items-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}