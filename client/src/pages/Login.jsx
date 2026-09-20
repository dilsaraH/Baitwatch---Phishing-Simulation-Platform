import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, Loader2, AlertCircle, Info, X, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false); // Modal state
  
  const navigate = useNavigate();
  const { login } = useAuth(); // Assumes your AuthContext provides a login function

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
      
      // Route based on role
      if (data.user.role === 'PLATFORM_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/tenant');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-600">
          <Shield className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          BaitWatch
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Phishing Simulation & Awareness Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 flex text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" /> {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border"
                  placeholder="admin@domain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in to Dashboard'}
              </button>
            </div>
          </form>

          {/* PRIVACY NOTICE TRIGGER */}
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="text-xs text-gray-500 hover:text-indigo-600 flex items-center justify-center w-full transition-colors"
            >
              <Info className="w-3.5 h-3.5 mr-1" />
              Ethical Data Use & Privacy Notice
            </button>
          </div>
        </div>
      </div>

      {/* PRIVACY & ETHICS MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 p-6 text-white relative">
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <ShieldCheck className="w-10 h-10 text-emerald-400 mb-3" />
              <h2 className="text-xl font-bold">Ethical Use of Employee Data</h2>
            </div>
            
            <div className="p-6 space-y-4 text-gray-600 text-sm leading-relaxed">
              <p>
                <strong>BaitWatch</strong> places a strong emphasis on data privacy, consent, and the ethical handling of all information collected during simulated phishing campaigns.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Consent & Purpose:</strong> This platform must only be used for authorized security awareness training.</li>
                <li><strong>Data Minimization:</strong> Only necessary metrics (opens, clicks, browser telemetry) are collected for educational evaluation.</li>
                <li><strong>Confidentiality:</strong> Employee compromise metrics must be handled with strict confidentiality and never used for punitive measures.</li>
              </ul>
              <p className="pt-2 border-t border-gray-100 text-xs text-gray-500 italic">
                By accessing this system, you agree to adhere to your organization's internal privacy policies and data protection regulations.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}