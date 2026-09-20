import React, { useState, useEffect } from 'react';
import { Shield, Download, Mail, Eye, MousePointer, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TenantDashboard() {
  // Added 'logout' here
  const { token, user, logout } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('/api/tenant-portal/campaigns', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load organization campaigns.');
        setCampaigns(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchCampaigns();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const exportToCSV = (campaign) => {
    const headers = ['First Name', 'Last Name', 'Email', 'Sent At', 'Opened At', 'Clicked At', 'Status'];
    
    const rows = campaign.emailsSent.map(log => {
      const status = log.clickedAt ? 'Compromised' : log.openedAt ? 'Opened' : 'Safe';
      return [
        `"${log.employee.firstName}"`,
        `"${log.employee.lastName}"`,
        `"${log.employee.email}"`,
        log.sentAt ? `"${new Date(log.sentAt).toLocaleString()}"` : 'Pending',
        log.openedAt ? `"${new Date(log.openedAt).toLocaleString()}"` : '-',
        log.clickedAt ? `"${new Date(log.clickedAt).toLocaleString()}"` : '-',
        `"${status}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', `${campaign.name.replace(/\s+/g, '_')}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="w-7 h-7 mr-3 text-indigo-600" />
              Organization Security Dashboard
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Review the results of your simulated phishing assessments.
            </p>
          </div>
          
          {/* UPDATED HEADER: Now includes the logout button */}
          <div className="flex items-center space-x-6 border-l border-gray-200 pl-6">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Logged in as</p>
              <p className="text-gray-900 font-bold">{user?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
              title="Log out"
            >
              <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-3" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {campaigns.length === 0 && !error ? (
            <div className="text-center p-12 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-500">
              No campaigns have been deployed for your organization yet.
            </div>
          ) : (
            campaigns.map(campaign => {
              const total = campaign.emailsSent?.length || 0;
              const opened = campaign.emailsSent?.filter(e => e.openedAt).length || 0;
              const clicked = campaign.emailsSent?.filter(e => e.clickedAt).length || 0;
              
              const clickRate = total > 0 ? Math.round((clicked / total) * 100) : 0;

              return (
                <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{campaign.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Status: <span className="font-semibold text-gray-700">{campaign.status}</span> 
                        {campaign.launchedAt && ` • Launched: ${new Date(campaign.launchedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => exportToCSV(campaign)}
                      disabled={total === 0}
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-semibold flex items-center transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV Report
                    </button>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50/50">
                    <div className="p-4 text-center">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-center">
                        <Mail className="w-4 h-4 mr-1.5" /> Targets
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{total}</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-center">
                        <Eye className="w-4 h-4 mr-1.5" /> Opened
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{opened}</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-center">
                        <MousePointer className="w-4 h-4 mr-1.5" /> Compromised
                      </p>
                      <p className="text-2xl font-bold text-red-600">{clicked} <span className="text-sm font-medium">({clickRate}%)</span></p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}