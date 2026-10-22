import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<React.ComponentPropsWithoutRef<typeof Input>, 'type'>;
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative">
        <Input {...props} ref={ref} disabled={disabled} type={visible ? 'text' : 'password'} className={cn(className, 'pr-12')} />
        <button type="button" disabled={disabled} onClick={() => setVisible(value => !value)}
          aria-label={visible ? 'პაროლის დამალვა' : 'პაროლის ჩვენება'} aria-pressed={visible} aria-controls={props.id}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
