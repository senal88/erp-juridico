import { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  children?: ReactNode
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {(action || children) && (
        <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
          {action}
          {children}
        </div>
      )}
    </div>
  )
}
