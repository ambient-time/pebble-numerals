// Exercise the compiled phone bundle and its settings script without a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const bundle=fs.readFileSync(path.join(root,'build/pebble-js-app.js'),'utf8');
const samples=require('../reference/settings-previews/manifest.json');
let checked=0,largestURL=0;
for(const platform of ['basalt','diorite','emery','flint']) {
 const handlers={},urls=[],sent=[];
 vm.runInNewContext(bundle,{console,setTimeout,clearTimeout,localStorage:{getItem:()=>null,setItem:()=>{}},Pebble:{
  addEventListener:(name,fn)=>handlers[name]=fn,getActiveWatchInfo:()=>({platform}),openURL:url=>urls.push(url),sendAppMessage:message=>sent.push(message)
 }});
 handlers.showConfiguration();
 largestURL=Math.max(largestURL,urls[0].length);
 const html=decodeURIComponent(urls[0].split(',').slice(1).join(','));
 fs.writeFileSync(path.join(root,'build/settings-'+platform+'.html'),html);
 const nodes={system:{value:'0'},seconds:{value:'1'},preview:{},caption:{},guide:{},save:{}};
 const location={href:''};
 vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{document:{getElementById:id=>nodes[id]},location});
 for(const frame of samples.frames.filter(x=>x.platform===platform)) {
  nodes.system.value=String(frame.system);nodes.system.onchange();
  nodes.seconds.value=String(frame.seconds);nodes.seconds.onchange();
  assert.deepEqual(Buffer.from(nodes.preview.src.split(',')[1],'base64'),fs.readFileSync(path.join(root,'reference/settings-previews',frame.file)));
  assert.equal(location.href,'');assert.equal(sent.length,0);checked++;
 }
 nodes.save.onclick();handlers.webviewclosed({response:location.href.split('#')[1]});
 assert.equal(sent.length,1);assert.equal(sent[0].SYSTEM,28);assert.equal(sent[0].SECONDS,1);
}
const report={compiledPhoneBundle:true,previewStatesChecked:checked,largestSettingsURLBytes:largestURL,saveRoundTrip:true,browsingDoesNotSend:true,browserVisualCheck:false,realPhone:false};
fs.writeFileSync(path.join(root,'build/phone-preview-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
