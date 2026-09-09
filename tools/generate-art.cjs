// Copyright 2026 Luke Steuber. MIT. Source glyphs remain in reference/.
const fs=require('fs'),path=require('path'),vm=require('vm'),acorn=require('acorn');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),systems=JSON.parse(fs.readFileSync(path.join(root,'systems.json')));
const fonts=JSON.parse(fs.readFileSync(path.join(root,'reference/fonts/manifest.json')));
for(const f of fonts)if(!GlobalFonts.registerFromPath(path.join(root,'reference/fonts',f.file),f.family))throw Error('Font failed: '+f.family);
const sha=file=>require('crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const s of systems)if(sha(path.join(root,'reference',s.slug+'.html'))!==s.sourceSHA256)throw Error('Source hash mismatch: '+s.slug);
for(const f of fonts)if(sha(path.join(root,'reference/fonts',f.file))!==f.sha256)throw Error('Font hash mismatch: '+f.family);
const noop=()=>{},node={style:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,appendChild:noop,setAttribute:noop,textContent:'',getBoundingClientRect:()=>({width:128,height:40})};
const circle=(c,x,y,r,fill=true)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);fill?c.fill():c.stroke()};
function encRoman(n){let s='';for(const [v,m] of [[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(n>=v){s+=m;n-=v}return s||'·'}
function draw(s,n,c,api,w,h){
 const cx=w/2,cy=h/2; c.fillStyle='white';c.strokeStyle='white';c.lineWidth=1.7;c.lineCap='round';c.lineJoin='round';
 function text(t,font,size=32){c.font=`${size}px "${font}"`;c.textAlign='left';c.textBaseline='alphabetic';let m=c.measureText(t),width=m.actualBoundingBoxLeft+m.actualBoundingBoxRight,height=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;let factor=Math.min(1,(w-10)/Math.max(1,width),(h-6)/Math.max(1,height));c.font=`${size*factor}px "${font}"`;m=c.measureText(t);c.fillText(t,cx+(m.actualBoundingBoxLeft-m.actualBoundingBoxRight)/2,cy+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2)}
 switch(s){
 case 'roman':text(encRoman(n),'Cinzel',36);break;
 case 'greek-ionic':text(api.toGreek(n),'GFS Didot',36);break;
 case 'glagolitic':text(api.glyphsFor(n).join(''),'Noto Sans Glagolitic',35);break;
 case 'brahmi':text(api.toBrahmi(n),'Noto Sans Brahmi',35);break;
 case 'geez':text(api.toGeez(n),'Noto Serif Ethiopic',35);break;
 case 'hangul':text(api.korean(n),'Noto Sans KR',34);break;
 case 'hex-clock':text(n.toString(16).toUpperCase().padStart(2,'0'),'JetBrains Mono',36);break;
 case 'tengwar':text(String.fromCharCode(0xe070+Math.floor(n/12),0xe070+n%12),'Alcarin',36);break;
 case 'klingon':text(String.fromCharCode(0xf8f0+Math.floor(n/10),0xf8f0+n%10),'pIqaD',36);break;
 case 'yautja':api.digit(cx-20,cy,Math.floor(n/10),20,2);api.digit(cx+20,cy,n%10,20,2);break;
 case 'etruscan':{const g=api.glyphList(n),size=Math.min(34,116/Math.max(1,g.length)/.72),pitch=size*.72;if(!n)circle(c,cx,cy,5,false);else g.forEach((v,i)=>api.glyph(v,cx+(g.length-1)/2*pitch-i*pitch,cy,size,1.8));break;}
 case 'aegean':{let t=Math.floor(n/10),o=n%10,ww=t*10+(t&&o?3:0)+o*6;let x=cx-ww/2;c.lineWidth=1.4;for(let i=0;i<t;i++){c.beginPath();c.moveTo(x,cy);c.lineTo(x+6,cy);c.stroke();x+=10}if(t&&o)x+=3;for(let i=0;i<o;i++){c.beginPath();c.moveTo(x+3,cy-13);c.lineTo(x+3,cy+13);c.stroke();x+=6}break;}
 case 'kaktovik':api.drawGroup(cx,cy,n,33,.28,2);break;
 case 'mayan':api.drawGroup(cx,10,38,50,12,n);break;
 case 'babylonian':api.drawDigitClean(cx+6,cy,n,9);break;
 case 'counting-rods':api.drawDigit(cx-24,cy,Math.floor(n/10),19,'h');api.drawDigit(cx+24,cy,n%10,19,'v');break;
 case 'runic':api.stave(Math.floor(n/10),cx-18,4,36,1.8,8);api.stave(n%10,cx+18,4,36,1.8,8);break;
 case 'cistercian-triple':api.drawGlyph(cx,cy,n,52,['u','t']);break;
 case 'ogham':api.drawStem(cx-2,6,116,50,12,8,n);break;
 case 'tally':{let groups=Math.ceil(n/5);c.lineWidth=1.1;for(let g=0;g<groups;g++){let row=Math.floor(g/6),cols=Math.min(6,groups-row*6),x=cx-cols*20/2+(g%6)*20+4,y=groups>6?10+row*20:cy,marks=Math.min(5,n-g*5);for(let k=0;k<Math.min(4,marks);k++){c.beginPath();c.moveTo(x+k*3.2,y-6);c.lineTo(x+k*3.2,y+6);c.stroke()}if(marks===5){c.beginPath();c.moveTo(x-2,y+5);c.lineTo(x+12,y-5);c.stroke()}}break;}
 case 'binary':case 'negabinary':case 'gray-code':case 'bcd':{let bits=s==='negabinary'?api.toNega(n):s==='bcd'?(Math.floor(n/10).toString(2).padStart(4,'0')+(n%10).toString(2).padStart(4,'0')).split('').map(Number):(s==='gray-code'?(n^(n>>1)):n).toString(2).padStart(6,'0').split('').map(Number);let pitch=14,r=4.3;bits.forEach((b,i)=>circle(c,cx+(i-(bits.length-1)/2)*pitch,cy,r,!!b));break;}
 case 'ternary':api.toBalancedTernary(n).forEach((x,i)=>api.drawGlyph(cx+(i-2)*23,cy,x,8,1));break;
 case 'factoradic':api.toFact(n).forEach((d,i)=>{let x=cx+(i-1.5)*28;c.lineWidth=1;c.strokeRect(x-7,2,14,36);for(let k=0;k<d;k++)circle(c,x,33-k*8,2.8)});break;
 case 'brass':{const masks=[60, [26,1,3,9,25,17,11,27,19,10][Math.floor(n/10)],[26,1,3,9,25,17,11,27,19,10][n%10]];masks.forEach((m,k)=>{for(let i=0;i<6;i++)if(m&(1<<i))circle(c,cx+(k-1)*29+(i>=3?5:-5),cy+((i%3)-1)*11,3)});break;}
 case 'iching':for(let i=0;i<6;i++)api.drawLine(cx,cy+15-i*6,42,3,(n>>i)&1);break;
 case 'aztec':{let t=Math.floor(n/20),o=n%20,ww=t*25+(t&&o?8:0)+(o?32:0),x=cx-ww/2;for(let i=0;i<t;i++)api.banner(x+12+i*25,cy,20);let dx=x+t*25+(t&&o?8:0)+3,rows=Math.ceil(o/5);for(let i=0;i<o;i++)circle(c,dx+(i%5)*6.5,cy+(Math.floor(i/5)-(rows-1)/2)*8,2);break;}
 default:throw Error(s);
 }
}
function sourceAPI(system,ctx){
 const html=fs.readFileSync(path.join(root,'reference',system.slug+'.html'),'utf8');const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);let code=scripts.find(x=>(x.includes('getHours')||x.includes('getUTCHours'))&&!x.includes('function onReady'));if(!code)return {};
 let ast=acorn.parse(code,{ecmaVersion:'latest'}),body;
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionExpression'&&!body&&n.body.body.some(x=>x.type==='FunctionDeclaration'))body=n.body.body;for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v)}walk(ast);if(!body)return {};
 const canvas={getContext:()=>ctx,getBoundingClientRect:()=>({width:128,height:40})};
 const sandbox={ctx,Math,console,window:{self:{},top:{},devicePixelRatio:1,addEventListener:noop,matchMedia:()=>({matches:true,addEventListener:noop})},document:{getElementById:id=>id==='scene'?canvas:node,querySelector:()=>node,querySelectorAll:()=>[],documentElement:node,createElement:()=>node,addEventListener:noop},localStorage:{getItem:()=>null},performance:{now:()=>0},requestAnimationFrame:noop,cancelAnimationFrame:noop,setTimeout:noop,clearTimeout:noop,Date};vm.createContext(sandbox);
 for(const item of body){if(item.type==='FunctionDeclaration')vm.runInContext(code.slice(item.start,item.end),sandbox);}
 for(const item of body){if(item.type==='VariableDeclaration'){try{vm.runInContext(code.slice(item.start,item.end),sandbox)}catch{}}}
 sandbox.ctx=ctx;sandbox.fontReady=true;return sandbox;
}
const out=path.join(root,'build/art');fs.mkdirSync(out,{recursive:true});let manifest=[];
for(const system of systems){
 let w=system.layout==='columns'?48:128,h=system.layout==='columns'?128:40;
 const big=createCanvas(w*4,h*4),raw=big.getContext('2d');raw.scale(4,4);
 const ctx=new Proxy(raw,{get(t,k){let v=t[k];return typeof v==='function'?v.bind(t):v},set(t,k,v){if(k==='shadowBlur')v=0;if(k==='fillStyle'||k==='strokeStyle')v='white';if(k==='globalAlpha')v=1;t[k]=v;return true}});
 const api=sourceAPI(system,ctx),small=createCanvas(w,h),sc=small.getContext('2d'),buffers=[];let hashes=new Set();
 for(let n=0;n<60;n++){
  raw.clearRect(0,0,w,h);draw(system.slug,n,ctx,api,w,h);sc.clearRect(0,0,w,h);sc.drawImage(big,0,0,w,h);const d=sc.getImageData(0,0,w,h).data,b=Buffer.alloc(w*h/8);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>=100)b[(y*w+x)>>3]|=1<<(7-(x%8));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if((x===0||y===0||x===w-1||y===h-1)&&(b[(y*w+x)>>3]&(1<<(7-x%8))))throw Error(`${system.slug} ${n}: clipped edge`);
  buffers.push(b);hashes.add(b.toString('base64'));
  if([0,8,23,38,59].includes(n))fs.writeFileSync(path.join(out,system.slug+'-'+n+'.png'),small.toBuffer('image/png'));
 }
 if(hashes.size!==60)throw Error(`${system.slug}: only ${hashes.size}/60 distinct values`);
 fs.writeFileSync(path.join(out,system.slug+'.raw'),Buffer.concat(buffers));manifest.push({...system,width:w,height:h,rawBytes:w*h/8,distinctValues:hashes.size});console.log(system.slug,'60 distinct numeral renderings');
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
