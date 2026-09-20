import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Mail, Layout, Rocket, Shield, ArrowRight, Activity, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    tenants: 0,
    templates: 0,
    landingPages: 0,
    campaigns: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewStats = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        // Fetch all lists concurrently to get their counts
        const [tenRes, tplRes, lpRes, campRes] = await Promise.all([
          fetch('/api/tenants', { headers }),
          fetch('/api/templates', { headers }),
          fetch('/api/landing-pages', { headers }),
          fetch('/api/campaigns', { headers })
        ]);

        const tenants = await tenRes.json();
        const templates = await tplRes.json();
        const landingPages = await lpRes.json();
        const campaigns = await campRes.json();

        setStats({
          tenants: tenants.length || 0,
          templates: templates.length || 0,
          landingPages: landingPages.length || 0,
          campaigns: campaigns.length || 0
        });
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchOverviewStats();
  }, [token]);

  const modules = [
    {
      name: 'Tenants & Users',
      description: 'Manage client organizations and onboard target employees.',
      icon: Users,
      count: stats.tenants,
      link: '/admin/tenants',
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      name: 'Email Templates',
      description: 'Design and manage deceptive phishing lures.',
      icon: Mail,
      count: stats.templates,
      link: '/admin/templates',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Landing Pages',
      description: 'Create educational debrief pages for compromised targets.',
      icon: Layout,
      count: stats.landingPages,
      link: '/admin/landing-pages',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Campaign Engine',
      description: 'Deploy simulated attacks and track open/click metrics.',
      icon: Rocket,
      count: stats.campaigns,
      link: '/admin/campaigns',
      color: 'bg-rose-100 text-rose-600'
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Activity className="w-8 h-8 mr-3 text-blue-600" />
            Platform Overview
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome to BaitWatch. Select a module below to manage your phishing simulation environment.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link 
                key={mod.name} 
                to={mod.link}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col h-full"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${mod.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800 bg-gray-50 px-3 py-1 rounded-md border border-gray-100">
                    {mod.count}
                  </span>
                </div>
                
                <div className="mt-5 flex-1">
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {mod.name}
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center text-sm font-semibold text-blue-600">
                  Manage Module
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}