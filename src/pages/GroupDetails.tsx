import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Receipt, X, CheckCircle, IndianRupee } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore, formatCurrency } from '../store/uiStore';

const GroupDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any>(null);
  const [debts, setDebts] = useState<any[]>([]);
  const user = useAuthStore(state => state.user);
  const { currency } = useUIStore();
  
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      const [grpRes, expRes, balRes, debtRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/expenses/group/${id}`),
        api.get(`/settlements/group/${id}/balances`),
        api.get(`/settlements/group/${id}/debts`)
      ]);
      setGroup(grpRes.data);
      setExpenses(expRes.data);
      setBalances(balRes.data);
      setDebts(debtRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSettleUp = async (toId: string, settleAmount: number) => {
    if (!window.confirm(`Mark this debt of ${formatCurrency(settleAmount, currency)} as settled?`)) return;
    try {
      await api.post('/settlements', { groupId: id, paidTo: toId, amount: settleAmount });
      toast.success('Debt settled successfully!');
      loadData();
    } catch (err) {
      toast.error('Failed to settle up');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !user) return;
    
    try {
      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) return toast.error('Enter a valid amount');

      let splits: any[] = [];
      
      if (splitType === 'equal') {
        const perPerson = val / group.members.length;
        splits = group.members.map((m: any) => ({ user: m._id, amount: perPerson }));
      } else {
        let totalCustom = 0;
        splits = group.members.map((m: any) => {
          const amt = parseFloat(customSplits[m._id]) || 0;
          totalCustom += amt;
          return { user: m._id, amount: amt };
        });
        
        // Exact floating point matching could be buggy, use a small 0.05 tolerance margin
        if (Math.abs(totalCustom - val) > 0.05) {
          toast.error(`Custom amounts must sum precisely to ${val}. They currently sum to ${totalCustom.toFixed(2)}`);
          return;
        }
      }
      
      await api.post('/expenses', {
        groupId: id,
        amount: val,
        description,
        splits
      });
      
      toast.success('Expense added successfully!');
      setShowAdd(false);
      setAmount('');
      setDescription('');
      setCustomSplits({});
      setSplitType('equal');
      loadData();
    } catch (err) {
      toast.error('Failed to add expense');
    }
  };

  if (!group) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white/30 backdrop-blur-2xl font-sans pb-32">
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 flex items-center">
          <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors mr-2">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{group.name}</h1>
            <p className="text-sm font-medium text-blue-600">{group.members.length} members</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
        {/* Balances & Settlement Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Overall Balances</h3>
            <div className="space-y-3">
              {balances && Object.entries(balances).map(([userId, bal]: [string, any]) => {
                const member = group.members.find((m: any) => m._id === userId);
                const b = bal as number;
                const isPositive = b > 0.01;
                const isNegative = b < -0.01;
                return (
                  <div key={userId} className="flex justify-between items-center p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                    <span className="font-semibold text-gray-800 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-sm font-black text-gray-600 shadow-inner">
                        {member?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span>{member?.name || 'Unknown'} {member?._id === user?.id && <span className="text-[10px] ml-2 font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}</span>
                      </div>
                    </span>
                    <span className={`font-black text-lg ${isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-500' : 'text-gray-400'}`}>
                      {isPositive ? '+' : ''}{isNegative ? '-' : ''}{formatCurrency(Math.abs(b), currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Action needed (Debts)</h3>
            <div className="space-y-3">
              {debts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="font-bold text-gray-800">All settled up!</p>
                  <p className="text-sm text-gray-500 mt-1">No pending debts in this group.</p>
                </div>
              ) : (
                debts.map((d, i) => {
                  const fromMem = group.members.find((m: any) => m._id === d.from);
                  const toMem = group.members.find((m: any) => m._id === d.to);
                  const isCurrentUserOwe = user?.id === d.from;
                  const isCurrentUserOwed = user?.id === d.to;
                  const bgClass = isCurrentUserOwe ? 'border-orange-100 bg-orange-50/50' : isCurrentUserOwed ? 'border-emerald-100 bg-emerald-50/50' : 'border-gray-50 bg-gray-50';
                  
                  return (
                    <div key={i} className={`p-4 rounded-2xl border-2 ${bgClass}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{fromMem?.name} {isCurrentUserOwe && <span className="text-[10px] ml-1 bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}</span>
                          <span className="text-sm text-gray-500 font-medium tracking-tight">owes <span className="text-gray-800 font-bold">{toMem?.name}</span> {isCurrentUserOwed && <span className="text-[10px] ml-1 bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}</span>
                        </div>
                        <span className="font-black text-xl text-gray-900">{formatCurrency(d.amount, currency)}</span>
                      </div>
                      
                      {isCurrentUserOwe && (
                        <button 
                          onClick={() => handleSettleUp(d.to, d.amount)} 
                          className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center"
                        >
                          <IndianRupee className="w-4 h-4 mr-1" /> Settle Debt Now
                        </button>
                      )}

                      {isCurrentUserOwed && (
                        <a 
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey ${fromMem?.name}! Just a quick reminder that for our group '${group.name}', you currently owe me ${formatCurrency(d.amount, currency)}. Please settle up when you can! 💸`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full mt-2 bg-[#25D366] text-white font-bold py-2.5 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="mr-2" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                          Remind via WhatsApp
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>

        {/* Expenses List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center">
            <Receipt className="w-6 h-6 mr-2 text-blue-600" />
            Recent Expenses
          </h3>
          <div className="space-y-4">
            {expenses.length === 0 ? (
              <p className="text-center font-medium text-gray-500 py-12 bg-white rounded-3xl border border-dashed border-gray-300">No expenses recorded yet.</p>
            ) : expenses.map((e, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                key={e._id} 
                className="bg-white p-5 rounded-3xl shadow-md border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-0.5">{e.description}</h4>
                    <p className="text-xs font-semibold text-gray-500">Paid by <span className="text-gray-800">{e.paidBy?.name}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-xl text-gray-900 block">{formatCurrency(e.amount, currency)}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{new Date(e.createdAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Add Expense Modal / Overlay */}
      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center p-4 sm:p-0"
          >
            <motion.div 
              initial={{ y: "100%", scale: 0.9 }} 
              animate={{ y: 0, scale: 1 }} 
              exit={{ y: "100%", scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                <h3 className="text-2xl font-black text-gray-900">Add an Expense</h3>
                <button onClick={() => setShowAdd(false)} className="p-2 flex-shrink-0 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-6">
                <form id="add-expense-form" onSubmit={handleAddExpense} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">What was this for?</label>
                    <input type="text" required value={description} onChange={e => setDescription(e.target.value)} 
                      className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-0 outline-none transition-colors text-lg font-bold" 
                      placeholder="e.g. Dinner, Taxi, Groceries" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total Amount Paid ({currency})</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-bold sm:text-xl text-lg">{formatCurrency(0, currency).replace(/[0-9.,\s]/g, '')}</span>
                      </div>
                      <input type="number" required min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-0 outline-none transition-colors text-3xl font-black text-gray-900 placeholder-gray-300" 
                        placeholder="0.00" />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">How do you want to split this?</label>
                    <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner">
                      <button type="button" onClick={() => setSplitType('equal')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${splitType === 'equal' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        Split Equally
                      </button>
                      <button type="button" onClick={() => setSplitType('custom')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${splitType === 'custom' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        Custom Amounts
                      </button>
                    </div>
                  </div>

                  {splitType === 'custom' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Enter exact amounts per person</p>
                      {group.members.map((m: any) => (
                        <div key={m._id} className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-gray-700 truncate flex-1">{m.name} {m._id === user?.id && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] ml-1 uppercase">You</span>}</span>
                          <div className="w-32 relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-gray-400 text-sm">
                              {formatCurrency(0, currency).replace(/[0-9.,\s]/g, '')}
                            </span>
                            <input 
                              type="number" 
                              step="0.01" 
                              min="0"
                              value={customSplits[m._id] || ''}
                              onChange={(e) => setCustomSplits(prev => ({ ...prev, [m._id]: e.target.value }))}
                              className="w-full pl-8 pr-3 py-2 text-sm font-bold bg-white border border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-colors" 
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </form>
              </div>
              <div className="p-6 pt-4 bg-white border-t border-gray-100 flex-shrink-0">
                <button type="submit" form="add-expense-form" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-blue-500/30 hover:scale-[1.02] transition-transform flex justify-center items-center">
                  <CheckCircle className="w-6 h-6 mr-2" /> Save Expense
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showAdd && (
        <motion.button 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center border-4 border-white z-40"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      )}
    </div>
  );
};

export default GroupDetails;
