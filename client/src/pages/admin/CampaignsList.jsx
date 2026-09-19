import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Rocket, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await apiFetch('/api/campaigns');
        if (res.ok) setCampaigns(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage and track your simulated phishing deployments.</p>
        </div>
        <Link 
          to="/admin/campaigns/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> New Campaign
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-6 py-3 font-medium">Campaign Name</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Template</th>
              <th className="px-6 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {campaigns.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{c.name || 'Untitled Campaign'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${c.status === 'LAUNCHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{c.template?.name || 'Unknown'}</td>
                <td className="px-6 py-4">
                  <Link to={`/admin/campaigns/${c.id}`} className="text-blue-600 hover:underline flex items-center font-medium">
                    View Results
                  </Link>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No campaigns found. Click "New Campaign" to start.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}