import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Scale, Menu, LogOut } from 'lucide-react'

import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function PortalLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const links = [
    { name: 'Início', href: '/portal' },
    { name: 'Meus processos', href: '/portal/processos' },
    { name: 'Faturas', href: '/portal/faturas' },
    { name: 'Meu Patrimônio', href: '/portal/patrimonio' },
  ]

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-white h-16 flex items-center justify-between px-4 md:px-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-secondary w-8 h-8 rounded-lg flex items-center justify-center">
              <Scale className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none tracking-tight">Lex</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none mt-0.5">
                Portal do Cliente
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive =
                location.pathname === link.href ||
                (link.href !== '/portal' && location.pathname.startsWith(link.href))

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-slate-100',
                  )}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage
                    src={user?.avatar ? pb.files.getUrl(user, user.avatar) : ''}
                    alt={user?.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'Cliente'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Nav Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
              <SheetHeader className="text-left mb-6 mt-4">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2">
                {links.map((link) => {
                  const isActive =
                    location.pathname === link.href ||
                    (link.href !== '/portal' && location.pathname.startsWith(link.href))

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        'px-4 py-3 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-slate-100',
                      )}
                    >
                      {link.name}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6">
        <Outlet />
      </main>

      <footer className="border-t bg-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center text-sm text-slate-500">
          Portal do Cliente — Acesso seguro às informações dos seus processos
        </div>
      </footer>
    </div>
  )
}
