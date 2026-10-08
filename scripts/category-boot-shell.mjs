// Fallback documents carry headings only. Matching route documents preserve
// the public snapshot already present in their root until fresh data arrives.
export function injectCategoryInitialData(html, data) {
  html = html.replace(/<script\b[^>]*\bid="category-initial-data"[^>]*>[\s\S]*?<\/script>/g, '');
  const payload = JSON.stringify(data).replace(/</g, '\\u003c');
  return html.replace('</body>', `<script type="application/json" id="category-initial-data">${payload}</script></body>`);
}

export function injectCategoryBootShells(html, header, categories) {
  if (!header || !Object.keys(categories).length) return html;
  html = html.replace(/<script id="category-boot-shell">[\s\S]*?<\/script>/g, '');
  const payload = JSON.stringify({ header, categories }).replace(/</g, '\\u003c');
  const script = `<script id="category-boot-shell">(function(){
    var path=location.pathname.replace(/\\/$/,'');
    var data=${payload};
    if(!Object.prototype.hasOwnProperty.call(data.categories,path))return;
    var root=document.getElementById('root');
    if(!root)return;
    var skeleton='<div class="container mx-auto px-4 py-6" role="status" aria-label="სერვისები იტვირთება"><div class="h-24 bg-muted rounded mb-6"></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"><div class="h-64 bg-muted rounded"></div><div class="h-64 bg-muted rounded"></div><div class="h-64 bg-muted rounded"></div><div class="h-64 bg-muted rounded"></div></div></div>';
    var markup=data.header+'<main>'+data.categories[path]+skeleton+'</main>';
    var matching=document.documentElement.getAttribute('data-ssg')===path;
    window.__fixupCategoryBoot={path:path,html:matching?root.innerHTML:markup,fallbackHtml:markup,snapshot:matching};
    if(matching)return;
    root.innerHTML=markup;
    var guard=document.getElementById('__ssg_guard__');
    if(guard)guard.remove();
  })();</script>`;
  return html.replace('</body>', script + '</body>');
}
