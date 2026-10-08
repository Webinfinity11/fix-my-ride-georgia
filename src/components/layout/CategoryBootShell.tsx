declare global {
  interface Window {
    __fixupServiceBoot?: { path: string; html: string };
    __fixupCategoryBoot?: { path: string; html: string; fallbackHtml?: string; snapshot?: boolean };
  }
}

// Build-generated public markup only. Preserve the matching snapshot while
// the route module and fresh public listings arrive.
export function CategoryBootShell() {
  const path = window.location.pathname.replace(/\/$/, "");
  const boot = window.__fixupServiceBoot?.path === path ? window.__fixupServiceBoot : window.__fixupCategoryBoot;
  if (boot?.path === window.location.pathname.replace(/\/$/, "")) {
    return <div dangerouslySetInnerHTML={{ __html: boot.html }} />;
  }
  return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-label="იტვირთება">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}
