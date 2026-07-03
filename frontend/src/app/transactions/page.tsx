'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ExternalLink,
  RotateCcw,
  Filter,
  Copy,
} from 'lucide-react';
import type { TransactionLifecycle } from '@/shared/types';
import { toast } from 'sonner';

interface MockTx {
  id: string;
  hash: string;
  type: string;
  description: string;
  status: TransactionLifecycle;
  timestamp: number;
  amount?: string;
  error?: string;
}

const mockTransactions: MockTx[] = [
  {
    id: '1',
    hash: '4a8f2c1d3e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    type: 'distribute',
    description: 'Distribute 5,000 XLM for "Midnight Dreams"',
    status: 'confirmed',
    timestamp: Date.now() - 3600000,
    amount: '5,000 XLM',
  },
  {
    id: '2',
    hash: '1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    type: 'create_agreement',
    description: 'Create agreement "Sunset Sessions"',
    status: 'confirmed',
    timestamp: Date.now() - 7200000,
  },
  {
    id: '3',
    hash: '9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c',
    type: 'distribute',
    description: 'Distribute 2,500 XLM for "Electric Vibes"',
    status: 'processing',
    timestamp: Date.now() - 1800000,
    amount: '2,500 XLM',
  },
  {
    id: '4',
    hash: '',
    type: 'activate',
    description: 'Activate agreement "Sunset Sessions"',
    status: 'pending',
    timestamp: Date.now() - 300000,
  },
  {
    id: '5',
    hash: '5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e',
    type: 'distribute',
    description: 'Distribute 1,000 XLM for "Tech Talk S3"',
    status: 'failed',
    timestamp: Date.now() - 86400000,
    amount: '1,000 XLM',
    error: 'Insufficient balance for distribution',
  },
];

const statusConfig: Record<TransactionLifecycle, {
  icon: typeof CheckCircle2;
  color: string;
  label: string;
  bgColor: string;
}> = {
  pending: { icon: Clock, color: 'text-blue-400', label: 'Pending', bgColor: 'bg-blue-500/10' },
  processing: { icon: Loader2, color: 'text-purple-400', label: 'Processing', bgColor: 'bg-purple-500/10' },
  confirmed: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Confirmed', bgColor: 'bg-emerald-500/10' },
  failed: { icon: XCircle, color: 'text-red-400', label: 'Failed', bgColor: 'bg-red-500/10' },
};

export default function TransactionsPage() {
  const [transactions] = useState<MockTx[]>(mockTransactions);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = statusFilter === 'all'
    ? transactions
    : transactions.filter((tx) => tx.status === statusFilter);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success('Transaction hash copied');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <ArrowLeftRight className="w-8 h-8 text-primary" />
          Transaction Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Track all your blockchain transactions with full lifecycle visibility
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['pending', 'processing', 'confirmed', 'failed'] as TransactionLifecycle[]).map((status) => {
          const config = statusConfig[status];
          const count = transactions.filter((tx) => tx.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`glass-card p-4 text-left transition-all hover:bg-white/[0.04] ${
                statusFilter === status ? 'border-primary/30' : ''
              }`}
              id={`filter-status-${status}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <config.icon className={`w-4 h-4 ${config.color} ${status === 'processing' ? 'animate-spin' : ''}`} />
                <span className="text-xs text-muted-foreground capitalize">{config.label}</span>
              </div>
              <p className="text-2xl font-bold">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filtered.map((tx, i) => {
          const config = statusConfig[tx.status];
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bgColor}`}>
                    <config.icon className={`w-5 h-5 ${config.color} ${tx.status === 'processing' ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.description}</p>
                    {tx.amount && (
                      <p className="text-sm text-primary font-semibold mt-0.5">{tx.amount}</p>
                    )}
                    {tx.hash && (
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-xs text-muted-foreground font-mono bg-white/5 px-2 py-1 rounded">
                          {tx.hash.slice(0, 12)}...{tx.hash.slice(-12)}
                        </code>
                        <button onClick={() => copyHash(tx.hash)} className="text-muted-foreground hover:text-foreground">
                          <Copy className="w-3 h-3" />
                        </button>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary/60 hover:text-primary"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {tx.error && (
                      <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> {tx.error}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`status-badge status-${tx.status}`}>
                    {config.label}
                  </span>
                  {tx.status === 'failed' && (
                    <button
                      className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Retry transaction"
                      id={`retry-tx-${tx.id}`}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{tx.type.replace(/_/g, ' ')}</span>
                <span>{new Date(tx.timestamp).toLocaleString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
