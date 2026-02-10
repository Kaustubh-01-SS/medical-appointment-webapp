import UserAvatar from '@/components/UserAvatar'

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 text-white">
      
      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 text-xl font-bold">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            ✓
          </div>
          MediBook
        </div>

        {/* Right side avatar */}
        <UserAvatar />
      </nav>

      {/* Page Content */}
      <main className="px-8 py-10 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
