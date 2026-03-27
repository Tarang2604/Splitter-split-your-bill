import { Link, useLocation } from 'react-router-dom';
import { Home, User, PlusCircle } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  // Hide bottom nav on specific pages if needed (like Login/Signup)
  if (location.pathname === '/login' || location.pathname === '/signup') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/60 flex justify-around items-center pt-3 pb-safe px-6 z-40 sm:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <Link to="/" className={`flex flex-col items-center p-2 transition-all ${location.pathname === '/' ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
        <Home className={`w-6 h-6 mb-1 ${location.pathname === '/' ? 'fill-blue-100' : ''}`} />
        <span className="text-[10px] font-bold">Home</span>
      </Link>
      
      <Link to="/groups/new" className="relative -top-6 flex flex-col items-center z-50">
        <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/40 text-white transform hover:scale-110 active:scale-95 transition-all outline outline-[6px] outline-[#f8fafc]">
          <PlusCircle className="w-7 h-7" />
        </div>
      </Link>
      
      <Link to="/" className={`flex flex-col items-center p-2 transition-all ${location.pathname === '/profile' ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
        <User className={`w-6 h-6 mb-1 ${location.pathname === '/profile' ? 'fill-blue-100' : ''}`} />
        <span className="text-[10px] font-bold">Profile</span>
      </Link>
    </div>
  );
};

export default BottomNav;
