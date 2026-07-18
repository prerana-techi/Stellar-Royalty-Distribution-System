import React, { useState } from 'react';
import { createAgreement } from '../services/registryService';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { submitTransaction } from '@/shared/lib/contracts';

export const CreateAgreementModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { address, signTransaction } = useWallet();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return alert("Connect wallet first!");
    
    setLoading(true);
    try {
      // Hardcode one recipient for the demo (100% share = 10000 bps)
      const recipients = [{
        name: "Myself",
        address: address,
        share_bps: 10000
      }];
      
      const xdr = await createAgreement(address, title, recipients);
      const signedXdr = await signTransaction(xdr);
      await submitTransaction(signedXdr);
      alert("Agreement created successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create agreement");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1C1F26] border border-[#2D313A] rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-white mb-4">New Agreement</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#0F1115] border border-[#2D313A] rounded-lg px-4 py-2 text-white"
              required 
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
