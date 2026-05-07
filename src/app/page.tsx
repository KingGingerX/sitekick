'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Lead { status: string }
interface Deal { stage: string; totalValue: number | null; basePrice: number | null }

interface Stats {
  campaigns: number;
  leads: number;
  sitesBuilt: number;
  contacted: number;
  dealsWon: number;
  dealsLost: number;
  revenue: number;
  pipeline: number;
  avgDeal: number;
  contactRate: number;
  closeRate: number;
}

function pct(n: number, d: number) {
  if (!d) return '—';
  return `${Math.round((n / d) * 100)}%`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/campaigns').then((r) => r.json()),
      fetch('/api/leads').then((r) => r.json()),
      fetch('/api/deals').then((r) => r.json()),
    ]).then(([campaigns, leads, deals]: [unknown[], Lead[], Deal[]]) => {
      const sitesBuilt = leads.filter((l) => l.status !== 'new').length;
      const contacted = leads.filter((l) =>
        ['contacted', 'interested', 'negotiating', 'sold'].includes(l.status)
      ).length;
      const wonDeals = deals.filter((d) => d.stage === 'closed_won');
      const lostDeals = deals.filter((d) => d.stage === 'closed_lost');
      const openDeals = deals.filter((d) => !['closed_won', 'closed_lost'].includes(d.stage));
      const revenue = wonDeals.reduce((s, d) => s + (d.totalValue ?? 0), 0);
      const pipeline = openDeals.reduce((s, d) => s + (d.basePrice ?? 497), 0);
      const closedTotal = wonDeals.length + lostDeals.length;

      setStats({
        campaigns: campaigns.length,
        leads: leads.length,
        sitesBuilt,
        contacted,
        dealsWon: wonDeals.length,
        dealsLost: lostDeals.length,
        revenue,
        pipeline,
        avgDeal: wonDeals.length ? Math.round(revenue / wonDeals.length) : 0,
        contactRate: leads.length ? Math.round((contacted / leads.length) * 100) : 0,
        closeRate: closedTotal ? Math.round((wonDeals.length / closedTotal) * 100) : 0,
      });
    });
  }, []);

  const primaryCards = [
    { label: 'Campaigns', value: stats?.campaigns ?? '—', icon: '🎯', href: '/campaigns', color: 'border-blue-200' },
    { label: 'Leads Found', value: stats?.leads ?? '—', icon: '🔍', href: '/leads', color: 'border-indigo-200' },
    { label: 'Sites Built', value: stats?.sitesBuilt ?? '—', icon: '🌐', href: '/leads', color: 'border-purple-200' },
    { label: 'Contacted', value: stats?.contacted ?? '—', icon: '✉️', href: '/outreach', color: 'border-yellow-200' },
    { label: 'Deals Won', value: stats?.dealsWon ?? '—', icon: '🏆', href: '/deals', color: 'border-green-200' },
    {
      label: 'Revenue',
      value: stats ? `$${stats.revenue.toLocaleString()}` : '—',
      icon: '💰',
      href: '/deals',
      color: 'border-emerald-200',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Your website sales pipeline at a glance</p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {primaryCards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`bg-white rounded-xl border-2 ${c.color} p-6 hover:shadow-md transition-shadow`}
          >
            <div className="text-3xl mb-2">{c.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{c.value}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </Link>
        ))}
      </div>

      {/* Conversion Funnel Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-center">
          <div className="text-2xl font-black text-blue-700">
            {stats ? `${stats.contactRate}%` : '—'}
          </div>
          <div className="text-xs text-blue-600 font-semibold mt-1">Lead → Contact Rate</div>
          <div className="text-xs text-gray-400 mt-1">
            {stats ? `${stats.contacted} of ${stats.leads}` : ''}
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-center">
          <div className="text-2xl font-black text-green-700">
            {stats ? `${stats.closeRate}%` : '—'}
          </div>
          <div className="text-xs text-green-600 font-semibold mt-1">Contact → Win Rate</div>
          <div className="text-xs text-gray-400 mt-1">
            {stats ? `${stats.dealsWon} won / ${stats.dealsLost} lost` : ''}
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 text-center">
          <div className="text-2xl font-black text-orange-700">
            {stats?.pipeline ? `$${stats.pipeline.toLocaleString()}` : '—'}
          </div>
          <div className="text-xs text-orange-600 font-semibold mt-1">Pipeline Value</div>
          <div className="text-xs text-gray-400 mt-1">Open deals</div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 text-center">
          <div className="text-2xl font-black text-purple-700">
            {stats?.avgDeal ? `$${stats.avgDeal.toLocaleString()}` : '—'}
          </div>
          <div className="text-xs text-purple-600 font-semibold mt-1">Avg Deal Value</div>
          <div className="text-xs text-gray-400 mt-1">Per closed deal</div>
        </div>
      </div>

      {/* Next Action Prompt */}
      {stats && stats.leads === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="font-semibold text-blue-900 mb-2">Quick Start</h2>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li><Link href="/campaigns" className="underline">Create a campaign</Link> — pick a niche and target city</li>
            <li>Run the scraper to find leads with no/poor websites</li>
            <li>Generate a site for each lead (Claude builds it automatically)</li>
            <li>Send outreach email with the preview link</li>
            <li>Close the deal and collect payment via Stripe</li>
          </ol>
        </div>
      ) : stats && stats.sitesBuilt > stats.contacted ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="font-semibold text-yellow-900 mb-1">Action Required</h2>
          <p className="text-sm text-yellow-800">
            You have <strong>{stats.sitesBuilt - stats.contacted}</strong> leads with sites built but not yet contacted.{' '}
            <Link href="/leads" className="underline font-semibold">Go send their outreach emails →</Link>
          </p>
        </div>
      ) : stats && stats.leads > stats.sitesBuilt ? (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h2 className="font-semibold text-purple-900 mb-1">Sites Ready to Build</h2>
          <p className="text-sm text-purple-800">
            You have <strong>{stats.leads - stats.sitesBuilt}</strong> new leads waiting for sites.{' '}
            <Link href="/leads" className="underline font-semibold">Go build their sites →</Link>
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h2 className="font-semibold text-green-900 mb-1">Pipeline Looking Good</h2>
          <p className="text-sm text-green-800">
            All leads are being worked.{' '}
            <Link href="/campaigns" className="underline font-semibold">Scrape more leads →</Link> or{' '}
            <Link href="/deals" className="underline font-semibold">follow up on open deals →</Link>
          </p>
        </div>
      )}
    </div>
  );
}
