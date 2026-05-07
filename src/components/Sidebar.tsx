'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/campaigns', label: 'Campaigns', icon: '🎯' },
  { href: '/leads', label: 'Leads', icon: '🔍' },
  { href: '/outreach', label: 'Outreach', icon: '✉️' },
  { href: '/deals', label: 'Deals', icon: '💰' },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="text-xl font-bold text-blue-400">SiteKick</div>
        <div className="text-xs text-gray-400 mt-1">Website Sales Engine</div>
      </div>
      <nav className="flex-1 py-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
              path === l.href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
