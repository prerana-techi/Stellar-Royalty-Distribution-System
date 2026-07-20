'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useAgreements } from '@/features/agreements/hooks/useAgreements';
import {
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { CreateAgreementModal } from '@/features/agreements/ui/CreateAgreementModal';
import { formatXLM } from '@/shared/lib/stellar';

const recentPayments = [
  { id: 1, agreement: 'Midnight Dreams', amount: 5000, status: 'confirmed', time: '2 hours ago' },
  { id: 2, agreement: 'Electric Vibes', amount: 2500, status: 'confirmed', time: '5 hours ago' },
  { id: 3, agreement: 'Midnight Dreams', amount: 3000, status: 'processing', time: '1 day ago' },
];

function formatStatus(status: string): string {
  // Contract returns status as enum variant names like "Draft", "Active", etc.
  const s = String(status);
  // Handle both raw enum values and pre-formatted strings
  if (s === 'Draft' || s === 'Active' || s === 'Paused' || s === 'Terminated') return s;
  // Capitalize first letter as fallback
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default function DashboardPage() {
  const { isConnected, address } = useWallet();
  const { agreements, isLoading, error, refresh } = useAgreements();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalDistributed = agreements.reduce((sum, a) => sum + a.total_distributed, 0);
  const totalRecipients = agreements.reduce((sum, a) => sum + a.recipients.length, 0);
  const avgDistribution = agreements.length > 0 ? totalDistributed / agreements.length : 0;

  const statCards = [
    {
      label: 'Total Agreements',
      value: isLoading ? '...' : String(agreements.length),
      icon: FileText,
      color: 'from-purple-500 to-violet-600',
      change: agreements.length > 0 ? `${agreements.filter(a => formatStatus(a.status) === 'Active').length} active` : 'None yet',
    },
    {
      label: 'Total Distributed',
      value: isLoading ? '...' : formatXLM(totalDistributed),
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-500',
      change: 'XLM',
    },
    {
      label: 'Recipients',
      value: isLoading ? '...' : String(totalRecipients),
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      change: `${agreements.length} agreement${agreements.length !== 1 ? 's' : ''}`,
    },
    {
      label: 'Avg. Distribution',
      value: isLoading ? '...' : formatXLM(avgDistribution),
      icon: TrendingUp,
      color: 'from-orange-500 to-amber-500',
      change: 'per agreement',
    },
  ];

  const handleModalClose = () => {
    setIsModalOpen(false);
    // The modal triggers a refresh via the store itself
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {isConnected
              ? 'Overview of your royalty agreements and distributions'
              : 'Connect your wallet to get started'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={refresh}
              disabled={isLoading}
              className="btn-secondary text-sm py-2.5 px-3"
              title="Refresh from chain"
              id="refresh-agreements"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" id="new-agreement-btn">
            <Plus className="w-4 h-4" /> New Agreement
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 hover:bg-white/[0.04] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-emerald-400 font-medium">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agreements List */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Your Agreements</h2>
            {agreements.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {agreements.length} total
              </span>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary/60" />
              <p className="text-sm">Fetching your agreements from chain...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 mb-3 text-red-400" />
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <button onClick={refresh} className="btn-secondary text-sm py-2">
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && agreements.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Inbox className="w-12 h-12 mb-3 text-white/10" />
              <p className="text-sm font-medium text-gray-400 mb-1">No agreements yet</p>
              <p className="text-xs text-gray-500 mb-4">Create your first royalty agreement to get started</p>
              <button onClick={() => setIsModalOpen(true)} className="btn-primary text-sm">
                <Plus className="w-3.5 h-3.5" /> Create Agreement
              </button>
            </div>
          )}

          {/* Agreements */}
          {!isLoading && !error && agreements.length > 0 && (
            <div className="space-y-3">
              {agreements.map((agreement, i) => {
                const status = formatStatus(agreement.status);
                return (
                  <motion.div
                    key={agreement.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-purple-300">
                        #{agreement.id}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{agreement.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {agreement.recipients.length} recipient{agreement.recipients.length !== 1 ? 's' : ''} ·{' '}
                          Created {new Date(agreement.created_at * 1000).toLocaleDateString('en-US')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`status-badge status-${status.toLowerCase()}`}>
                        {status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatXLM(agreement.total_distributed)} distributed
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6">Recent Payments</h2>
          <div className="space-y-4">
            {recentPayments.map((payment, i) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                  payment.status === 'confirmed'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-purple-500/10 text-purple-400'
                }`}>
                  {payment.status === 'confirmed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">${payment.amount.toLocaleString('en-US')}</p>
                  <p className="text-xs text-muted-foreground truncate">{payment.agreement}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{payment.time}</span>
              </motion.div>
            ))}
          </div>
          <Link
            href="/transactions"
            className="mt-6 w-full btn-secondary text-sm py-2 flex items-center justify-center"
          >
            View All Transactions
          </Link>
        </div>
      </div>
      <CreateAgreementModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  );
}
