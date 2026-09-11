const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
module.exports = function readDictionary() {
  const code = fs.readFileSync(path.join(__dirname,'../assets/i18n.js'),'utf8');
  const context = {window:{}, document:{addEventListener(){}}, localStorage:{getItem(){return 'en';}}};
  vm.runInNewContext(code.replace('Object.assign(DICT.zh, ZH_REFINED);','window.__base = JSON.parse(JSON.stringify(DICT)); Object.assign(DICT.zh, ZH_REFINED);'),context);
  return {dict: context.window.__us_dict, base: context.window.__base};
};
if (require.main === module) console.log(JSON.stringify(module.exports()));
