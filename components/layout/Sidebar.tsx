'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  FileText,
  BarChart3,
  Brain,
  LogOut,
  Menu,
  X,
  Target,
  Folder,
  ChevronDown,
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: 'New'
  },
  {
    name: 'Live Requests',
    href: '/requests',
    icon: FileText,
    badge: '15'
  },
  {
    name: 'Offers',
    href: '/offers',
    icon: Target,
  },
  {
    name: 'Completed Requests',
    href: '/completed',
    icon: UserCheck,
  },
  {
    name: 'Manage Advertisers',
    href: '/advertisers',
    icon: Users,
  },
  {
    name: 'Manage Publishers',
    href: '/publishers',
    icon: Users,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Appearance',
    href: '/appearance',
    icon: Folder,
  },
  {
    name: 'AI Settings',
    href: '/llm',
    icon: Brain,
  },
  {
    name: 'Pub Form Settings',
    href: '/form-builder',
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <span className="sr-only">Open main menu</span>
          {isMobileOpen ? (
            <X className="block h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="block h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0",
        className
      )}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BD</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">BigDrops</h1>
                <p className="text-sm text-gray-500">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                             (item.children && item.children.some(child => pathname === child.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5',
                      isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className={cn(
                      'ml-3 inline-block py-0.5 px-2 text-xs font-medium rounded-full',
                      isActive
                        ? 'bg-indigo-200 text-indigo-800'
                        : 'bg-gray-100 text-gray-800'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 flex z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md',
                        pathname === item.href
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon className="mr-4 h-6 w-6" />
                      {item.name}
                      {item.badge && (
                        <span className="ml-3 inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-gray-100">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
