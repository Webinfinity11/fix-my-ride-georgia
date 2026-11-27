import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * "Are you sure?" inside the page. window.confirm is silently answered "no" by
 * some embedded browsers, which leaves a button looking dead.
 */
export function useConfirm() {
  const [pending, setPending] = useState<{ question: string; answer: (yes: boolean) => void } | null>(null);
  const confirm = (question: string) => new Promise<boolean>((answer) => setPending({ question, answer }));
  const close = (yes: boolean) => {
    pending?.answer(yes);
    setPending(null);
  };
  const dialog = (
    <AlertDialog open={!!pending} onOpenChange={(open) => !open && close(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>დაადასტურეთ</AlertDialogTitle>
          <AlertDialogDescription>{pending?.question}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>გაუქმება</AlertDialogCancel>
          <AlertDialogAction onClick={() => close(true)}>დიახ</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { confirm, dialog };
}
