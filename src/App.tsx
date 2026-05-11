import React, { useState } from 'react';
import AdminPanel from './components/AdminPanel';
import Catalog from './components/Catalog';
import { Tag, LogIn, LogOut, Settings, X } from 'lucide-react';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginId === 'admin' && loginPass === 'admin') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginId('');
      setLoginPass('');
      setLoginError('');
      setShowAdmin(true);
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setShowAdmin(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      <nav className="border-b border-gray-200/40 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-14 h-14 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <img src="/logo.jpeg" alt="OfferBazar Logo" className="w-full h-full object-contain drop-shadow-xl" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter text-gray-900 leading-none">
                OFFER<span className="text-orange-500">BAZAR</span>
              </span>
              <span className="text-[10px] font-black text-orange-500 tracking-[0.3em] uppercase mt-1">
                Loot Deals India
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowAdmin(!showAdmin)}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${showAdmin ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Settings className="w-4 h-4" /> 
                  <span className="hidden sm:inline">Admin</span>
                </button>
                <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-sm font-medium text-gray-600 hidden sm:inline">Administrator</span>
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold shadow-sm ring-2 ring-white">
                    A
                  </div>
                  <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Log Out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
               >
                 <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
               <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-orange-500" /> Admin Login
               </h3>
               <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-md">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <form onSubmit={handleLogin} className="p-6">
               {loginError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{loginError}</div>}
               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                    <input 
                      type="text" 
                      value={loginId} 
                      onChange={(e) => setLoginId(e.target.value)} 
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input 
                      type="password" 
                      value={loginPass} 
                      onChange={(e) => setLoginPass(e.target.value)} 
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-xl transition-colors mt-2">
                    Login
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {(isAdmin && showAdmin) && (
           <AdminPanel />
        )}
        
        <Catalog />
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500 bg-white mt-12">
        <p>&copy; {new Date().getFullYear()} OfferBazar Curated Deals. All product prices and availability are subject to change by the original retailer.</p>
      </footer>
    </div>
  );
}
