'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/working-rate', label: 'Dashboard', icon: 'chart' },
  { href: '/working-rate/directors', label: 'Directors', icon: 'users' },
  { href: '/working-rate/partners', label: 'Partners', icon: 'handshake' },
];

const icons: Record<string, React.ReactNode> = {
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  handshake: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-brand-navy min-h-screen fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/working-rate" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center font-sans font-bold text-white text-xl">
              H
            </div>
            <div>
              <div className="text-white font-sans font-bold text-sm">Harbinger</div>
              <div className="text-white/60 font-serif text-xs">Working Rates</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/working-rate'
                ? pathname === '/working-rate'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-sans font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white border-l-3 border-brand-red'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {icons[item.icon]}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to Sales Pipeline */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-sans transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Sales Pipeline
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-navy z-30 flex justify-around py-2 px-4 border-t border-white/10">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/working-rate'
              ? pathname === '/working-rate'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-sans ${
                isActive ? 'text-brand-red' : 'text-white/60'
              }`}
            >
              {icons[item.icon]}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
