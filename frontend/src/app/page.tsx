'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield, Zap, Eye, Users, BarChart3, Globe } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'On-Chain Agreements',
    description: 'Immutable royalty agreements stored on Stellar. No disputes, no ambiguity.',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    icon: Zap,
    title: 'Instant Distribution',
    description: 'Automated payment splitting via smart contracts. Recipients get paid in seconds.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    description: 'Every transaction is tracked on-chain. Real-time activity feed and audit trail.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Users,
    title: 'Multi-Recipient',
    description: 'Support up to 10 recipients per agreement with precise basis-point shares.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track distribution metrics, earnings over time, and agreement performance.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Globe,
    title: 'Stellar Network',
    description: 'Built on Stellar — fast finality, low fees, and cross-border capability.',
    gradient: 'from-indigo-500 to-purple-500',
  },
];

const stats = [
  { value: '< 5s', label: 'Settlement Time' },
  { value: '< $0.01', label: 'Transaction Fee' },
  { value: '100%', label: 'On-Chain Transparency' },
  { value: '10,000', label: 'Basis Point Precision' },
];

export default function LandingPage() {
  return (
    <div className="-m-4 md:-m-6 lg:-m-8">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-purple-500/20 bg-purple-500/5 text-sm text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Powered by Stellar & Soroban Smart Contracts
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Royalty Distribution,{' '}
              <span className="gradient-text">Reimagined</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Create transparent royalty agreements, automate payment splitting,
              and track every distribution on the Stellar blockchain.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-4">
                Launch App <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://github.com/prerana-techi/Stellar-Royalty-Distribution-System"
                target="_blank"
                className="btn-secondary text-lg px-8 py-4"
              >
                View Source
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for{' '}
              <span className="gradient-text">Royalty Management</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete platform for creating, managing, and distributing royalties — 
              built on Stellar&apos;s fast and low-cost blockchain.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="glass-card p-6 hover:bg-white/[0.04] transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-12 glow-purple">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8">
              Connect your Stellar wallet and create your first royalty agreement in minutes.
            </p>
            <Link href="/dashboard" className="btn-primary text-lg px-8 py-4">
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
