import React, { useState, useCallback } from 'react';
import { createAgreement } from '../services/registryService';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { submitTransaction } from '@/shared/lib/contracts';
import { useAgreementStore } from '../store/agreementStore';
import { toast } from 'sonner';
import { Plus, Trash2, X, AlertCircle, Users, Loader2 } from 'lucide-react';

interface RecipientRow {
  name: string;
  address: string;
  share_bps: number;
}

const emptyRecipient = (): RecipientRow => ({
  name: '',
  address: '',
  share_bps: 0,
});

export const CreateAgreementModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { address, signTransaction } = useWallet();
  const fetchAgreements = useAgreementStore(s => s.fetchAgreements);
  const [title, setTitle] = useState('');
  const [recipients, setRecipients] = useState<RecipientRow[]>([
    { name: '', address: '', share_bps: 10000 },
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const totalBps = recipients.reduce((sum, r) => sum + r.share_bps, 0);
  const isSharesValid = totalBps === 10000;

  const updateRecipient = useCallback(
    (index: number, field: keyof RecipientRow, value: string | number) => {
      setRecipients(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  const addRecipient = () => {
    if (recipients.length >= 10) {
      toast.error('Maximum 10 recipients allowed');
      return;
    }
    setRecipients(prev => [...prev, emptyRecipient()]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length <= 1) return;
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const prefillSelf = (index: number) => {
    if (!address) return;
    updateRecipient(index, 'address', address);
    if (!recipients[index].name) {
      updateRecipient(index, 'name', 'Myself');
    }
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Title is required');
    if (recipients.length === 0) errs.push('At least one recipient is required');

    recipients.forEach((r, i) => {
      if (!r.name.trim()) errs.push(`Recipient ${i + 1}: Name is required`);
      if (!r.address.trim()) {
        errs.push(`Recipient ${i + 1}: Address is required`);
      } else if (!/^G[A-Z2-7]{55}$/.test(r.address.trim())) {
        errs.push(`Recipient ${i + 1}: Invalid Stellar address`);
      }
      if (r.share_bps <= 0) errs.push(`Recipient ${i + 1}: Share must be greater than 0%`);
    });

    if (totalBps !== 10000) {
      errs.push(`Shares must total exactly 100% (currently ${(totalBps / 100).toFixed(2)}%)`);
    }

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setLoading(true);

    try {
      const cleanedRecipients = recipients.map(r => ({
        name: r.name.trim(),
        address: r.address.trim(),
        share_bps: r.share_bps,
      }));

      const xdrStr = await createAgreement(address, title.trim(), cleanedRecipients);
      toast.info('Please sign the transaction in your wallet...');

      const signedXdr = await signTransaction(xdrStr);
      toast.info('Submitting transaction to the network...');

      await submitTransaction(signedXdr);
      toast.success('Agreement created successfully!', {
        description: `"${title.trim()}" with ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`,
      });

      // Refresh on-chain agreements
      fetchAgreements(address);

      // Reset form
      setTitle('');
      setRecipients([{ name: '', address: '', share_bps: 10000 }]);
      onClose();
    } catch (err: any) {
      console.error('Agreement creation failed:', err);
      const message = err?.message || 'Failed to create agreement';
      if (message.includes('User declined')) {
        toast.error('Transaction cancelled', { description: 'You declined the signing request' });
      } else {
        toast.error('Agreement creation failed', { description: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#1C1F26] border border-[#2D313A] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">New Agreement</h2>
              <p className="text-xs text-gray-400">Create a royalty distribution agreement</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Errors */}
            {errors.length > 0 && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    {errors.map((err, i) => (
                      <p key={i} className="text-sm text-red-400">{err}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Agreement Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder='e.g. "Album: Midnight Dreams"'
                className="input-field"
                required
                disabled={loading}
                id="agreement-title"
              />
            </div>

            {/* Recipients */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">
                  Recipients ({recipients.length}/10)
                </label>
                <button
                  type="button"
                  onClick={addRecipient}
                  disabled={recipients.length >= 10 || loading}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  id="add-recipient-btn"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Recipient
                </button>
              </div>

              <div className="space-y-3">
                {recipients.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Recipient {i + 1}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => prefillSelf(i)}
                          className="text-xs text-primary/60 hover:text-primary transition-colors"
                          disabled={loading}
                        >
                          Use my wallet
                        </button>
                        {recipients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecipient(i)}
                            disabled={loading}
                            className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Name</label>
                        <input
                          type="text"
                          value={r.name}
                          onChange={e => updateRecipient(i, 'name', e.target.value)}
                          placeholder="Recipient name"
                          className="w-full bg-[#0F1115] border border-[#2D313A] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50"
                          disabled={loading}
                          id={`recipient-name-${i}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Share (%)</label>
                        <input
                          type="number"
                          min="0.01"
                          max="100"
                          step="0.01"
                          value={r.share_bps > 0 ? (r.share_bps / 100).toFixed(2) : ''}
                          onChange={e => {
                            const pct = parseFloat(e.target.value);
                            updateRecipient(i, 'share_bps', isNaN(pct) ? 0 : Math.round(pct * 100));
                          }}
                          placeholder="e.g. 50.00"
                          className="w-full bg-[#0F1115] border border-[#2D313A] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary/50"
                          disabled={loading}
                          id={`recipient-share-${i}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Stellar Address</label>
                      <input
                        type="text"
                        value={r.address}
                        onChange={e => updateRecipient(i, 'address', e.target.value)}
                        placeholder="G..."
                        className="w-full bg-[#0F1115] border border-[#2D313A] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                        disabled={loading}
                        id={`recipient-address-${i}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share Summary Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-400">Total Allocation</span>
                <span className={isSharesValid ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                  {(totalBps / 100).toFixed(2)}% / 100%
                </span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex">
                {recipients.map((r, i) => {
                  if (r.share_bps <= 0) return null;
                  const colors = [
                    'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
                    'bg-pink-500', 'bg-cyan-500', 'bg-violet-500', 'bg-amber-500',
                    'bg-teal-500', 'bg-rose-500',
                  ];
                  return (
                    <div
                      key={i}
                      className={`${colors[i % colors.length]} transition-all duration-300`}
                      style={{ width: `${Math.min((r.share_bps / 10000) * 100, 100)}%` }}
                      title={`${r.name || `Recipient ${i + 1}`}: ${(r.share_bps / 100).toFixed(2)}%`}
                    />
                  );
                })}
              </div>
              {totalBps > 10000 && (
                <p className="text-xs text-red-400 mt-1">
                  Over-allocated by {((totalBps - 10000) / 100).toFixed(2)}%
                </p>
              )}
              {totalBps > 0 && totalBps < 10000 && (
                <p className="text-xs text-yellow-400 mt-1">
                  {((10000 - totalBps) / 100).toFixed(2)}% remaining to allocate
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isSharesValid}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              id="create-agreement-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                'Create Agreement'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
