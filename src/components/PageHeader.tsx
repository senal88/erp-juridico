import { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  icon?: any
}

export function PageHeader({
  title,
  description,
  action,
  actions,
  children,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      {(action || actions || children) && (
        <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
          {action}
          {actions}
          {children}
        </div>
      )}
    </div>
  )
}
