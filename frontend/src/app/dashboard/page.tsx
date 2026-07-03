'use client';

import { motion } from 'framer-motion';
import { useWallet } from '@/features/wallet/hooks/useWallet';
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
} from 'lucide-react';
import Link from 'next/link';

const mockAgreements = [
  { id: 1, title: 'Album: Midnight Dreams', status: 'Active', recipients: 3, distributed: 45000, created: '2024-12-01' },
  { id: 2, title: 'Single: Electric Vibes', status: 'Active', recipients: 2, distributed: 12500, created: '2024-12-15' },
  { id: 3, title: 'EP: Sunset Sessions', status: 'Draft', recipients: 4, distributed: 0, created: '2025-01-02' },
  { id: 4, title: 'Podcast: Tech Talk S3', status: 'Paused', recipients: 2, distributed: 8200, created: '2024-11-20' },
];

const recentPayments = [
  { id: 1, agreement: 'Midnight Dreams', amount: 5000, status: 'confirmed', time: '2 hours ago' },
  { id: 2, agreement: 'Electric Vibes', amount: 2500, status: 'confirmed', time: '5 hours ago' },
  { id: 3, agreement: 'Midnight Dreams', amount: 3000, status: 'processing', time: '1 day ago' },
];

export default function DashboardPage() {
  const { isConnected, address } = useWallet();

  const statCards = [
    { label: 'Total Agreements', value: '4', icon: FileText, color: 'from-purple-500 to-violet-600', change: '+2 this month' },
    { label: 'Total Distributed', value: '$65,700', icon: DollarSign, color: 'from-emerald-500 to-teal-500', change: '+12.5%' },
    { label: 'Recipients', value: '11', icon: Users, color: 'from-blue-500 to-cyan-500', change: '4 agreements' },
    { label: 'Avg. Distribution', value: '$5,475', icon: TrendingUp, color: 'from-orange-500 to-amber-500', change: '+8.3%' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {isConnected ? 'Overview of your royalty agreements and distributions' : 'Connect your wallet to get started'}
          </p>
        </div>
        <Link href="/dashboard" className="btn-primary">
          <Plus className="w-4 h-4" /> New Agreement
        </Link>
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
            <h2 className="text-lg font-semibold">Recent Agreements</h2>
            <Link href="/dashboard" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {mockAgreements.map((agreement, i) => (
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
                    <p className="text-xs text-muted-foreground">{agreement.recipients} recipients · Created {agreement.created}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`status-badge status-${agreement.status.toLowerCase()}`}>
                    {agreement.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${agreement.distributed.toLocaleString()} distributed
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
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
                  <p className="text-sm font-medium">${payment.amount.toLocaleString()}</p>
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
    </div>
  );
}
