'use client';
import { useEffect, useState } from 'react';

interface Message {
  id: string;
  leadId: string;
  stage: number;
  subject: string;
  body: string;
  sentAt: number | null;
  status: string;
}

interface Lead {
  id: string;
  businessName: string;
}

export default function OutreachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [leads, setLeads] = useState<Record<string, Lead>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/outreach').then((r) => r.json()),
      fetch('/api/leads').then((r) => r.json()),
    ]).then(([msgs, ls]) => {
      setMessages(msgs);
      setLeads(Object.fromEntries(ls.map((l: Lead) => [l.id, l])));
    });
  }, []);

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-700',
    opened: 'bg-yellow-100 text-yellow-700',
    replied: 'bg-green-100 text-green-700',
    bounced: 'bg-red-100 text-red-600',
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Outreach</h1>
        <p className="text-gray-500 text-sm mt-1">All emails sent or drafted to leads</p>
      </div>

      {messages.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          No outreach sent yet. Build a site for a lead, then send an email from the Leads page.
        </div>
      )}

      <div className="grid gap-3">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {leads[msg.leadId]?.businessName ?? msg.leadId}
                  <span className="ml-2 text-sm text-gray-400">· Email #{msg.stage}</span>
                </div>
                <div className="text-sm text-gray-600 mt-0.5">{msg.subject}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[msg.status] ?? 'bg-gray-100'}`}>
                  {msg.status}
                </span>
                {msg.sentAt && (
                  <span className="text-xs text-gray-400">
                    {new Date(msg.sentAt * 1000).toLocaleDateString()}
                  </span>
                )}
                <button
                  onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {expanded === msg.id ? 'Hide' : 'View'}
                </button>
              </div>
            </div>
            {expanded === msg.id && (
              <pre className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap font-sans border border-gray-200">
                {msg.body}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
