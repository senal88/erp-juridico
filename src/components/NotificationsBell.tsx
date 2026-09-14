import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Check,
  Briefcase,
  ArrowRightCircle,
  Clock,
  Calendar,
  CalendarX,
  AlertTriangle,
  AlertOctagon,
  FileEdit,
  BellRing,
  Info,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getNotifications, markAsRead, markAllAsRead } from '@/services/notifications'

const ICONS: Record<string, any> = {
  os_assigned: { icon: Briefcase, color: 'text-blue-500' },
  os_status_changed: { icon: ArrowRightCircle, color: 'text-violet-500' },
  schedule_today: { icon: Clock, color: 'text-amber-500' },
  schedule_confirm: { icon: Calendar, color: 'text-emerald-500' },
  no_show: { icon: CalendarX, color: 'text-rose-500' },
  contract_expiring: { icon: AlertTriangle, color: 'text-amber-500' },
  contract_expired: { icon: AlertOctagon, color: 'text-rose-500' },
  amendment_created: { icon: FileEdit, color: 'text-slate-500' },
  system: { icon: Info, color: 'text-primary' },
}

export function NotificationsBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const loadData = async () => {
    if (!user) return
    try {
      const res = await getNotifications()
      setNotifications(res.items)
      setUnreadCount(res.items.filter((n: any) => !n.read_at).length)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime(
    'notifications',
    () => {
      loadData()
    },
    !!user,
  )

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await markAllAsRead()
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read_at) {
      try {
        await markAsRead(notif.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n)),
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch (err) {
        console.error(err)
      }
    }
    setIsOpen(false)
    if (notif.link) {
      navigate(notif.link)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground h-9 w-9"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <p className="font-semibold">Notificações</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              <Check className="mr-1 h-3 w-3" />
              Marcar lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-4">
              <BellRing className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Sem notificações</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => {
                const conf = ICONS[notif.kind] || ICONS.system
                const Icon = conf.icon
                const isRead = !!notif.read_at

                return (
                  <DropdownMenuItem
                    key={notif.id}
                    className={`flex items-start gap-3 p-4 cursor-pointer focus:bg-muted/50 rounded-none border-b last:border-b-0 ${
                      !isRead ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${conf.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium leading-none truncate ${
                            !isRead ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!isRead && <div className="h-2 w-2 bg-primary rounded-full shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notif.created), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
