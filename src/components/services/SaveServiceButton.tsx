import React from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useSavedServices } from '@/hooks/useSavedServices';
import { cn } from '@/lib/utils';

interface SaveServiceButtonProps {
  serviceId: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

export const SaveServiceButton = ({
  serviceId,
  variant = 'outline',
  size = 'default',
  showText = true,
  className,
}: SaveServiceButtonProps) => {
  const { isSaved, toggleSave, loading } = useSavedServices();
  const saved = isSaved(serviceId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleSave(serviceId);
  };

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Bookmark className="h-4 w-4" />
        {showText && size !== 'icon' && <span className="ml-2">შენახვა</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        saved && 'bg-primary/10 text-primary hover:bg-primary/20',
        className
      )}
    >
      {saved ? (
        <>
          <BookmarkCheck className="h-4 w-4" />
          {showText && size !== 'icon' && <span className="ml-2">შენახულია</span>}
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" />
          {showText && size !== 'icon' && <span className="ml-2">შენახვა</span>}
        </>
      )}
    </Button>
  );
};
