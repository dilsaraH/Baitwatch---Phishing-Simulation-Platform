import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Search, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 

export default function CampaignBuilder() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'PLATFORM_ADMIN') {
      navigate('/tenant', { replace: true });
    }
  }, [user, navigate]);

  // --- State: Data ---
  const [templates, setTemplates] = useState([]);
  const [landingPages, setLandingPages] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // --- State: Form ---
  const [name, setName] = useState(''); // <-- NEW: Campaign Name
  const [tenantId, setTenantId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [landingPageId, setLandingPageId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [sendingDomain, setSendingDomain] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [employeeFilter, setEmployeeFilter] = useState('');

  // --- State: UI ---
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [tplRes, lpRes, tenRes] = await Promise.all([
          fetch('/api/templates', { headers }),
          fetch('/api/landing-pages', { headers }),
          fetch('/api/tenants', { headers })
        ]);

        if (!tplRes.ok || !lpRes.ok || !tenRes.ok) throw new Error('Failed to load initial data');

        setTemplates(await tplRes.json());
        setLandingPages(await lpRes.json());
        setTenants(await tenRes.json());
      } catch (err) {
        setApiError(err.message);
      } finally {
        setIsLoadingInitial(false);
      }
    };
    if (token) fetchInitialData();
  }, [token]);

  useEffect(() => {
    if (!tenantId) {
      setEmployees([]);
      setSelectedEmployees(new Set());
      return;
    }
    const fetchEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const res = await fetch(`/api/tenants/${tenantId}/employees`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load employees');
        const data = await res.json();
        setEmployees(data);
        setSelectedEmployees(new Set()); 
      } catch (err) {
        setApiError(err.message);
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [tenantId, token]);

  // --- Validation ---
  const missingFields = useMemo(() => {
    const missing = [];
    if (!name.trim()) missing.push('Campaign Name'); // <-- NEW Validation
    if (!tenantId) missing.push('Tenant');
    if (!templateId) missing.push('Email Template');
    if (!landingPageId) missing.push('Landing Page');
    if (!senderName.trim()) missing.push('Sender Name');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!senderEmail.trim()) {
      missing.push('Sender Email');
    } else if (!emailRegex.test(senderEmail)) {
      missing.push('Valid Sender Email');
    }
    
    if (selectedEmployees.size === 0) missing.push('Target Employees (Select at least 1)');
    
    return missing;
  }, [name, tenantId, templateId, landingPageId, senderName, senderEmail, selectedEmployees]);

  const isValid = missingFields.length === 0;

  // --- Employee List Helpers ---
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(employeeFilter.toLowerCase())
    );
  }, [employees, employeeFilter]);

  const handleSelectAll = () => setSelectedEmployees(new Set(filteredEmployees.map(e => e.id)));
  const handleClearAll = () => setSelectedEmployees(new Set());
  const toggleEmployee = (id) => {
    const newSelection = new Set(selectedEmployees);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedEmployees(newSelection);
  };

  // --- Preview Html Generator ---
  const previewHtml = useMemo(() => {
    if (!templateId) return '<div style="font-family:sans-serif; color:#666; padding: 20px;">Select a template to preview.</div>';
    const template = templates.find(t => t.id === templateId);
    if (!template) return '';

    let sampleUser = { firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@example.com' };
    if (selectedEmployees.size > 0) {
      const firstSelectedId = Array.from(selectedEmployees)[0];
      const actualUser = employees.find(e => e.id === firstSelectedId);
      if (actualUser) sampleUser = actualUser;
    }

    return template.htmlContent
      .replace(/{{FIRST_NAME}}/g, sampleUser.firstName)
      .replace(/{{LAST_NAME}}/g, sampleUser.lastName)
      .replace(/{{USER_EMAIL}}/g, sampleUser.email);
  }, [templateId, templates, selectedEmployees, employees]);

  // --- Actions ---
  const saveCampaign = async (status = 'DRAFT') => {
    setApiError(null);
    const payload = {
      name, // <-- NEW: Send Name to API
      tenantId,
      templateId,
      landingPageId,
      senderName,
      senderEmail,
      employeeIds: Array.from(selectedEmployees) // Send the exact targets!
    };

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...payload, status })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'An unknown server error occurred.' }));
      throw new Error(errorData.error || `Error ${res.status}: Failed to save campaign`);
    }
    return await res.json();
  };

  const handleSaveDraft = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      const campaign = await saveCampaign('DRAFT');
      navigate(`/admin/campaigns/${campaign.id}`);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    setShowConfirmModal(false);
    try {
      const campaign = await saveCampaign('DRAFT');
      const launchRes = await fetch(`/api/campaigns/${campaign.id}/launch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!launchRes.ok) {
        const errorData = await launchRes.json().catch(() => ({ error: 'Failed to launch.' }));
        throw new Error(errorData.error || 'Launch failed.');
      }

      navigate(`/admin/campaigns/${campaign.id}`);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLaunching(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Builder</h1>
          <p className="text-gray-600 mt-1">Assemble and configure a simulated phishing deployment.</p>
        </header>

        {apiError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start text-red-700 shadow-sm rounded-r-md">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <p className="font-medium">{apiError}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            
            {/* NEW FIELD: Campaign Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">1. Campaign Name</label>
              <input 
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Q3 Executive Phishing Test"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">2. Tenant</label>
              <select 
                value={tenantId} onChange={(e) => setTenantId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">-- Select a Tenant --</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">3. Email Template</label>
              <select 
                value={templateId} onChange={(e) => setTemplateId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">-- Select a Template --</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">4. Landing Page</label>
              <select 
                value={landingPageId} onChange={(e) => setLandingPageId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">-- Select a Landing Page --</option>
                {landingPages.map(lp => <option key={lp.id} value={lp.id}>{lp.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">5. Sender Name</label>
                <input 
                  type="text" value={senderName} onChange={e => setSenderName(e.target.value)}
                  placeholder="e.g. IT Helpdesk"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">6. Sender Email</label>
                <input 
                  type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)}
                  placeholder="e.g. support@domain.com"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">7. Target Employees</label>
              
              {!tenantId ? (
                <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded border border-gray-200">
                  Select a tenant to view available employees.
                </div>
              ) : isLoadingEmployees ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" /> <span>Loading employees...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input 
                        type="text" placeholder="Filter by name or email..." 
                        value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}
                        className="w-full pl-9 p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">Selected: {selectedEmployees.size} / {employees.length}</span>
                    <div className="space-x-3">
                      <button type="button" onClick={handleSelectAll} className="text-blue-600 hover:underline font-medium">Select All</button>
                      <button type="button" onClick={handleClearAll} className="text-gray-600 hover:underline font-medium">Clear All</button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50 space-y-1">
                    {filteredEmployees.length === 0 ? (
                      <p className="text-sm text-gray-500 p-2 text-center">No employees found.</p>
                    ) : (
                      filteredEmployees.map(emp => (
                        <label key={emp.id} className="flex items-center p-2 hover:bg-white rounded cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedEmployees.has(emp.id)}
                            onChange={() => toggleEmployee(emp.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="ml-3 text-sm">
                            <span className="font-medium text-gray-800">{emp.firstName} {emp.lastName}</span>
                            <span className="text-gray-500 ml-2 text-xs">&lt;{emp.email}&gt;</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 space-y-4">
              {!isValid && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 flex items-start">
                  <Info className="w-5 h-5 mr-2 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block mb-1">Required fields missing:</span>
                    <ul className="list-disc list-inside text-blue-700/80">
                      {missingFields.map(field => <li key={field}>{field}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button" onClick={handleSaveDraft} disabled={!isValid || isSaving || isLaunching}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Save as Draft
                </button>
                <button
                  type="button" onClick={() => setShowConfirmModal(true)} disabled={!isValid || isSaving || isLaunching}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLaunching ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Launch Campaign
                </button>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col h-[600px] lg:h-auto">
            <div className="bg-gray-900 text-white rounded-t-xl px-4 py-3 flex justify-between items-center">
              <span className="font-semibold text-sm tracking-wide uppercase">Live Email Preview</span>
              {selectedEmployees.size === 0 && templateId && (
                <span className="text-xs text-gray-400">Using dummy data</span>
              )}
            </div>
            <div className="flex-1 bg-white border-l border-r border-b border-gray-200 rounded-b-xl overflow-hidden shadow-sm relative">
              <iframe title="Email Preview" srcDoc={previewHtml} className="w-full h-full border-none" sandbox="allow-same-origin" />
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <AlertCircle className="w-6 h-6 text-red-500 mr-2" /> 
              Confirm Launch
            </h2>
            <p className="text-gray-600 mt-3 text-sm leading-relaxed">
              Are you sure you want to deploy this campaign? Once launched, the campaign configuration becomes <strong className="text-gray-900">permanently read-only</strong> and emails will immediately begin sending to the {selectedEmployees.size} selected employee(s).
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleLaunch} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
                Yes, Launch Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}