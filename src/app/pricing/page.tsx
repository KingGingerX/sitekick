'use client';
import Link from 'next/link';

const tiers = [
  {
    name: 'Starter Site',
    price: '$497',
    desc: 'One-time payment. Perfect for small businesses that need a professional presence fast.',
    features: [
      'Custom 5-page website',
      'Mobile-responsive design',
      'Basic SEO setup',
      'Google Maps integration',
      '48-hour delivery',
      '30 days of email support',
    ],
    cta: 'Get Started',
    href: '/login',
    highlight: false,
  },
  {
    name: 'Growth Bundle',
    price: '$694',
    desc: 'Everything in Starter plus white-glove setup and priority support.',
    features: [
      'Everything in Starter',
      'White-glove install & DNS setup',
      'Speed optimization',
      'Schema markup for local SEO',
      'Priority email support',
      '1 round of revisions',
    ],
    cta: 'Most Popular',
    href: '/login',
    highlight: true,
  },
  {
    name: 'Monthly Retainer',
    price: '$49/mo',
    desc: 'Ongoing maintenance, updates, and support for busy business owners.',
    features: [
      'Unlimited content updates',
      'Monthly performance report',
      'Security monitoring',
      'Backup & uptime monitoring',
      'Priority support queue',
      'Annual strategy review',
    ],
    cta: 'Subscribe',
    href: '/login',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            No hidden fees. No long-term contracts unless you want them. Just elite websites that convert.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border ${
                t.highlight
                  ? 'border-blue-500 bg-slate-800/60 shadow-2xl shadow-blue-900/20'
                  : 'border-gray-700 bg-slate-800/40'
              } p-8 flex flex-col`}
            >
              {t.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                  Best Value
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{t.name}</h3>
              <div className="text-3xl font-black mb-3">{t.price}</div>
              <p className="text-gray-400 text-sm mb-6">{t.desc}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="text-blue-400 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={t.href}
                className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
                  t.highlight
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-500 text-sm">
            Need a custom enterprise package?{' '}
            <a href="mailto:hello@sitekick.io" className="text-blue-400 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
