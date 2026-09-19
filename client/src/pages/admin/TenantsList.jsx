import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Loader2, X, Users, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function TenantsList() {
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', domain: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await apiFetch('/api/tenants');
      if (res.ok) setTenants(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const res = await apiFetch('/api/tenants', {
        method: 'POST',
        body: JSON.stringify(newTenant)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create tenant');
      }
      
      await fetchTenants();
      setIsModalOpen(false);
      setNewTenant({ name: '', domain: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
  if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
  
  try {
    const res = await apiFetch(`/api/tenants/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete tenant');
    }
    // Remove the deleted tenant from the state immediately
    setTenants(tenants.filter(t => t.id !== id));
  } catch (err) {
    alert(err.message);
  }
};

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Organizations</h1>
          <p className="text-gray-600 mt-1">Manage client organizations and target domains.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Tenant
        </button>
      </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map(tenant => (
          <div key={tenant.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
                <Building2 className="w-6 h-6" />
            </div>
            <div>
             <h2 className="font-bold text-gray-900">{tenant.name}</h2>
             <p className="text-sm text-gray-500">@{tenant.domain}</p>
            </div>
        </div>

    <button 
        onClick={() => handleDelete(tenant.id, tenant.name)}
        className="text-gray-400 hover:text-red-500 transition-colors p-1"
        title="Delete Tenant"
    >
        <Trash2 className="w-5 h-5" />
    </button>

    </div>
            
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 mb-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-800">{tenant._count?.employees || 0}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Employees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-800">{tenant._count?.campaigns || 0}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Campaigns</p>
              </div>
            </div>

            <Link 
              to={`/admin/tenants/${tenant.id}/employees`}
              className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg flex justify-center items-center transition-colors border border-gray-200"
            >
              <Users className="w-4 h-4 mr-2" /> Manage Employees
            </Link>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add New Tenant</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input 
                  type="text" required value={newTenant.name}
                  onChange={e => setNewTenant({...newTenant, name: e.target.value})}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Domain</label>
                <input 
                  type="text" required value={newTenant.domain}
                  onChange={e => setNewTenant({...newTenant, domain: e.target.value})}
                  placeholder="e.g. acme.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Add Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}