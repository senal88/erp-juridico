import { Search, Plus, Menu, LogOut, Sun, Moon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { NotificationsBell } from './NotificationsBell'
import { useTheme } from '@/components/theme-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { AppSidebar } from './AppSidebar'

export function TopBar({ onOpenOSModal }: { onOpenOSModal: () => void }) {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const avatarUrl = user?.avatar
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${user?.collectionId}/${user?.id}/${user?.avatar}`
    : undefined

  return (
    <header className="h-16 shrink-0 bg-card border-b border-border/40 px-4 md:px-6 flex items-center justify-between z-10 w-full shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-20 min-w-[80px] max-w-[80px] flex bg-primary border-none"
          >
            <div className="sr-only">
              <SheetTitle>Menu de Navegação</SheetTitle>
              <SheetDescription>Acesse os módulos do sistema</SheetDescription>
            </div>
            <AppSidebar />
          </SheetContent>
        </Sheet>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar em todo o sistema..."
            className="pl-10 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary transition-colors h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <NotificationsBell />

        <Button
          onClick={onOpenOSModal}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 h-9 px-3 sm:px-4"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Nova OS</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full ml-1 sm:ml-2"
            >
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-border">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() ||
                    user?.email?.charAt(0)?.toUpperCase() ||
                    'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer font-medium">
              {isDark ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Modo claro</span>
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Modo escuro</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-medium"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
