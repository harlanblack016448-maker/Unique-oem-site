const test = require('node:test');
const assert = require('node:assert/strict');
const send = require('../assets/inquiry-request.js');
for (const success of [true,'true']) test(`accept explicit ${JSON.stringify(success)}`,async()=>{
  assert.deepEqual(await send('/local',{}, {fetch:async()=>({ok:true,json:async()=>({success})})}),{success});
});
for (const receipt of [{success:false},{success:'false'}, {}, null, {success:1}]) test(`reject ${JSON.stringify(receipt)}`,async()=>{
  await assert.rejects(send('/local',{}, {fetch:async()=>({ok:true,json:async()=>receipt})}));
});
test('non-2xx cannot become success',async()=>assert.rejects(send('/local',{}, {fetch:async()=>({ok:false,json:async()=>({success:true})})})));
test('malformed receipt is a failure',async()=>assert.rejects(send('/local',{}, {fetch:async()=>({ok:true,json:async()=>{throw new SyntaxError('HTML');}})})));
test('network error is a failure',async()=>assert.rejects(send('/local',{}, {fetch:async()=>{throw new TypeError('offline');}})));
for (const phase of ['headers','body']) test(`deadline aborts stalled ${phase}`,async()=>{
  let aborted=false;
  await assert.rejects(send('/local',{}, {timeoutMs:10,fetch:async(_, {signal})=>{
    const stalled=new Promise((_,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'));},{once:true}));
    return phase==='headers'?stalled:{ok:true,json:()=>stalled};
  }}));
  assert.equal(aborted,true);
});
