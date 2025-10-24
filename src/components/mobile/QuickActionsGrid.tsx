import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: LucideIcon;
  label: string;
  href: string;
  color?: string;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActionsGrid({ actions, className }: QuickActionsGridProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Link
            key={index}
            to={action.href}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border hover:bg-accent transition-colors"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                action.color || "bg-primary/10"
              )}
            >
              <Icon className={cn("w-6 h-6", action.color ? "text-foreground" : "text-primary")} />
            </div>
            <span className="text-xs text-center font-medium leading-tight">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
