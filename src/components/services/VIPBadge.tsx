import { Badge } from '@/components/ui/badge';
import { Crown, Zap } from 'lucide-react';
import { VIPPlanType } from '@/hooks/useVIPRequests';

interface VIPBadgeProps {
  vipStatus: VIPPlanType | null;
  size?: 'sm' | 'md' | 'lg';
}

export function VIPBadge({ vipStatus, size = 'md' }: VIPBadgeProps) {
  if (!vipStatus) return null;
  
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-2.5',
    lg: 'text-base py-1.5 px-3',
  };
  
  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  };
  
  if (vipStatus === 'super_vip') {
    return (
      <Badge 
        className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 ${sizeClasses[size]} flex items-center gap-1`}
      >
        <Zap size={iconSize[size]} />
        Super VIP
      </Badge>
    );
  }
  
  return (
    <Badge 
      className={`bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 ${sizeClasses[size]} flex items-center gap-1`}
    >
      <Crown size={iconSize[size]} />
      VIP
    </Badge>
  );
}
