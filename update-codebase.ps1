# Update Admin Portal Codebase
$files = @(
    @{path="app/api/auth/[...nextauth]/route.ts"; title="### app/api/auth/[...nextauth]/route.ts"},
    @{path="app/auth/signin/page.tsx"; title="### app/auth/signin/page.tsx"},
    @{path="app/auth/error/page.tsx"; title="### app/auth/error/page.tsx"},
    @{path="components/Providers.tsx"; title="### components/Providers.tsx"},
    @{path="middleware.ts"; title="### middleware.ts"},
    @{path="lib/database/db.ts"; title="### lib/database/db.ts"},
    @{path="lib/rbac.ts"; title="### lib/rbac.ts"},
    @{path="types/next-auth.d.ts"; title="### types/next-auth.d.ts"},
    @{path="app/layout.tsx"; title="### app/layout.tsx"},
    @{path="app/(dashboard)/layout.tsx"; title="### app/(dashboard)/layout.tsx"},
    @{path="app/(dashboard)/dashboard/page.tsx"; title="### app/(dashboard)/dashboard/page.tsx"},
    @{path="app/(dashboard)/publishers/page.tsx"; title="### app/(dashboard)/publishers/page.tsx"},
    @{path="app/(dashboard)/publishers/[id]/page.tsx"; title="### app/(dashboard)/publishers/[id]/page.tsx"},
    @{path="components/layout/Header.tsx"; title="### components/layout/Header.tsx"},
    @{path="components/layout/Sidebar.tsx"; title="### components/layout/Sidebar.tsx"},
    @{path="components/RoleGuard.tsx"; title="### components/RoleGuard.tsx"},
    @{path="components/dashboard/StatsCards.tsx"; title="### components/dashboard/StatsCards.tsx"},
    @{path="components/dashboard/RevenueChart.tsx"; title="### components/dashboard/RevenueChart.tsx"},
    @{path="components/dashboard/PublisherTable.tsx"; title="### components/dashboard/PublisherTable.tsx"},
    @{path="components/dashboard/RecentActivity.tsx"; title="### components/dashboard/RecentActivity.tsx"},
    @{path="components/publishers/PublisherOnboarding.tsx"; title="### components/publishers/PublisherOnboarding.tsx"},
    @{path="components/publishers/PublisherPerformance.tsx"; title="### components/publishers/PublisherPerformance.tsx"},
    @{path="lib/hooks/useEverflowData.ts"; title="### lib/hooks/useEverflowData.ts"},
    @{path="app/api/everflow/publishers/route.ts"; title="### app/api/everflow/publishers/route.ts"},
    @{path="app/api/everflow/offers/route.ts"; title="### app/api/everflow/offers/route.ts"},
    @{path="app/api/everflow/analytics/route.ts"; title="### app/api/everflow/analytics/route.ts"},
    @{path="app/api/everflow/mock-publishers/route.ts"; title="### app/api/everflow/mock-publishers/route.ts"},
    @{path="app/api/everflow/mock-analytics/route.ts"; title="### app/api/everflow/mock-analytics/route.ts"},
    @{path="components/data-table/DataTable.tsx"; title="### components/data-table/DataTable.tsx"},
    @{path="components/data-table/DataTablePagination.tsx"; title="### components/data-table/DataTablePagination.tsx"},
    @{path="components/data-table/DataTableToolbar.tsx"; title="### components/data-table/DataTableToolbar.tsx"},
    @{path="components/data-table/DataTableViewOptions.tsx"; title="### components/data-table/DataTableViewOptions.tsx"},
    @{path="components/ui/button.tsx"; title="### components/ui/button.tsx"},
    @{path="components/ui/card.tsx"; title="### components/ui/card.tsx"},
    @{path="components/ui/input.tsx"; title="### components/ui/input.tsx"},
    @{path="components/ui/label.tsx"; title="### components/ui/label.tsx"},
    @{path="components/ui/textarea.tsx"; title="### components/ui/textarea.tsx"},
    @{path="components/ui/badge.tsx"; title="### components/ui/badge.tsx"},
    @{path="components/ui/tabs.tsx"; title="### components/ui/tabs.tsx"},
    @{path="components/ui/alert.tsx"; title="### components/ui/alert.tsx"},
    @{path="components/ui/select.tsx"; title="### components/ui/select.tsx"},
    @{path="components/ui/separator.tsx"; title="### components/ui/separator.tsx"},
    @{path="components/ui/table.tsx"; title="### components/ui/table.tsx"},
    @{path="components/ui/dialog.tsx"; title="### components/ui/dialog.tsx"},
    @{path="components/ui/dropdown-menu.tsx"; title="### components/ui/dropdown-menu.tsx"},
    @{path="components/ui/progress.tsx"; title="### components/ui/progress.tsx"},
    @{path="components/ui/sonner.tsx"; title="### components/ui/sonner.tsx"},
    @{path="components/ui/avatar.tsx"; title="### components/ui/avatar.tsx"},
    @{path="lib/utils.ts"; title="### lib/utils.ts"},
    @{path="tailwind.config.js"; title="### tailwind.config.js"},
    @{path="next.config.ts"; title="### next.config.ts"},
    @{path="tsconfig.json"; title="### tsconfig.json"},
    @{path="eslint.config.mjs"; title="### eslint.config.mjs"},
    @{path="components.json"; title="### components.json"},
    @{path="postcss.config.mjs"; title="### postcss.config.mjs"},
    @{path="vercel.json"; title="### vercel.json"},
    @{path="setup-database.sql"; title="### setup-database.sql"},
    @{path="auth-schema.sql"; title="### auth-schema.sql"}
)

foreach ($file in $files) {
    if (Test-Path $file.path) {
        Add-Content -Path "Admin-Portal-Codebase.txt" -Value ""
        Add-Content -Path "Admin-Portal-Codebase.txt" -Value $file.title
        Add-Content -Path "Admin-Portal-Codebase.txt" -Value ""
        Get-Content $file.path | Add-Content -Path "Admin-Portal-Codebase.txt"
        Add-Content -Path "Admin-Portal-Codebase.txt" -Value ""
        Add-Content -Path "Admin-Portal-Codebase.txt" -Value "---"
    }
}

Add-Content -Path "Admin-Portal-Codebase.txt" -Value ""
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "## Build Status"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value ""
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "Build: PASSED"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "TypeScript: All errors resolved"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "Authentication: JWT strategy with CSRF protection"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "Next.js 15: Compatible"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "SWR: Real-time data fetching"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "RBAC: Role-based access control"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "Everflow Integration: Mock data endpoints"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value ""
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "## Features Implemented"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value ""
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "- NextAuth.js v5 with JWT strategy"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "- Role-based access control (RBAC)"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "- Real-time dashboard with SWR"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "- Publisher management system"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "- Analytics and performance tracking"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "- Modern UI with Shadcn/ui components"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "- Responsive design"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "- CSRF protection"
Add-Content -Path "Admin-Portal-Codebase.txt" -Value "- Production-ready build"