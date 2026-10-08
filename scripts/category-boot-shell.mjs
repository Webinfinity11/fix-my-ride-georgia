// Inject only build-captured public category headings, not cached listings.
export function injectCategoryBootShells(html, header, categories) {
  if (!header || !Object.keys(categories).length) return html;
  html = html.replace(/<script id="category-boot-shell">[\s\S]*?<\/script>/g, '');
  const payload = JSON.stringify({ header, categories }).replace(/</g, '\\u003c');
  const script = `<script id="category-boot-shell">(function(){
    var path=location.pathname.replace(/\\/$/,'');
    var data=${payload};
    if(!Object.prototype.hasOwnProperty.call(data.categories,path))return;
    if(document.documentElement.getAttribute('data-ssg')===path)return;
    var root=document.getElementById('root');
    if(!root)return;
    var skeleton='<div class="container mx-auto px-4 py-6" role="status" aria-label="სერვისები იტვირთება"><div class="h-24 bg-muted rounded mb-6"></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"><div class="h-64 bg-muted rounded"></div><div class="h-64 bg-muted rounded"></div><div class="h-64 bg-muted rounded"></div><div class="h-64 bg-muted rounded"></div></div></div>';
    var markup=data.header+'<main>'+data.categories[path]+skeleton+'</main>';
    window.__fixupCategoryBoot={path:path,html:markup};
    root.innerHTML=markup;
    var guard=document.getElementById('__ssg_guard__');
    if(guard)guard.remove();
  })();</script>`;
  return html.replace('</body>', script + '</body>');
}
