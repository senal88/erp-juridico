import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  Users,
  Briefcase,
  FileText,
  CalendarDays,
  ClipboardList,
  Scale,
  ShieldCheck,
  Gavel,
  Wallet,
  Timer,
  FileSignature,
  Landmark,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const NAV_ITEMS = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'CRM / Leads', url: '/crm/leads', icon: Target },
  { title: 'Clientes', url: '/clientes', icon: Users },
  { title: 'Patrimônio', url: '/patrimonio', icon: Landmark },
  { title: 'Fornecedores', url: '/fornecedores', icon: Briefcase },
  { title: 'Contratos', url: '/contratos', icon: FileText },
  { title: 'Processos', url: '/processos', icon: Gavel },
  { title: 'Agenda', url: '/agenda', icon: CalendarDays },
  { title: 'Horas', url: '/produtividade/horas', icon: Timer },
  { title: 'Modelos', url: '/produtividade/modelos', icon: FileSignature },
  { title: 'Ordens de Serviço', url: '/ordens-de-servico', icon: ClipboardList },
  { title: 'Financeiro', url: '/financeiro', icon: Wallet },
]

export function AppSidebar() {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <aside className="w-20 h-full bg-primary border-r border-border/20 flex flex-col items-center py-6 shrink-0 z-20 relative">
      <div className="flex flex-col items-center justify-center gap-2 mb-10">
        <div className="w-12 h-12 bg-gold-gradient text-white rounded-lg flex items-center justify-center shadow-gold-glow ring-2 ring-secondary/40">
          <Scale className="w-6 h-6" />
        </div>
        <span className="text-xs font-serif font-bold text-primary-foreground tracking-widest uppercase">
          LEX
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-4 w-full px-3">
        {NAV_ITEMS.map((item) => {
          if (user?.role === 'cliente') {
            const clientAllowed = ['/', '/processos', '/financeiro', '/clientes']
            if (!clientAllowed.includes(item.url)) return null
          }

          const isActive = location.pathname === item.url
          return (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <Link
                  to={item.url}
                  className={cn(
                    'w-14 h-14 rounded-lg flex items-center justify-center mx-auto transition-all',
                    isActive
                      ? 'bg-secondary text-secondary-foreground shadow-md'
                      : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                  )}
                >
                  <item.icon className="w-6 h-6" />
                </Link>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="font-medium bg-popover text-popover-foreground border-border"
              >
                {item.title}
              </TooltipContent>
            </Tooltip>
          )
        })}

        {user?.role === 'admin' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/admin/users"
                className={cn(
                  'w-14 h-14 rounded-lg flex items-center justify-center mx-auto transition-all',
                  location.pathname === '/admin/users'
                    ? 'bg-secondary text-secondary-foreground shadow-md'
                    : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                )}
              >
                <ShieldCheck className="w-6 h-6" />
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="font-medium bg-popover text-popover-foreground border-border"
            >
              Administração
            </TooltipContent>
          </Tooltip>
        )}
      </nav>

      <div className="mt-auto px-3 w-full flex flex-col items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild></TooltipTrigger>
          <TooltipContent
            side="right"
            className="font-medium bg-popover text-popover-foreground border-border"
          >
            {user?.name || user?.email || 'Usuário'} (Sair)
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}
