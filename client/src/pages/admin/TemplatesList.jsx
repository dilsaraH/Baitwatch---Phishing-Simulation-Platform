import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Loader2, X } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function TemplatesList() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', htmlContent: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await apiFetch('/api/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      setTemplates(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiFetch('/api/templates', {
        method: 'POST',
        body: JSON.stringify(newTemplate)
      });
      
      if (!res.ok) throw new Error('Failed to create template');
      
      await fetchTemplates(); // Refresh list
      setIsModalOpen(false);
      setNewTemplate({ name: '', subject: '', htmlContent: '' }); // Reset form

      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const res = await apiFetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">Manage the phishing payloads sent to users.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> New Template
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-start">
              <div className="flex items-center text-blue-600">
                <FileText className="w-5 h-5 mr-2" />
                <h2 className="font-bold text-gray-900 truncate" title={template.name}>{template.name}</h2>
              </div>
              <button onClick={() => handleDelete(template.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex-1 bg-gray-50/50">
              <p className="text-sm text-gray-500 mb-1">Subject Line</p>
              <p className="text-sm font-medium text-gray-900 truncate" title={template.subject}>{template.subject}</p>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No templates found. Click "New Template" to get started.
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Create New Template</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input 
                  type="text" required value={newTemplate.name}
                  onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                  placeholder="e.g., Urgent HR Update"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject Line</label>
                <input 
                  type="text" required value={newTemplate.subject}
                  onChange={e => setNewTemplate({...newTemplate, subject: e.target.value})}
                  placeholder="e.g., Action Required: Verify your benefits"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HTML Body</label>
                <p className="text-xs text-gray-500 mb-2">Use {'{{FIRST_NAME}}'}, {'{{LAST_NAME}}'}, {'{{USER_EMAIL}}'}, and {'{{LANDING_URL}}'} as placeholders.</p>
                <textarea 
                    required rows={8} 
                    value={newTemplate.htmlContent}
                    onChange={e => setNewTemplate({...newTemplate, htmlContent: e.target.value})}
                    placeholder="<html><body>Hello {{FIRST_NAME}}...</body></html>"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}