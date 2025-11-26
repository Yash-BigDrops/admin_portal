'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const menuItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Live Requests', href: '/live-requests' },
  { label: 'Completed Requests', href: '/completed-requests' },
  { label: 'Offers', href: '/offers' },
  { label: 'Manage Advertisers', href: '/advertisers' },
  { label: 'Manage Publishers', href: '/publishers' },
  { label: 'Publisher Applications', href: '/publishers/applications' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Appearance', href: '/appearance/publisher-form' },
  { label: 'AI Settings', href: '/ai-settings', icon: '⚡' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Image
            src="/Logo.svg"
            alt="Big Drops Marketing Group"
            width={200}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

