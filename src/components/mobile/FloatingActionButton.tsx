import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  className,
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-24 md:bottom-8 right-4 z-[9996]",
        "w-14 h-14 rounded-full shadow-lg",
        "flex items-center justify-center",
        "transition-all duration-200 hover:scale-110",
        className
      )}
      size="icon"
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
    </Button>
  );
}
