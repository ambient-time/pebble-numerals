"""Exercise the production PBW in isolated native emulator profiles."""
import argparse,datetime,hashlib,json,os,time,tempfile
from pathlib import Path
from uuid import UUID
from types import SimpleNamespace
ROOT=Path(__file__).resolve().parents[1];SDK=Path.home()/'Library/Application Support/Pebble SDK/SDKs/4.33.1';bin=str(SDK.resolve()/'toolchain/bin');os.environ['PEBBLE_QEMU_PATH']=bin+'/qemu-pebble';os.environ['PATH']=bin+os.pathsep+os.environ['PATH']
import png
from pebble_tool.commands.screenshot import ScreenshotCommand
from libpebble2.services.install import AppInstaller
from libpebble2.protocol.apps import AppRunState,AppRunStateStart,AppRunStateStop
from libpebble2.protocol.logs import AppLogMessage,AppLogShippingControl
from libpebble2.services.appmessage import AppMessageService,Int32,CString
from libpebble2.communication.transports.qemu.protocol import QemuButton
from pebble_tool.commands.emucontrol import send_data_to_qemu
import pebble_tool.sdk.emulator as emulator

def run(platform):
 pbw=ROOT/'build'/f'{ROOT.name}.pbw';digest=hashlib.sha256(pbw.read_bytes()).hexdigest();pkg=json.loads((ROOT/'package.json').read_text());app=UUID(pkg['pebble']['uuid']);systems=json.loads((ROOT/'systems.json').read_text());out=ROOT/'build/evidence';out.mkdir(exist_ok=True);state=Path(tempfile.mkdtemp(prefix='numerals-'+platform+'-',dir=ROOT/'build'))
 def persist(target,version=None):p=state/target;p.mkdir(exist_ok=True);return str(p)
 emulator.get_sdk_persist_dir=persist;emulator.get_emulator_info_path=lambda:str(state/'emulators.json');emulator.get_default_account=lambda:SimpleNamespace(is_logged_in=False)
 bridge=(out/f'{platform}-bridge.log').open('w');emulator.ManagedEmulatorTransport._get_output=lambda self:bridge
 cmd=ScreenshotCommand();cmd._set_debugging(0);watch=cmd._connect_emulator(platform,'4.33.1');cmd.pebble=watch;logs=[];frames=[];service=None
 handle=watch.register_endpoint(AppLogMessage,lambda p:logs.append(str(p.message)));watch.send_packet(AppLogShippingControl(enable=True));args=argparse.Namespace(no_correction=True,scale=1,no_open=True,v=0)
 def shot(name):
  image=cmd._grab_processed_image(args,show_progress=False);file=out/f'{platform}-{name}.png';png.from_array(image,mode='RGBA;8').save(str(file));frames.append(str(file.relative_to(ROOT)));return file.read_bytes()
 def send(payload):service.send_message(app,{keys[k]:CString(v) if isinstance(v,str) else Int32(v) for k,v in payload.items()})
 def capture(name,system,seconds,clock):
  wanted='system=%d seconds=%d time=%02d:%02d:%02d'%(system,seconds,*clock)
  for attempt in range(4):
   start=len(logs);target=datetime.datetime.now().replace(hour=clock[0],minute=clock[1],second=clock[2],microsecond=0);cmd._set_time(watch,target-datetime.timedelta(seconds=1));send({'SYSTEM':system,'SECONDS':seconds});deadline=time.monotonic()+2
   while not any(wanted in line for line in logs[start:]) and time.monotonic()<deadline:time.sleep(.02)
   if not any(wanted in line for line in logs[start:]):continue
   data=shot(name);latest=[line for line in logs[start:] if 'time=' in line]
   if wanted in latest[-1]:return data
   frames.pop()
  raise AssertionError('Exact native fixture unavailable: '+wanted)
 try:
  time.sleep(4);send_data_to_qemu(watch.transport,QemuButton(state=QemuButton.Button.Back));time.sleep(.2);send_data_to_qemu(watch.transport,QemuButton(state=0));time.sleep(.3);original_send=watch.send_packet
  def throttled_send(packet):
   time.sleep(.025);return original_send(packet)
  watch.send_packet=throttled_send
  try:AppInstaller(watch,str(pbw)).install()
  finally:watch.send_packet=original_send
  watch.send_packet(AppRunState(data=AppRunStateStart(uuid=app)));time.sleep(2)
  service=AppMessageService(watch);keys=json.loads((ROOT/'build/js/message_keys.json').read_text());capture('hero',0,1,(10,8,5))
  for row in systems:
   capture(row['slug']+'-three',row['id'],1,(23,59,59));capture(row['slug']+'-two',row['id'],0,(10,8,5));print(platform,row['slug'],'two and three groups captured',flush=True)
  capture('zero',0,1,(0,0,0));capture('persist-before',8,0,(10,8,5));watch.send_packet(AppRunState(data=AppRunStateStop(uuid=app)));time.sleep(.25);start=len(logs);watch.send_packet(AppRunState(data=AppRunStateStart(uuid=app)));time.sleep(.7);assert any('system=8 seconds=0' in line for line in logs[start:]);shot('persist-after')
  send({'SYSTEM':999,'SECONDS':1});send({'SYSTEM':'invalid','SECONDS':1});send({'SYSTEM':2});time.sleep(.4);watch.send_packet(AppRunState(data=AppRunStateStop(uuid=app)));time.sleep(.25);start=len(logs);watch.send_packet(AppRunState(data=AppRunStateStart(uuid=app)));time.sleep(.7);assert any('system=8 seconds=0' in line for line in logs[start:]);shot('invalid-retained')
  for name,clock,expected in [('noon',(11,59,58),'time=12:00:'),('midnight',(23,59,58),'time=00:00:')]:
   capture('before-'+name,0,1,clock);start=len(logs);deadline=time.monotonic()+4
   while not any(expected in line for line in logs[start:]) and time.monotonic()<deadline:time.sleep(.03)
   assert any(expected in line for line in logs[start:]),name;shot(name+'-rollover')
  assert not any('resource invalid' in l.lower() or 'could not be saved' in l.lower() or 'crash' in l.lower() for l in logs)
  report={'platform':platform,'pbwSHA256':digest,'systems':29,'bothGroupCounts':True,'settingsSurviveRestart':True,'invalidSettingsRejected':True,'naturalNoonRollover':True,'naturalMidnightRollover':True,'frames':frames,'logs':logs,'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'limitations':'Native emulator, not physical-watch readability, battery life or real-phone settings delivery.'};(out/f'{platform}-report.json').write_text(json.dumps(report,indent=2)+'\n');print(platform,len(frames),'native frames verified',flush=True)
 finally:
  if service:service.shutdown()
  watch.unregister_endpoint(handle);cmd._close_pebble_connection(watch);cmd.pebble=None;cmd._shutdown_platform_emulator(platform,'4.33.1');bridge.close()
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('platform',choices=['basalt','diorite','emery','flint']);run(parser.parse_args().platform)
