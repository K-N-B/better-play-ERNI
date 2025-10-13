import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Mail,
  Shield
} from 'lucide-react';
import { api } from '../services/api';

// Components

import UserManagement from '../components/UserManagement';


const AdminDashboard = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  const account = accounts[0];

  useEffect(() => {
    // Load user profile
    const loadProfile = async () => {
      try {
        const response = await api.auth.getUserProfile();
        setUserProfile(response.data);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "/login",
    });
  };

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/admin' 
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: Users, 
      path: '/admin/users' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      path: '/admin/settings' 
    },
  ];

  const activeTab = menuItems.find(item => 
    location.pathname === item.path
  )?.id || 'dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-blue-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0`}>
        <div className="p-4 h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <div className="bg-white rounded p-1.5">
                  <span className="text-blue-900 text-xl font-bold italic">e</span>
                </div>
                <span className="font-bold">ERNIPUZZLE</span>
              </div>
            ) : (
              <div className="bg-white rounded p-1.5 mx-auto">
                <span className="text-blue-900 text-xl font-bold italic">e</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-blue-800 p-2 rounded transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* User Profile Section */}
          {sidebarOpen && account && (
            <div className="mt-auto pt-4 border-t border-blue-800">
              <div className="bg-blue-800 rounded-lg p-3 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-medium truncate">
                    {account.name || 'User'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-blue-200">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="text-xs truncate">
                    {account.username}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Manage your ErniPuzzle platform</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {account?.name || 'Admin User'}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Shield className="w-3 h-3" />
                  <span>Administrator</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <Routes>

            <Route path="/users" element={<UserManagement />} />

          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;