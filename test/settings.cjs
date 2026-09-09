const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function harness(){const handlers={},storage={},sent=[],urls=[],timers=[];const c={module:{exports:{}},require:p=>require('../src/pkjs/'+p),console,localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v},setTimeout:f=>{timers.push(f);return timers.length},clearTimeout:()=>{},Pebble:{addEventListener:(n,f)=>handlers[n]=f,sendAppMessage:(m,ok,fail)=>sent.push({m,ok,fail}),openURL:u=>urls.push(u)}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/pkjs/index.js'),'utf8'),c);return {handlers,storage,sent,urls,timers,api:c.module.exports};}
test('ready asks watch and never resets a saved watch',()=>{let h=harness();h.handlers.ready();assert.equal(h.sent[0].m.REQUEST,1);assert.equal(h.sent[0].m.SYSTEM,undefined)});
test('invalid settings never send',()=>{let h=harness();for(const system of [-1,29,1.5,'2'])h.api.choose({system,seconds:1});assert.equal(h.sent.length,0)});
test('preference saves after matching watch acknowledgement',()=>{let h=harness();h.api.choose({system:8,seconds:0});h.handlers.appmessage({payload:{ACK_SYSTEM:0,ACK_SECONDS:1}});assert.equal(Object.keys(h.storage).length,0);h.handlers.appmessage({payload:{ACK_SYSTEM:8,ACK_SECONDS:0}});assert.equal(JSON.parse(h.storage['numerals.settings.v1']).system,8)});
test('changes serialize and stale acknowledgements do not overwrite',()=>{let h=harness();h.api.choose({system:4,seconds:1});h.api.choose({system:8,seconds:0});assert.equal(h.sent.length,1);h.sent[0].ok();assert.equal(h.sent[1].m.SYSTEM,8);h.handlers.appmessage({payload:{ACK_SYSTEM:4,ACK_SECONDS:1}});assert.equal(Object.keys(h.storage).length,0)});
test('cancel preserves settings',()=>{let h=harness();h.handlers.webviewclosed({response:'CANCELLED'});h.handlers.webviewclosed({response:''});assert.equal(h.sent.length,0)});
test('offline attempts bounded',()=>{let h=harness();h.api.choose({system:2,seconds:1});for(let i=0;i<4;i++){h.sent[i].fail();if(h.timers[i])h.timers[i]();}assert.equal(h.sent.length,4)});
test('configuration contains all systems and reading guides',()=>{let h=harness();h.handlers.showConfiguration();let page=decodeURIComponent(h.urls[0].split(',').slice(1).join(','));assert.match(page,/Yautja/);assert.match(page,/Braille/);assert.match(page,/Hours and minutes/);assert.match(page,/source’s decimal adaptation/)});

test("missing watch acknowledgement retries without claiming saved",()=>{let h=harness();h.api.choose({system:8,seconds:0});for(let i=0;i<4;i++){h.sent[i].ok();if(h.timers[i])h.timers[i]();}assert.equal(h.sent.length,4);assert.equal(Object.keys(h.storage).length,0)});

const pageFor=require('../src/pkjs/settings-page');
const systems=require('../systems.json');
const nativeSamples=require('../reference/settings-previews/manifest.json');
function webview(page) {
 const elements={};
 for(const id of ['system','seconds']) {
  const options=page.match(new RegExp('<select id="'+id+'">([\\s\\S]*?)</select>'))[1];
  elements[id]={value:options.match(/<option value="(\d+)" selected>/)[1]};
 }
 for(const id of ['preview','caption','guide','save'])elements[id]={};
 const location={href:''};
 vm.runInNewContext(page.match(/<script>([\s\S]*?)<\/script>/)[1],{document:{getElementById:id=>elements[id]},location});
 return {elements,location};
}
for(const platform of ['basalt','diorite','emery','flint'])test(platform+' previews match all 58 native samples before saving',()=>{
 const page=pageFor({system:8,seconds:0},platform),w=webview(page),e=w.elements;
 assert.match(e.preview.alt,/Kaktovik, 2 rows, showing 10:08/);
 assert.ok(('data:text/html;charset=utf-8,'+encodeURIComponent(page)).length<160000,'Keep each offline settings URL bounded');
 for(const row of systems)for(const seconds of [0,1]) {
  e.system.value=String(row.id);e.system.onchange();e.seconds.value=String(seconds);e.seconds.onchange();
  const sample=nativeSamples.frames.find(x=>x.platform===platform&&x.system===row.id&&x.seconds===seconds);
  const png=Buffer.from(e.preview.src.split(',')[1],'base64');
  assert.deepEqual(png,fs.readFileSync(path.join(__dirname,'../reference/settings-previews',sample.file)));
  assert.equal(e.guide.textContent,row.guide);
  assert.equal(e.preview.alt,row.name+', '+(seconds?3:2)+' '+row.layout+', showing '+(seconds?'23:59:59':'10:08'));
  assert.equal(e.caption.textContent,'Example · '+(seconds?'23:59:59':'10:08'));
  assert.equal(w.location.href,'','Browsing must not save');
 }
 e.save.onclick();assert.deepEqual(JSON.parse(decodeURIComponent(w.location.href.split('#')[1])),{system:28,seconds:1});
});
test('unknown watch uses a labeled color preview',()=>{
 const w=webview(pageFor({system:9,seconds:1},'unknown'));
 assert.match(w.elements.preview.alt,/Maya, 3 columns/);
 assert.match(w.elements.caption.textContent,/color screen/);
});
