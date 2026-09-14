import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  setHours,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getScheduleColor } from '@/lib/calendar-utils'

export function WeekView({ currentDate, schedules, onSlot, onSchedule }: any) {
  const start = startOfWeek(currentDate)
  const end = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start, end })
  const hours = Array.from({ length: 15 }).map((_, i) => i + 6) // 06:00 to 20:00

  return (
    <div className="flex overflow-x-auto">
      <div className="flex flex-col border-r border-slate-200 dark:border-slate-800 min-w-[60px]">
        <div className="h-10 border-b border-slate-200 dark:border-slate-800"></div>
        {hours.map((h) => (
          <div
            key={h}
            className="h-20 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 text-right pr-2 pt-1"
          >
            {h}:00
          </div>
        ))}
      </div>
      {days.map((day) => {
        const daySchedules = schedules.filter((s: any) => isSameDay(parseISO(s.starts_at), day))
        return (
          <div
            key={day.toISOString()}
            className="flex-1 min-w-[120px] border-r border-slate-200 dark:border-slate-800"
          >
            <div className="h-10 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
              <span className="text-xs text-slate-500 uppercase">
                {format(day, 'eee', { locale: ptBR })}
              </span>
              <span className="text-sm font-medium">{format(day, 'dd/MM')}</span>
            </div>
            <div className="relative">
              {hours.map((h) => (
                <div
                  key={h}
                  onClick={() => onSlot(setHours(day, h))}
                  className="h-20 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                />
              ))}
              {daySchedules.map((s: any) => {
                const date = parseISO(s.starts_at)
                const top = (date.getHours() - 6) * 80 + (date.getMinutes() / 60) * 80
                const height = s.ends_at
                  ? Math.max(((parseISO(s.ends_at).getTime() - date.getTime()) / 3600000) * 80, 20)
                  : 80
                return (
                  <div
                    key={s.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSchedule(s.id)
                    }}
                    className={cn(
                      'absolute left-1 right-1 rounded border p-1 text-[10px] overflow-hidden shadow-sm cursor-pointer hover:brightness-95',
                      getScheduleColor(s.status),
                    )}
                    style={{ top: `${Math.max(0, top)}px`, height: `${Math.max(20, height)}px` }}
                  >
                    <div className="font-semibold">{format(date, 'HH:mm')}</div>
                    <div className="truncate">{s.expand?.service_order_id?.title}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
