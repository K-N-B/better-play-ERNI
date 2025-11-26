import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export default function AuthCallback() {
  const [status] = useState('Processing authentication...');
  const navigate = useNavigate();

  useEffect(() => {
    // Just wait a moment and check auth status
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/auth/check/`, {
          credentials: 'include',
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
          navigate('/', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login', { replace: true });
      }
    }, 100);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-4xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <div className="text-xl font-bold text-black mb-2">{status}</div>
      </div>
    </div>
  );
}