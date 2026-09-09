// Copyright 2026 Luke Steuber. MIT.
var SYSTEMS=require('./systems'),desired=null,inFlight=false,retries=0,timer=null,KEY='numerals.settings.v1';
function valid(s){return s&&typeof s.system==='number'&&s.system%1===0&&s.system>=0&&s.system<SYSTEMS.length&&(s.seconds===0||s.seconds===1);}
function saved(){try{var x=JSON.parse(localStorage.getItem(KEY));if(valid(x))return x;}catch(e){}return {system:0,seconds:1};}
function store(x){try{localStorage.setItem(KEY,JSON.stringify(x));}catch(e){console.log('Phone settings could not be saved.');}}
function retry(snapshot){if(desired!==snapshot)return;if(retries++<3){timer=setTimeout(send,500*retries);}else console.log('Watch has not confirmed these settings; reconnect and save again.');}
function send(){if(inFlight||!desired)return;inFlight=true;var snapshot=desired;Pebble.sendAppMessage({SYSTEM:snapshot.system,SECONDS:snapshot.seconds},function(){inFlight=false;if(desired!==snapshot){retries=0;send();}else retry(snapshot);},function(){inFlight=false;if(desired!==snapshot){retries=0;send();}else retry(snapshot);});}
function choose(s){if(!valid(s))return;desired={system:s.system,seconds:s.seconds};retries=0;if(timer)clearTimeout(timer);send();}
Pebble.addEventListener('ready',function(){Pebble.sendAppMessage({REQUEST:1});});
Pebble.addEventListener('appmessage',function(e){var p=e.payload||{},s={system:p.ACK_SYSTEM,seconds:p.ACK_SECONDS};if(!valid(s))return;if(desired){if(s.system!==desired.system||s.seconds!==desired.seconds)return;desired=null;if(timer)clearTimeout(timer);}store(s);});
Pebble.addEventListener('showConfiguration',function(){
 var platform;
 try{platform=Pebble.getActiveWatchInfo().platform;}catch(e){}
 var html=require('./settings-page')(desired||saved(),platform);
 Pebble.openURL('data:text/html;charset=utf-8,'+encodeURIComponent(html));
});
Pebble.addEventListener('webviewclosed',function(e){if(!e.response||e.response==='CANCELLED')return;try{choose(JSON.parse(decodeURIComponent(e.response)));}catch(error){console.log('Settings were not changed.');}});
if(typeof module!=='undefined')module.exports={valid:valid,saved:saved,choose:choose};
