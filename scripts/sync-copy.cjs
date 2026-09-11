// Regenerate English HTML fallbacks and the bilingual review from the running dictionary.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const {dict,base} = require('./read-dictionary.cjs')();
const pages = fs.readdirSync(root).filter(n=>n.endsWith('.html') && n!=='admin.html').concat(fs.readdirSync(path.join(root,'products')).filter(n=>n.endsWith('.html')).map(n=>'products/'+n));
const files = [...pages, 'assets/partials.js', 'assets/form.js'];
const usage = new Map(Object.keys(dict.en).map(k=>[k,new Set()]));
const escapeAttr = s=>s.replaceAll('&','&amp;').replaceAll('\"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const escape = s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for (const file of files) {
 const p=path.join(root,file);let source=fs.readFileSync(p,'utf8');
 for (const m of source.matchAll(/data-i18n(?:-html)?="([^"]+)"|data-i18n-attr="[^:"]+:([^"]+)"/g)) {
   const key=m[1]||m[2]; if(!usage.has(key)) throw new Error('Missing translation: '+file+' '+key); usage.get(key).add(file);
 }
 if (file.endsWith('.js')) for (const key of usage.keys()) if(source.includes('"'+key+'"')) usage.get(key).add(file);
 const page=source.match(/data-page="([^"]+)"/);
 if(page) for (const prefix of ['doc.title.','doc.desc.']) usage.get(prefix+page[1])?.add(file);
 source=source.replace(/<([\w-]+)\b([^<>]*?\bdata-i18n(?:-html)?="([^"]+)"[^<>]*)>([\s\S]*?)<\/\1>/g,(all,tag,attrs,key)=>{
   if (!(key in dict.en)) throw new Error(key);
   if (['input','textarea'].includes(tag.toLowerCase())) return all;
   return '<'+tag+attrs+'>'+ (attrs.includes('data-i18n-html=') ? dict.en[key] : escape(dict.en[key]))+'</'+tag+'>';
 });
 if(page) {
   for (const [selector,key] of [['name="description"','doc.desc.'],['property="og:description"','doc.desc.'],['property="og:title"','doc.title.']]) {
     source=source.replace(new RegExp('(<meta '+selector+' content=")[^"]*("[^>]*>)'),(_,before,after)=>before+escapeAttr(dict.en[key+page[1]])+after);
   }
   source=source.replace(/<title>[^<]*<\/title>/,'<title>'+escape(dict.en['doc.title.'+page[1]])+'</title>');
 }
 fs.writeFileSync(p,source);
}
const table=s=>String(s).replaceAll('|','&#124;').replaceAll('\n','<br>');
const modifiedZh=Object.keys(dict.zh).filter(k=>base.zh[k]!==dict.zh[k]).length;
const modifiedEn=Object.keys(dict.en).filter(k=>base.en[k]!==dict.en[k]).length;
const old=fs.readFileSync(path.join(root,'TRANSLATION-REVIEW.md'),'utf8');
const tail=old.slice(old.indexOf('## 静态内容核对'));
let report='# 中英文文案对照表\n\n由 `node scripts/sync-copy.cjs` 生成。运行时词典为定稿来源；在用判断覆盖 HTML、共享界面、表单动态选项及页面元信息动态键。原稿列保留基础词典，历史完整改稿见 Git 记录。\n\n';
report+=`审核统计：共 ${usage.size} 个词条；中文改写 ${modifiedZh} 个；英文修订 ${modifiedEn} 个；当前页面/表单引用 ${[...usage.values()].filter(v=>v.size).length} 个。\n\n`;
report+='| Key | 使用页面/脚本 | 英文定稿 | 中文原稿 | 中文定稿 | 状态 |\n| --- | --- | --- | --- | --- | --- |\n';
for(const [key,places] of usage) report+='| '+[key,[...places].join(', ')||'未引用',dict.en[key],base.zh[key],dict.zh[key],places.size?'在用':'历史词条'].map(table).join(' | ')+' |\n';
fs.writeFileSync(path.join(root,'TRANSLATION-REVIEW.md'),report+'\n'+tail);
console.log(JSON.stringify({keys:usage.size,active:[...usage.values()].filter(x=>x.size).length,modifiedZh,modifiedEn}));
