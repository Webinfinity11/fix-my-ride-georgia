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
  return;
}