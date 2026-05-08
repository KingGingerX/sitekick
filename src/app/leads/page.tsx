'use client';
import { useEffect, useState } from 'react';

interface Lead {
  id: string;
  businessName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  websiteScore: number | null;
  websiteIssues: string | null;
  googleRating: number | null;
  status: string;
  campaignId: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-600',
  site_built: 'bg-purple-100 text-purple-700',
  contacted: 'bg-blue-100 text-blue-700',
  interested: 'bg-yellow-100 text-yellow-700',
  negotiating: 'bg-orange-100 text-orange-700',
  sold: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-600',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [bulkBuilding, setBulkBuilding] = useState(false);
  const [bulkEmailing, setBulkEmailing] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [editEmail, setEditEmail] = useState('');
  const [filter, setFilter] = useState('all');
  const [findingEmail, setFindingEmail] = useState<string | null>(null);

  const load = () => fetch('/api/leads').then((r) => r.json()).then(setLeads);
  useEffect(() => { load(); }, []);

  async function generateSite(lead: Lead) {
    setGenerating(lead.id);
    const res = await fetch('/api/sites/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: lead.id }),
    });
    const data = await res.json();
    setPreviewUrls((prev) => ({ ...prev, [lead.id]: data.previewUrl }));
    await load();
    setGenerating(null);
  }

  async function sendOutreach(lead: Lead, stage: 1 | 2 | 3) {
    setSending(lead.id);
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, stage, overrideEmail: editEmail || lead.email }),
      });
      const data = await res.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert(`Email sent!\n\nSubject: ${data.subject}`);
      }
      await load();
    } catch (err) {
      alert(`Failed: ${err}`);
    } finally {
      setSending(null);
    }
  }

  async function findEmail(lead: Lead) {
    setFindingEmail(lead.id);
    try {
      const res = await fetch('/api/leads/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (data.email) {
        alert(`Found: ${data.email} — saved automatically`);
        await load();
      } else {
        alert(data.error ?? data.message ?? 'No email found');
      }
    } catch {
      alert('Failed to search for email');
    } finally {
      setFindingEmail(null);
    }
  }

  async function updateEmail(lead: Lead) {
    if (!editEmail) return;
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, email: editEmail }),
    });
    await load();
    setEditEmail('');
  }

  async function bulkBuildAll() {
    const newLeads = leads.filter((l) => l.status === 'new');
    if (!newLeads.length) return;
    if (!confirm(`Build sites for all ${newLeads.length} new leads? This uses Claude API credits.`)) return;
    setBulkBuilding(true);
    for (const lead of newLeads) {
      const res = await fetch('/api/sites/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (data.previewUrl) {
        setPreviewUrls((prev) => ({ ...prev, [lead.id]: data.previewUrl }));
      }
    }
    await load();
    setBulkBuilding(false);
  }

  async function bulkEmailAll() {
    const sitesBuilt = leads.filter((l) => l.status === 'site_built' && l.email);
    if (!sitesBuilt.length) return;
    if (!confirm(`Send Stage 1 emails to all ${sitesBuilt.length} site_built leads with email addresses?`)) return;
    setBulkEmailing(true);
    const res = await fetch('/api/outreach', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 1 }),
    });
    const data = await res.json();
    alert(`Bulk email complete: ${data.sent} sent, ${data.skipped} skipped`);
    await load();
    setBulkEmailing(false);
  }

  const newCount = leads.filter((l) => l.status === 'new').length;
  const siteBuiltWithEmail = leads.filter((l) => l.status === 'site_built' && l.email).length;
  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">Businesses found with missing or poor websites</p>
        </div>
        <div className="flex gap-2">
          {newCount > 0 && (
            <button
              onClick={bulkBuildAll}
              disabled={bulkBuilding}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {bulkBuilding ? 'Building...' : `🌐 Build All New (${newCount})`}
            </button>
          )}
          {siteBuiltWithEmail > 0 && (
            <button
              onClick={bulkEmailAll}
              disabled={bulkEmailing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {bulkEmailing ? 'Sending...' : `✉️ Email All Site-Built (${siteBuiltWithEmail})`}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'new', 'site_built', 'contacted', 'interested', 'sold'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
            {s !== 'all' && (
              <span className="ml-1 text-xs opacity-70">
                ({leads.filter((l) => l.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
            No leads yet. Run a scraper from the Campaigns page.
          </div>
        )}
        {filtered.map((lead) => (
          <div key={lead.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 truncate">{lead.businessName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {lead.status.replace('_', ' ')}
                  </span>
                  {lead.websiteScore !== null ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      lead.websiteScore < 40 ? 'bg-red-100 text-red-600' :
                      lead.websiteScore < 70 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      Site: {lead.websiteScore}/100
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">No website</span>
                  )}
                  {lead.googleRating && lead.googleRating >= 4.0 && (
                    <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
                      ⭐ {lead.googleRating}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1 space-x-3">
                  {lead.address && <span>📍 {lead.address}</span>}
                  {lead.phone && <span>📞 {lead.phone}</span>}
                  {lead.email && <span>✉️ {lead.email}</span>}
                </div>
                {lead.websiteIssues && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {(JSON.parse(lead.websiteIssues) as string[]).map((issue, i) => (
                      <span key={i} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded">
                        {issue}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {previewUrls[lead.id] && (
                  <a
                    href={previewUrls[lead.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    Preview
                  </a>
                )}
                <button
                  onClick={() => generateSite(lead)}
                  disabled={generating === lead.id}
                  className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-100 disabled:opacity-50"
                >
                  {generating === lead.id ? 'Building...' : '🌐 Build Site'}
                </button>
                <button
                  onClick={() => setSelected(selected?.id === lead.id ? null : lead)}
                  className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100"
                >
                  ✉️ Outreach
                </button>
              </div>
            </div>

            {selected?.id === lead.id && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex gap-2 items-center mb-3">
                  <input
                    type="email"
                    placeholder={lead.email ?? 'Enter email address...'}
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1"
                  />
                  {editEmail && (
                    <button
                      onClick={() => updateEmail(lead)}
                      className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                    >
                      Save Email
                    </button>
                  )}
                  {lead.websiteUrl && (
                    <button
                      onClick={() => findEmail(lead)}
                      disabled={findingEmail === lead.id}
                      className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 disabled:opacity-50 whitespace-nowrap"
                    >
                      {findingEmail === lead.id ? '🔍 Searching...' : '🔍 Find Email'}
                    </button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {([1, 2, 3] as const).map((stage) => (
                    <button
                      key={stage}
                      onClick={() => sendOutreach(lead, stage)}
                      disabled={sending === lead.id || lead.status === 'new'}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sending === lead.id ? 'Sending...' : `Send Email #${stage}`}
                    </button>
                  ))}
                  {lead.status === 'new' && (
                    <span className="text-xs text-orange-600 self-center">Build the site first</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
