'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, PieChart } from 'lucide-react';

const distributionData = [
  { month: 'Jan', amount: 12000 },
  { month: 'Feb', amount: 18500 },
  { month: 'Mar', amount: 15200 },
  { month: 'Apr', amount: 22800 },
  { month: 'May', amount: 19400 },
  { month: 'Jun', amount: 28100 },
];

const topRecipients = [
  { name: 'Artist (Lead)', share: '50%', earned: '$32,850', color: 'bg-purple-500' },
  { name: 'Producer', share: '30%', earned: '$19,710', color: 'bg-blue-500' },
  { name: 'Label', share: '15%', earned: '$9,855', color: 'bg-cyan-500' },
  { name: 'Manager', share: '5%', earned: '$3,285', color: 'bg-emerald-500' },
];

const agreementMetrics = [
  { label: 'Active Agreements', value: 3, change: '+1', positive: true },
  { label: 'Avg Distribution', value: '$5,475', change: '+8.3%', positive: true },
  { label: 'Total Payments', value: 24, change: '+6', positive: true },
  { label: 'Failed Transactions', value: 1, change: '-2', positive: true },
];

export default function AnalyticsPage() {
  const maxAmount = Math.max(...distributionData.map(d => d.amount));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" /> Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Distribution metrics and performance insights</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {agreementMetrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">{m.label}</p>
            <p className="text-2xl font-bold">{m.value}</p>
            <p className={`text-xs mt-1 ${m.positive ? 'text-emerald-400' : 'text-red-400'}`}>{m.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Distribution Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Monthly Distributions
          </h2>
          <div className="flex items-end gap-3 h-48">
            {distributionData.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">${(d.amount / 1000).toFixed(1)}k</span>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(d.amount / maxAmount) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-blue-500 min-h-[4px]" />
                <span className="text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Recipients */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" /> Top Recipients
          </h2>
          <div className="space-y-4">
            {topRecipients.map((r, i) => (
              <div key={r.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${r.color}`} />
                    <span className="font-medium">{r.name}</span>
                  </div>
                  <span className="text-muted-foreground">{r.earned}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: r.share }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
                    className={`h-full rounded-full ${r.color}`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
