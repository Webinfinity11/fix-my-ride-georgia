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
  className
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 z-40 rounded-full shadow-lg h-14 px-6",
        className
      )}
      aria-label={label}
    >
      <Icon className="w-5 h-5 mr-2" />
      <span className="font-medium">{label}</span>
    </Button>
  );
}