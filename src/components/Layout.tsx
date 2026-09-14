import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { AppSidebar } from './AppSidebar'
import { TopBar } from './TopBar'
import { OSModal } from './OSModal'

export default function Layout() {
  const [isOSModalOpen, setIsOSModalOpen] = useState(false)

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0 h-full shadow-xl z-20">
        <AppSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <TopBar onOpenOSModal={() => setIsOSModalOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 relative">
          <Outlet />
        </main>
      </div>

      <OSModal open={isOSModalOpen} onOpenChange={setIsOSModalOpen} />
    </div>
  )
}
