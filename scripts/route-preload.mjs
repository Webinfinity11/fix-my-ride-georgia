// Discover category code from the build graph, so filenames follow Vite hashes.
export function categoryPreloadPlugin() {
  return {
    name: 'category-module-preload',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = bundle['index.html'];
      if (html?.type !== 'asset' || typeof html.source !== 'string') return;
      const category = Object.values(bundle).find(file => file.type === 'chunk'
        && file.facadeModuleId?.replaceAll('\\', '/').endsWith('/src/pages/ServiceCategory.tsx'));
      if (!category) return;
      const seen = new Set();
      const visit = (fileName, collected = seen) => {
        if (collected.has(fileName)) return;
        collected.add(fileName);
        const chunk = bundle[fileName];
        if (chunk?.type === 'chunk') chunk.imports.forEach(name => visit(name, collected));
      };
      const initial = new Set();
      Object.values(bundle).filter(file => file.type === 'chunk' && file.isEntry)
        .forEach(file => visit(file.fileName, initial));
      visit(category.fileName);
      const files = [...seen].filter(file => file.endsWith('.js') && !initial.has(file)
        && !html.source.includes(`href="/${file}"`));
      // Only preload on category routes. Homepage visits keep their lazy graph.
      const code = `(function(){if(!location.pathname.startsWith('/category/'))return;${JSON.stringify(files)}.forEach(function(file){var href='/'+file;if(document.querySelector('link[rel="modulepreload"][href="'+href+'"]'))return;var link=document.createElement('link');link.rel='modulepreload';link.crossOrigin='';link.href=href;document.head.appendChild(link);});})();`;
      html.source = html.source.replace('</head>', `<script data-category-preload>${code}</script></head>`);
    },
  };
}
