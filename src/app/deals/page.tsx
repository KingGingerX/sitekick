'use client';
import { useEffect, useState } from 'react';

interface Deal {
  id: string;
  leadId: string;
  stage: string;
  basePrice: number | null;
  upsells: string | null;
  totalValue: number | null;
  notes: string | null;
  closedAt: number | null;
  createdAt: number | null;
  lead: { businessName: string; address: string | null };
}

const STAGES = ['interested', 'negotiating', 'closed_won', 'closed_lost'];
const STAGE_LABELS: Record<string, string> = {
  interested: '🙋 Interested',
  negotiating: '🤝 Negotiating',
  closed_won: '✅ Won',
  closed_lost: '❌ Lost',
};
const STAGE_COLORS: Record<string, string> = {
  interested: 'border-yellow-400',
  negotiating: 'border-orange-400',
  closed_won: 'border-green-500',
  closed_lost: 'border-red-400',
};

const UPSELL_LABELS: Record<string, string> = {
  WHITE_GLOVE: 'White Glove Install (+$197)',
  MONTHLY_SUPPORT: 'Monthly Support (+$49/mo)',
  CUSTOM_FEATURE: 'Custom Feature (+$297)',
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selected, setSelected] = useState<Deal | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);

  const load = () => fetch('/api/deals').then((r) => r.json()).then(setDeals);
  useEffect(() => { load(); }, []);

  async function moveStage(deal: Deal, stage: string) {
    await fetch('/api/deals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deal.id, stage }),
    });
    await load();
  }

  async function createCheckout(deal: Deal) {
    setCheckoutLoading(deal.id);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: deal.leadId, upsells: selectedUpsells }),
    });
    const data = await res.json();
    if (data.url) {
      window.open(data.url, '_blank');
    }
    setCheckoutLoading(null);
  }

  const revenue = deals
    .filter((d) => d.stage === 'closed_won')
    .reduce((sum, d) => sum + (d.totalValue ?? 0), 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-500 text-sm mt-1">Your pipeline and revenue</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-center">
          <div className="text-2xl font-bold text-green-700">${revenue.toLocaleString()}</div>
          <div className="text-xs text-green-600">Total Revenue</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage);
          return (
            <div key={stage} className="bg-gray-100 rounded-xl p-3">
              <div className="font-semibold text-sm text-gray-700 mb-3 px-1">
                {STAGE_LABELS[stage]}
                <span className="ml-2 bg-white text-gray-500 text-xs px-1.5 py-0.5 rounded-full">
                  {stageDeals.length}
                </span>
              </div>
              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className={`bg-white border-l-4 ${STAGE_COLORS[stage]} rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md`}
                    onClick={() => setSelected(selected?.id === deal.id ? null : deal)}
                  >
                    <div className="font-medium text-sm text-gray-900">{deal.lead?.businessName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{deal.lead?.address}</div>
                    {deal.totalValue && (
                      <div className="text-sm font-semibold text-green-600 mt-1">${deal.totalValue.toLocaleString()}</div>
                    )}
                    {deal.upsells && JSON.parse(deal.upsells).length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        +{JSON.parse(deal.upsells).length} upsell(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{selected.lead?.businessName}</h2>
              <p className="text-gray-500 text-sm">{selected.lead?.address}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Move to Stage</div>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => moveStage(selected, s)}
                    disabled={selected.stage === s}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                      selected.stage === s
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {STAGE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Upsells to include in invoice</div>
              <div className="space-y-1">
                {Object.entries(UPSELL_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUpsells.includes(key)}
                      onChange={(e) =>
                        setSelectedUpsells(e.target.checked
                          ? [...selectedUpsells, key]
                          : selectedUpsells.filter((u) => u !== key)
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={() => createCheckout(selected)}
              disabled={checkoutLoading === selected.id}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {checkoutLoading === selected.id ? 'Opening Stripe...' : '💳 Send Stripe Invoice'}
            </button>
            <p className="text-xs text-gray-400 mt-2">Opens a Stripe Checkout session (base $497 + selected upsells)</p>
          </div>
        </div>
      )}
    </div>
  );
}
