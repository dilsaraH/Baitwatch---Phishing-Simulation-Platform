import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, Trash2, Loader2, Mail, X, Upload } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function EmployeesList() {
  const { id } = useParams(); // Gets the tenant ID from the URL
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ firstName: '', lastName: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

  // CSV Upload State
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        // Split file by line and remove empty ones
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error("CSV is empty or missing headers");

        // Extract and normalize headers
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const fnIdx = headers.indexOf('firstname');
        const lnIdx = headers.indexOf('lastname');
        const emIdx = headers.indexOf('email');

        if (fnIdx === -1 || lnIdx === -1 || emIdx === -1) {
          throw new Error("CSV must contain 'firstName', 'lastName', and 'email' headers");
        }

        // Extract data rows
        const parsedEmployees = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= 3) {
            parsedEmployees.push({
              firstName: values[fnIdx],
              lastName: values[lnIdx],
              email: values[emIdx]
            });
          }
        }

        if (parsedEmployees.length === 0) throw new Error("No valid data rows found in CSV");

        // Send bulk payload to backend
        const res = await apiFetch(`/api/tenants/${id}/employees/bulk`, {
          method: 'POST',
          body: JSON.stringify({ employees: parsedEmployees })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to upload employees');
        }

        await fetchEmployees();
        alert(`Success! Check the table to see the new employees.`);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    fetchEmployees();
  }, [id]);

  const fetchEmployees = async () => {
    try {
      const res = await apiFetch(`/api/tenants/${id}/employees`);
      if (res.ok) setEmployees(await res.json());
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
      const res = await apiFetch(`/api/tenants/${id}/employees`, {
        method: 'POST',
        body: JSON.stringify(newEmployee)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add employee');
      }
      
      await fetchEmployees();
      setIsModalOpen(false);
      setNewEmployee({ firstName: '', lastName: '', email: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (empId, name) => {
    if (!window.confirm(`Remove ${name} from this organization?`)) return;
    
    try {
      const res = await apiFetch(`/api/tenants/${id}/employees/${empId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove employee');
      setEmployees(employees.filter(e => e.id !== empId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <Link to="/admin/tenants" className="flex items-center text-blue-600 hover:underline font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tenants
      </Link>

      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Employees</h1>
          <p className="text-gray-600 mt-1">Add or remove target users for this organization.</p>
        </div>
        
        <div className="flex gap-3">
          {/* Hidden file input */}
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Upload className="w-5 h-5 mr-2" />}
            Upload CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Add Employee
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 shadow-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Email Address</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {emp.firstName} {emp.lastName}
                </td>
                <td className="px-6 py-4 text-gray-500 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" /> {emp.email}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(emp.id, emp.firstName)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Remove Employee"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                  No employees found. Click "Add Employee" to populate this tenant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add Target Employee</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input 
                    type="text" required value={newEmployee.firstName}
                    onChange={e => setNewEmployee({...newEmployee, firstName: e.target.value})}
                    placeholder="Jane"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input 
                    type="text" required value={newEmployee.lastName}
                    onChange={e => setNewEmployee({...newEmployee, lastName: e.target.value})}
                    placeholder="Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" required value={newEmployee.email}
                  onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
                  placeholder="jane.doe@company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}