import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Users } from 'lucide-react';

const CreateGroup = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberEmails, setMemberEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const emailsArray = memberEmails.split(',').map(e => e.trim()).filter(e => e);
      await api.post('/groups', { 
        name, 
        description, 
        memberEmails: emailsArray 
      });
      toast.success('Group created successfully!');
      navigate('/');
    } catch (err) {
      toast.error('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center">
          <Link to="/" className="text-gray-500 hover:text-gray-700 mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Create New Group</h1>
        </div>
      </header>
      <main className="max-w-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Group Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
                placeholder="e.g. Goa Trip" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
                placeholder="Summer vacation with friends" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Add Members (Emails)</label>
              <textarea value={memberEmails} onChange={e => setMemberEmails(e.target.value)} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
                placeholder="Comma separated emails. Ensure they have an account." rows={3} />
            </div>
            <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              <Users className="w-4 h-4 mr-2" /> {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateGroup;
