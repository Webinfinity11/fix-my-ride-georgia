import * as React from "react"
import { Drawer } from "vaul"
import { cn } from "@/lib/utils"

interface BottomSheetProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
}

export function BottomSheet({
  children,
  trigger,
  open,
  onOpenChange,
  title,
  description,
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[9998]" />
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-[9999]",
            "flex flex-col bg-background rounded-t-3xl",
            "max-h-[85vh] focus:outline-none"
          )}
        >
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted my-4" />
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {(title || description) && (
              <div className="mb-4">
                {title && (
                  <Drawer.Title className="text-lg font-semibold mb-1">
                    {title}
                  </Drawer.Title>
                )}
                {description && (
                  <Drawer.Description className="text-sm text-muted-foreground">
                    {description}
                  </Drawer.Description>
                )}
              </div>
            )}
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
