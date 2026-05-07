'use client';
import { useEffect, useState } from 'react';

interface Campaign {
  id: string;
  name: string;
  niche: string;
  nicheTemplate: string;
  location: string;
  radiusMiles: number;
  status: string;
  createdAt: number;
}

const TEMPLATES = [
  { value: 'home-services', label: 'Home Services (plumbers, roofers, HVAC, electricians)' },
  { value: 'auto-repair', label: 'Auto Repair (mechanics, tire shops, body shops)' },
  { value: 'dental', label: 'Dental / Medical (dentists, doctors, chiropractors)' },
  { value: 'beauty', label: 'Beauty & Wellness (salons, spas, barbers, nail studios)' },
  { value: 'restaurant', label: 'Restaurant / Food & Beverage' },
  { value: 'professional', label: 'Professional Services (lawyers, accountants, consultants)' },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    niche: '',
    nicheTemplate: 'home-services',
    location: '',
    radiusMiles: 25,
  });

  const load = () =>
    fetch('/api/campaigns').then((r) => r.json()).then(setCampaigns);

  useEffect(() => { load(); }, []);

  async function create() {
    setLoading(true);
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(`Error: ${data.error}`);
      setLoading(false);
      return;
    }
    setShowForm(false);
    setForm({ name: '', niche: '', nicheTemplate: 'home-services', location: '', radiusMiles: 25 });
    await load();
    setLoading(false);
  }

  async function scrape(c: Campaign) {
    setScraping(c.id);
    try {
      const res = await fetch('/api/leads/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: c.id, niche: c.niche, location: c.location }),
      });
      const data = await res.json();
      alert(`Scrape complete: ${data.added} qualifying leads added out of ${data.total} found`);
    } finally {
      setScraping(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 text-sm mt-1">Each campaign targets a niche + location</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          + New Campaign
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">New Campaign</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Dallas Plumbers Q2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niche / Business Type</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. plumbers, roofers, dentists"
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Location</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Dallas, TX"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website Template</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.nicheTemplate}
                onChange={(e) => setForm({ ...form, nicheTemplate: e.target.value })}
              >
                {TEMPLATES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={create}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 px-5 py-2 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {campaigns.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
            No campaigns yet. Create one to start finding leads.
          </div>
        )}
        {campaigns.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">{c.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                {c.niche} · {c.location} · {c.nicheTemplate} template
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {c.status}
              </span>
              <button
                onClick={() => scrape(c)}
                disabled={scraping === c.id}
                className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50"
              >
                {scraping === c.id ? '⏳ Scraping...' : '🔍 Scrape Leads'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
