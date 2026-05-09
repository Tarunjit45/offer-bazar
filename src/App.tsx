import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn, signOut } from './lib/firebase';
import AdminPanel from './components/AdminPanel';
import Catalog from './components/Catalog';
import { Tag, LogIn, LogOut, Settings } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authInitialized) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50/50"><div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"/></div>;
  }

  // Define who gets to be an admin
  const isAdmin = user && (user.email === 'Offerbazar00100@gmail.com');

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      <nav className="border-b border-gray-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-sm transform -rotate-6">
              <Tag className="w-5 h-5 drop-shadow-sm" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Offer<span className="text-orange-500">Bazar</span></span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button 
                    onClick={() => setShowAdmin(!showAdmin)}
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${showAdmin ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Settings className="w-4 h-4" /> 
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
                <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-sm font-medium text-gray-600 hidden sm:inline">{user.displayName || user.email}</span>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full shadow-sm ring-2 ring-white" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold shadow-sm ring-2 ring-white">
                      {(user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button onClick={signOut} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Log Out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={signIn}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
               >
                 <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

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
