'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  FileText,
  DollarSign,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'agreement_created' | 'agreement_activated' | 'agreement_paused' | 'agreement_terminated' | 'payment_distributed' | 'distribution_sent';
  description: string;
  timestamp: number;
  txHash: string;
  icon: typeof FileText;
  color: string;
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'payment_distributed',
    description: 'Payment of 5,000 XLM distributed for "Midnight Dreams"',
    timestamp: Date.now() - 120000,
    txHash: 'abc123...def456',
    icon: DollarSign,
    color: 'text-emerald-400 bg-emerald-500/10',
  },
  {
    id: '2',
    type: 'agreement_activated',
    description: 'Agreement "Electric Vibes" activated',
    timestamp: Date.now() - 300000,
    txHash: 'ghi789...jkl012',
    icon: CheckCircle2,
    color: 'text-blue-400 bg-blue-500/10',
  },
  {
    id: '3',
    type: 'distribution_sent',
    description: '3,000 XLM sent to Artist (60%) for "Midnight Dreams"',
    timestamp: Date.now() - 600000,
    txHash: 'mno345...pqr678',
    icon: DollarSign,
    color: 'text-purple-400 bg-purple-500/10',
  },
  {
    id: '4',
    type: 'agreement_created',
    description: 'New agreement "Sunset Sessions" created with 4 recipients',
    timestamp: Date.now() - 3600000,
    txHash: 'stu901...vwx234',
    icon: FileText,
    color: 'text-violet-400 bg-violet-500/10',
  },
  {
    id: '5',
    type: 'agreement_paused',
    description: 'Agreement "Tech Talk S3" paused by owner',
    timestamp: Date.now() - 7200000,
    txHash: 'yza567...bcd890',
    icon: PauseCircle,
    color: 'text-orange-400 bg-orange-500/10',
  },
  {
    id: '6',
    type: 'payment_distributed',
    description: 'Payment of 2,500 XLM distributed for "Electric Vibes"',
    timestamp: Date.now() - 18000000,
    txHash: 'efg123...hij456',
    icon: DollarSign,
    color: 'text-emerald-400 bg-emerald-500/10',
  },
];

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityItem[]>(mockActivity);
  const [filter, setFilter] = useState<string>('all');
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Simulate real-time event polling
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(() => {
      setLastUpdate(Date.now());
      // In production, this would call soroban.getEvents()
    }, 5000);

    return () => clearInterval(interval);
  }, [isPolling]);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter((e) => e.type.includes(filter));

  const filterOptions = [
    { value: 'all', label: 'All Events' },
    { value: 'agreement', label: 'Agreements' },
    { value: 'payment', label: 'Payments' },
    { value: 'distribution', label: 'Distributions' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            Activity Feed
          </h1>
          <p className="text-muted-foreground mt-1">Real-time contract events from the Stellar network</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
            {isPolling ? 'Live' : 'Paused'}
          </div>
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`btn-secondary text-sm py-2 px-3 ${isPolling ? '' : 'opacity-60'}`}
            id="toggle-polling"
          >
            <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === opt.value
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent'
            }`}
            id={`filter-${opt.value}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Event List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 hover:bg-white/[0.04] transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${event.color}`}>
                  <event.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{event.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground">{timeAgo(event.timestamp)}</span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary/60 hover:text-primary font-mono"
                    >
                      {event.txHash}
                    </a>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-muted-foreground whitespace-nowrap">
                  {event.type.replace(/_/g, ' ')}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
