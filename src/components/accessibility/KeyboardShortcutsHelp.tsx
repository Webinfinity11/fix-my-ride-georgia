import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const shortcuts = [
  { key: 'Tab', description: 'ნავიგაცია ელემენტებს შორის' },
  { key: 'Enter', description: 'ელემენტის გააქტიურება' },
  { key: 'Escape', description: 'დიალოგის დახურვა' },
  { key: 'Space', description: 'ღილაკის დაჭერა' },
  { key: '↑ ↓', description: 'გადაადგილება სიაში' },
  { key: '/', description: 'ძიების გააქტიურება' },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open shortcuts dialog with Shift + ?
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 md:bottom-8 left-4 z-[9996] bg-muted hover:bg-accent text-muted-foreground rounded-full p-3 shadow-lg transition-all hover:scale-110"
        aria-label="კლავიატურის მალსახმობები"
        title="კლავიატურის მალსახმობები (Shift + ?)"
      >
        <Keyboard className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>კლავიატურის მალსახმობები</DialogTitle>
            <DialogDescription>
              გამოიყენეთ ეს კლავიშები სწრაფი ნავიგაციისთვის
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm text-muted-foreground">
                  {shortcut.description}
                </span>
                <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded-lg border border-border">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              დააჭირეთ <kbd className="px-2 py-1 bg-background rounded border">Shift + ?</kbd> ამ მენიუს გასახსნელად
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
