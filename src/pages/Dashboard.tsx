import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Plus, Users, LogOut, Wallet, UserCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

const Dashboard = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const { currency, setCurrency } = useUIStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data } = await api.get('/groups');
        setGroups(data);
      } catch (err) {
        console.error('Failed to load groups');
      }
    };
    fetchGroups();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white/30 backdrop-blur-2xl pb-20 font-sans">
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight">
              Splitter
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-white/80 border border-gray-100 shadow-sm text-sm font-bold rounded-full px-3 py-1.5 text-gray-700 focus:ring-0 cursor-pointer hover:bg-white transition-colors"
            >
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
            </select>

            <div className="hidden sm:flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
              <UserCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-gray-800">{user?.name}</span>
            </div>

            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors flex items-center p-2 rounded-full hover:bg-red-50 bg-white/50 border border-transparent hover:border-red-100">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h2 className="text-3xl font-extrabold text-gray-800">
            Welcome back, <span className="text-blue-600">{user?.name}</span>! 👋
          </h2>
          <p className="text-gray-500 mt-2 text-lg">Manage your shared expenses beautifully.</p>
        </motion.div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Your Groups</h2>
          <Link to="/groups/new" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all flex items-center text-sm font-semibold px-4 py-2 rounded-full">
            <Plus className="w-4 h-4 mr-1" /> New Group
          </Link>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {groups.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full flex flex-col items-center justify-center py-16 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No groups yet</h3>
              <p className="text-gray-500 text-center max-w-sm mb-6">Create a group to start splitting bills with your friends, family, or roommates.</p>
              <Link to="/groups/new" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                Create your first group
              </Link>
            </motion.div>
          ) : (
            groups.map((group, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }}
                key={group._id} 
                whileHover={{ y: -5, scale: 1.01 }} 
                className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                <Link to={`/groups/${group._id}`} className="block h-full">
                  <h3 className="font-extrabold text-2xl text-gray-900 mb-2">{group.name}</h3>
                  <p className="text-gray-500 mb-6 line-clamp-2 min-h-[40px]">{group.description || 'No description provided'}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-full">
                      <Users className="w-4 h-4 text-gray-500 mr-2"/> 
                      <span className="text-sm font-semibold text-gray-700">{group.members.length}</span>
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold flex items-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      View details
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
