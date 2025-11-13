import { Button } from '@/components/ui/button';
import { Heart, Smile, Flame, Lightbulb } from 'lucide-react';

interface Reaction {
  type: 'like' | 'funny' | 'fire' | 'helpful';
  count: number;
  userReacted: boolean;
}

interface PostReactionsProps {
  reactions: Reaction[];
  onReact: (type: string) => void;
  disabled?: boolean;
}

const REACTION_CONFIG = {
  like: { icon: Heart, label: 'Like', color: 'text-red-500' },
  funny: { icon: Smile, label: 'Funny', color: 'text-yellow-500' },
  fire: { icon: Flame, label: 'Fire', color: 'text-orange-500' },
  helpful: { icon: Lightbulb, label: 'Helpful', color: 'text-blue-500' },
};

export function PostReactions({ reactions, onReact, disabled }: PostReactionsProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Object.entries(REACTION_CONFIG).map(([type, config]) => {
        const reaction = reactions.find(r => r.type === type);
        const Icon = config.icon;
        const count = reaction?.count || 0;
        const isActive = reaction?.userReacted || false;

        return (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => onReact(type)}
            disabled={disabled}
            className={`gap-1 transition-all ${
              isActive 
                ? `${config.color} bg-muted/50` 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'fill-current' : ''}`} />
            {count > 0 && <span className="text-xs font-medium">{count}</span>}
          </Button>
        );
      })}
    </div>
  );
}
