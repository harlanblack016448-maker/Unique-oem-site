// Exercise the production submit handler without network calls or external mail apps.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(send){
  const events={}, handlers={};
  const state={resets:0,conversions:0,lang:'en'};
  const notice=()=>({classList:{add(){},remove(){}},setAttribute(){},focus(){},scrollIntoView(){}});
  const button={disabled:false,textContent:''};
  const form={noValidate:false,addEventListener:(key,fn)=>handlers[key]=fn,getAttribute:()=>'/local',reset:()=>state.resets++,querySelector:selector=>selector==='.form-success'||selector==='.form-error'?notice():selector==='button[type="submit"]'?button:null};
  const window={location:{search:'',href:''},__us_sendInquiry:send,__us_getLang:()=>state.lang,__us_dict:{en:{'contact.sending':'Sending'},zh:{'contact.sending':'正在发送'}},lintrk:()=>state.conversions++};
  const document={getElementById:id=>id==='lead-form'?form:null,addEventListener:(key,fn)=>(events[key] ||= []).push(fn)};
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/form.js'),'utf8'),{window,document,URLSearchParams,atob:s=>Buffer.from(s,'base64').toString(),FormData:class {delete(){}}});
  events.DOMContentLoaded.forEach(fn=>fn());
  return {state,button,window,submit:()=>handlers.submit({preventDefault(){}}),switchLanguage:()=>{state.lang='zh';events['us:i18n'].forEach(fn=>fn());}};
}
test('duplicate submits are ignored and sending label follows language',async()=>{
 let finish,calls=0;const app=setup(()=>{calls++;return new Promise(resolve=>finish=resolve);});
 const pending=app.submit();await app.submit();assert.equal(calls,1);assert.equal(app.button.disabled,true);
 app.switchLanguage();assert.equal(app.button.textContent,'正在发送');
 finish();await pending;assert.equal(app.state.resets,1);assert.equal(app.state.conversions,1);assert.equal(app.button.disabled,false);
});
test('failure preserves form and uses existing email fallback without conversion',async()=>{
 const app=setup(async()=>{throw new Error('unconfirmed');});await app.submit();
 assert.equal(app.state.resets,0);assert.equal(app.state.conversions,0);assert.equal(app.button.disabled,false);assert.match(app.window.location.href,/^mailto:/);
});
