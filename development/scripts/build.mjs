// Deterministic single-HTML build for this project's small, named-export modules.
// No npm dependencies. Unsupported syntax fails instead of silently producing a broken page.
import {readFileSync,writeFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import path from 'node:path';import assert from 'node:assert/strict';
const source=fileURLToPath(new URL('..',import.meta.url)),root=path.dirname(source);const read=p=>readFileSync(path.join(source,p),'utf8');
const escapeScript=s=>s.replace(/<\/script/gi,'<\\/script');
const inline=(text,filename)=>`<script data-source="${filename}">\n${escapeScript(text)}\n</script>`;
let html=read('index.template.html');
for(const filename of ['styles.css','theme-crypto.css','auth.css','design-crypto.css']){
 let css=read(filename);
 css=css.replace("url('./assets/Audiowide-Regular.ttf')",`url('data:font/ttf;base64,${readFileSync(path.join(source,'assets/Audiowide-Regular.ttf')).toString('base64')}')`);
 css=css.replace("url('./select-chevron.svg')",`url('data:image/svg+xml,${encodeURIComponent(read('select-chevron.svg'))}')`);
 html=html.replace(new RegExp('<link[^>]+href="'+filename.replace('.','\\.')+'\\?v=\\d+"[^>]*>'),`<style data-source="${filename}">\n${css}\n</style>`);
}
// Crypto colors are now the default; there is no separate theme stylesheet to toggle.
html=html.replace(/<script>if\(new URLSearchParams\(location.search\)[\s\S]*?<\/script>/,'');
for(const name of ['startup.js','config.js'])html=html.replace(new RegExp('<script src="'+name.replace('.','\\.')+'\\?v=\\d+"><\\/script>'),inline(read(name),name));
html=html.replace(/href="icon\.svg\?v=\d+"/,`href="data:image/svg+xml,${encodeURIComponent(read('icon.svg'))}"`);
const modules=new Map();let bundle='';
for(const [i,name] of ['modal-scroll.js','auth-ui.js','appstore.js','core.js','heading-taps.js'].entries()){
 const code=read(name),exports=[...code.matchAll(/\bexport (?:async )?(?:function\*?|const|let|class)\s+(\w+)/g)].map(m=>m[1]);
 assert(exports.length,'No exports: '+name);const plain=code.replace(/\bexport (?=(?:async )?(?:function|const|let|class))/g,'');assert(!/\bexport\s/.test(plain),'Unsupported export: '+name);
 const id='__module'+i;modules.set(name,id);bundle+=`const ${id}=(()=>{\n${plain}\nreturn {${exports.join(',')}};\n})();\n`;
}
let app=read('app.js');app=app.replace(/^import \{([^}]+)\} from '\.\/([^'?]+)(?:\?[^']*)?';\n/gm,(_,names,file)=>{assert(modules.has(file),'Unsupported module '+file);return `const {${names}}=${modules.get(file)};\n`;});assert(!/^import\s/m.test(app),'Unsupported import syntax');
bundle+=app;
html=html.replace(/<script type="module" src="app\.js\?v=\d+"[^>]*><\/script>/,inline(read('vendor/supabase.js'),'vendor/supabase.js')+inline(`(async()=>{\n${bundle}\n})().catch(error=>{console.error(error);window.showTrackerStartupError(error?.message||'主程式載入失敗');});`,'application'));
assert(!/<script[^>]+src=/.test(html),'Unexpected external script');assert(!/<link[^>]+stylesheet/.test(html),'Unexpected external stylesheet');
assert(!html.includes("s.src='./vendor/supabase.js'"),'SDK must be embedded');
assert(html.includes('data-source="application"'),'Missing application');
writeFileSync(path.join(root,'index.html'),html);
console.log(`Built single index.html: ${Buffer.byteLength(html)} bytes; styles, font, icons, modules and SDK embedded.`);
