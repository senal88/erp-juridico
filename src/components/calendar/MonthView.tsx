import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { getScheduleColor } from '@/lib/calendar-utils'

export function MonthView({ currentDate, schedules, onSlot, onSchedule }: any) {
  const start = startOfWeek(startOfMonth(currentDate))
  const end = endOfWeek(endOfMonth(currentDate))
  const days = eachDayOfInterval({ start, end })

  return (
    <div className="grid grid-cols-7 border-l border-t border-slate-200 dark:border-slate-800">
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
        <div
          key={d}
          className="p-2 border-r border-b border-slate-200 dark:border-slate-800 text-center font-medium text-sm text-slate-500"
        >
          {d}
        </div>
      ))}
      {days.map((day) => {
        const isCurrentMonth = isSameMonth(day, currentDate)
        const daySchedules = schedules.filter((s: any) => isSameDay(parseISO(s.starts_at), day))
        return (
          <div
            key={day.toISOString()}
            onClick={() => onSlot(day)}
            className={cn(
              'min-h-[100px] p-1 border-r border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors',
              !isCurrentMonth && 'bg-slate-50/50 dark:bg-slate-900/20 text-slate-400',
            )}
          >
            <div className="text-right text-xs p-1">{format(day, 'd')}</div>
            <div className="space-y-1 mt-1">
              {daySchedules.map((s: any) => (
                <div
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSchedule(s.id)
                  }}
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded truncate border',
                    getScheduleColor(s.status),
                  )}
                >
                  {format(parseISO(s.starts_at), 'HH:mm')} {s.expand?.service_order_id?.title}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
