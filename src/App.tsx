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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginId === 'admin' && loginPass === 'admin') {
      try {
        // Sign in anonymously to Firebase to allow Storage/Firestore writes
        const { signInAnonymously } = await import('firebase/auth');
        const { auth } = await import('./lib/firebase');
        await signInAnonymously(auth);
        
        setIsAdmin(true);
        setShowLoginModal(false);
        setLoginId('');
        setLoginPass('');
        setLoginError('');
        setShowAdmin(true);
      } catch (authErr: any) {
        setLoginError('Firebase Auth Error: ' + authErr.message);
      }
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 sm:w-14 sm:h-14 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <img src="/logo.jpeg" alt="OfferBazar Logo" className="w-full h-full object-contain drop-shadow-xl" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-2xl tracking-tighter text-gray-900 leading-none">
                OFFER<span className="text-orange-500">BAZAR</span>
              </span>
              <span className="text-[8px] sm:text-[10px] font-black text-orange-500 tracking-[0.2em] sm:tracking-[0.3em] uppercase mt-0.5 sm:mt-1">
                Loot Deals India
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {isAdmin ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={() => setShowAdmin(!showAdmin)}
                  className={`flex items-center gap-2 text-[10px] sm:text-sm font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all ${showAdmin ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                  <span className="hidden xs:inline">Admin</span>
                </button>
                <div className="h-6 w-px bg-gray-100 hidden xs:block"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-black shadow-lg shadow-orange-500/30 text-xs">
                    A
                  </div>
                  <button onClick={handleLogout} className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Log Out">
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] sm:text-sm font-black px-4 py-2 sm:px-6 sm:py-2.5 rounded-full transition-all shadow-lg shadow-orange-500/25 active:scale-95"
               >
                 <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Sign In</span><span className="xs:hidden">Admin</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-orange-900/10 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-orange-100 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-orange-50">
               <h3 className="font-black text-xl flex items-center gap-2 text-gray-900 tracking-tighter">
                  <Settings className="w-6 h-6 text-orange-500" /> ADMIN LOGIN
               </h3>
               <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:bg-orange-50 hover:text-orange-600 p-2 rounded-xl transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <form onSubmit={handleLogin} className="p-8">
               {loginError && <div className="mb-6 text-sm font-bold text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">{loginError}</div>}
               <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Admin ID</label>
                    <input 
                      type="text" 
                      value={loginId} 
                      onChange={(e) => setLoginId(e.target.value)} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Password</label>
                    <input 
                      type="password" 
                      value={loginPass} 
                      onChange={(e) => setLoginPass(e.target.value)} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-bold"
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
