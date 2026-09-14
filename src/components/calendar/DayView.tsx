import { format, parseISO, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getScheduleColor } from '@/lib/calendar-utils'

export function DayView({ currentDate, schedules, onSlot, onSchedule }: any) {
  const hours = Array.from({ length: 15 }).map((_, i) => i + 6) // 06:00 to 20:00
  const daySchedules = schedules.filter(
    (s: any) => format(parseISO(s.starts_at), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'),
  )

  return (
    <div className="flex flex-col">
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
        <span className="text-sm font-medium">
          {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </span>
      </div>
      <div className="flex relative">
        <div className="flex flex-col border-r border-slate-200 dark:border-slate-800 w-16 shrink-0">
          {hours.map((h) => (
            <div
              key={h}
              className="h-24 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 text-right pr-2 pt-1"
            >
              {h}:00
            </div>
          ))}
        </div>
        <div className="flex-1 relative min-h-[1200px]">
          {hours.map((h) => (
            <div key={h} className="h-24 border-b border-slate-200 dark:border-slate-800 relative">
              <div
                onClick={() => onSlot(setHours(currentDate, h))}
                className="absolute top-0 w-full h-1/2 border-b border-dashed border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
              />
              <div
                onClick={() => onSlot(setMinutes(setHours(currentDate, h), 30))}
                className="absolute bottom-0 w-full h-1/2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
              />
            </div>
          ))}
          {daySchedules.map((s: any) => {
            const date = parseISO(s.starts_at)
            const top = (date.getHours() - 6) * 96 + (date.getMinutes() / 60) * 96
            const height = s.ends_at
              ? Math.max(((parseISO(s.ends_at).getTime() - date.getTime()) / 3600000) * 96, 24)
              : 96
            return (
              <div
                key={s.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onSchedule(s.id)
                }}
                className={cn(
                  'absolute left-2 right-4 rounded-md border p-2 text-xs shadow-sm cursor-pointer hover:brightness-95 flex flex-col',
                  getScheduleColor(s.status),
                )}
                style={{ top: `${Math.max(0, top)}px`, height: `${Math.max(24, height)}px` }}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>
                    {format(date, 'HH:mm')} -{' '}
                    {s.ends_at ? format(parseISO(s.ends_at), 'HH:mm') : ''}
                  </span>
                  <span className="uppercase text-[10px] opacity-80">{s.status}</span>
                </div>
                <div className="font-medium mt-1">{s.expand?.service_order_id?.title}</div>
                <div className="opacity-80 truncate">
                  {s.expand?.service_order_id?.expand?.client_id?.name}
                </div>
                {s.expand?.assigned_to && (
                  <div className="mt-auto opacity-70 text-[10px]">
                    Téc: {s.expand.assigned_to.name || s.expand.assigned_to.email}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
