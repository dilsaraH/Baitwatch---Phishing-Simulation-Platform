import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail, MousePointerClick, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CampaignResults() {
  const { id } = useParams();
  const { token } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/campaigns/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load campaign data');
        setCampaign(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
    
    // Optional: Poll every 10 seconds for live updates
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, [id, token]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (error) return <div className="p-10 text-red-600 text-center font-bold">Error: {error}</div>;
  if (!campaign) return null;

  // Calculate Metrics
  const totalSent = campaign.emailsSent.length;
  const totalOpened = campaign.emailsSent.filter(e => e.openedAt).length;
  const totalClicked = campaign.emailsSent.filter(e => e.clickedAt).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Link to="/admin" className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>

        <header className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              <p className="text-gray-500 mt-1">Template: {campaign.template?.name} | Status: <span className="font-semibold text-blue-600">{campaign.status}</span></p>
            </div>
          </div>

          {/* Top Level Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4"><Mail className="text-blue-600 w-6 h-6" /></div>
              <div><p className="text-gray-500 text-sm">Emails Sent</p><p className="text-2xl font-bold">{totalSent}</p></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center">
              <div className="bg-amber-100 p-3 rounded-full mr-4"><Eye className="text-amber-600 w-6 h-6" /></div>
              <div><p className="text-gray-500 text-sm">Opened</p><p className="text-2xl font-bold">{totalOpened}</p></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center">
              <div className="bg-red-100 p-3 rounded-full mr-4"><MousePointerClick className="text-red-600 w-6 h-6" /></div>
              <div><p className="text-gray-500 text-sm">Clicked (Compromised)</p><p className="text-2xl font-bold">{totalClicked}</p></div>
            </div>
          </div>
        </header>

        {/* Target List Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-900 text-white">
            <h2 className="font-semibold">Target Employee Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Employee</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Opened At</th>
                  <th className="px-6 py-3 font-medium">Clicked At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaign.emailsSent.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {record.employee.firstName} {record.employee.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{record.employee.email}</td>
                    <td className="px-6 py-4">
                      {record.clickedAt ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">Failed Test</span>
                      ) : record.openedAt ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">Viewed</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold">Sent</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {record.openedAt ? new Date(record.openedAt).toLocaleString() : '--'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {record.clickedAt ? new Date(record.clickedAt).toLocaleString() : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}