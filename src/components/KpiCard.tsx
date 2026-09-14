import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingDown, TrendingUp, Minus } from 'lucide-react'

export interface KpiCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  trend?: {
    direction: 'up' | 'down' | 'flat'
    value: string
  }
  className?: string
}

export function KpiCard({ label, value, hint, icon: Icon, trend, className }: KpiCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-label-caps text-muted-foreground">{label}</CardTitle>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
            <Icon className="h-4 w-4 text-secondary" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {(hint || trend) && (
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {trend && (
              <span
                className={cn('flex items-center gap-1 font-medium', {
                  'text-emerald-600 dark:text-emerald-400': trend.direction === 'up',
                  'text-rose-600 dark:text-rose-400': trend.direction === 'down',
                  'text-slate-600 dark:text-slate-400': trend.direction === 'flat',
                })}
              >
                {trend.direction === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
                {trend.direction === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
                {trend.direction === 'flat' && <Minus className="h-3.5 w-3.5" />}
                {trend.value}
              </span>
            )}
            {hint && <span>{hint}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
