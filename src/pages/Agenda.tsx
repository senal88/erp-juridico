import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getSchedules } from '@/services/os_schedules'
import { getUsers } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'
import { OsScheduleModal } from '@/components/OsScheduleModal'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'

export default function Agenda() {
  const [searchParams] = useSearchParams()
  const initialView = (searchParams.get('view') as any) || 'month'

  const [view, setView] = useState<'month' | 'week' | 'day'>(initialView)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [techId, setTechId] = useState<string>('all')
  const [users, setUsers] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<string | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const loadData = async () => {
    let start, end
    if (view === 'month') {
      start = startOfWeek(startOfMonth(currentDate))
      end = endOfWeek(endOfMonth(currentDate))
    } else if (view === 'week') {
      start = startOfWeek(currentDate)
      end = endOfWeek(currentDate)
    } else {
      start = startOfDay(currentDate)
      end = addDays(start, 1)
    }

    let filter = `starts_at >= '${start.toISOString()}' && starts_at <= '${end.toISOString()}'`
    if (techId !== 'all') filter += ` && assigned_to = '${techId}'`

    const [scheds, usrs] = await Promise.all([getSchedules(filter), getUsers()])
    setSchedules(scheds)
    setUsers(usrs)
  }

  useEffect(() => {
    loadData()
  }, [currentDate, view, techId])
  useRealtime('os_schedules', loadData)

  const handlePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }
  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const handleOpenSlot = (date: Date) => {
    setSelectedDate(date)
    setSelectedSchedule(undefined)
    setModalOpen(true)
  }
  const handleOpenSchedule = (id: string) => {
    setSelectedSchedule(id)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <PageHeader
        title="Agenda"
        subtitle="Execuções de Ordens de Serviço"
        actions={
          <Button onClick={() => handleOpenSlot(new Date())}>
            <Plus className="mr-2 h-4 w-4" /> Novo agendamento
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-48 text-center font-medium">
            {view === 'day'
              ? format(currentDate, "d 'de' MMMM, yyyy", { locale: ptBR })
              : view === 'week'
                ? `Semana de ${format(startOfWeek(currentDate), 'dd/MM')}`
                : format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </div>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={techId} onValueChange={setTechId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Técnico..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os técnicos</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={view} onValueChange={(v: any) => setView(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="day">Dia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            schedules={schedules}
            onSlot={handleOpenSlot}
            onSchedule={handleOpenSchedule}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            schedules={schedules}
            onSlot={handleOpenSlot}
            onSchedule={handleOpenSchedule}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            schedules={schedules}
            onSlot={handleOpenSlot}
            onSchedule={handleOpenSchedule}
          />
        )}
      </div>

      <OsScheduleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        scheduleId={selectedSchedule}
        defaultDate={selectedDate}
        onSuccess={loadData}
      />
    </div>
  )
}
