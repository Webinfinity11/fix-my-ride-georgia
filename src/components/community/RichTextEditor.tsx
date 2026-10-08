import { lazy, Suspense } from 'react';
import type { RichTextEditorProps } from './RichTextEditorContent';

const Editor = lazy(() => import('./RichTextEditorContent').then(module => ({ default: module.RichTextEditor })));

// Dialog content mounts on opening, so readers do not download the editing engine.
export function RichTextEditor(props: RichTextEditorProps) {
  return (
    <Suspense fallback={<div role="status" className="min-h-[200px] p-4 text-muted-foreground">რედაქტორი იტვირთება...</div>}>
      <Editor {...props} />
    </Suspense>
  );
}
