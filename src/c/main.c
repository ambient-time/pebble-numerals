// Copyright 2026 Luke Steuber. MIT.
#include <pebble.h>
#include "model.h"
#include "styles.h"
#if NUMERAL_SYSTEMS != SYSTEM_COUNT
#error Numeral registry and settings bounds disagree
#endif
static Window *window;static Layer *canvas;static bool active=true;static Settings settings={0,1};
static uint8_t packed[NUMERAL_MAX_PACKED],pixels[NUMERAL_MAX_RAW];
static void ack(void){DictionaryIterator *out;if(app_message_outbox_begin(&out)!=APP_MSG_OK)return;dict_write_int32(out,MESSAGE_KEY_ACK_SYSTEM,settings.system);dict_write_int32(out,MESSAGE_KEY_ACK_SECONDS,settings.seconds);app_message_outbox_send();}
static int scale(int value,int factor){return (value*factor+128)/256;}
static void sign(GContext *ctx,int value,GRect box,const NumeralStyle *style){
 ResHandle resource=resource_get_handle(RESOURCES[settings.system]);uint8_t entry[6];if(resource_load_byte_range(resource,value*6,entry,6)!=6)return;
 uint32_t offset=(uint32_t)entry[0]|((uint32_t)entry[1]<<8)|((uint32_t)entry[2]<<16)|((uint32_t)entry[3]<<24);unsigned length=entry[4]|((unsigned)entry[5]<<8);
 if(length>sizeof(packed)||resource_load_byte_range(resource,offset,packed,length)!=length||!numeral_unpack(packed,length,pixels,style->width*style->height/8)){APP_LOG(APP_LOG_LEVEL_ERROR,"Numeral resource invalid");return;}
 int factor=box.size.w*256/style->width,fy=box.size.h*256/style->height;if(fy<factor)factor=fy;
 int ox=box.origin.x+(box.size.w-scale(style->width,factor))/2,oy=box.origin.y+(box.size.h-scale(style->height,factor))/2;
 for(int y=0;y<style->height;y++){int x=0;while(x<style->width){int i=y*style->width+x;if(!(pixels[i/8]&(1<<(7-x%8)))){x++;continue;}int first=x;do{x++;i=y*style->width+x;}while(x<style->width&&(pixels[i/8]&(1<<(7-x%8))));int x0=scale(first,factor),x1=scale(x,factor),y0=scale(y,factor),y1=scale(y+1,factor);graphics_fill_rect(ctx,GRect(ox+x0,oy+y0,x1-x0,y1-y0),0,GCornerNone);}}
}
static void draw(Layer *layer,GContext *ctx){
 GRect b=layer_get_bounds(layer);const NumeralStyle *style=&STYLES[settings.system];time_t epoch=time(NULL);struct tm now=*localtime(&epoch);uint8_t values[3];numeral_time(now.tm_hour,now.tm_min,now.tm_sec,values);
 graphics_context_set_fill_color(ctx,PBL_IF_COLOR_ELSE(GColorFromHEX(style->background),style->dark?GColorBlack:GColorWhite));graphics_fill_rect(ctx,b,0,GCornerNone);graphics_context_set_fill_color(ctx,PBL_IF_COLOR_ELSE(GColorFromHEX(style->ink),style->dark?GColorWhite:GColorBlack));
 int count=settings.seconds?3:2;
 for(int n=0;n<count;n++){GRect box;if(style->columns){int cell=(b.size.w-8)/count;box=GRect(4+n*cell+2,6,cell-4,b.size.h-12);}else{int cell=(b.size.h-12)/count;box=GRect(6,6+n*cell+2,b.size.w-12,cell-4);}sign(ctx,values[n],box,style);}
 APP_LOG(APP_LOG_LEVEL_INFO,"system=%u seconds=%u time=%02d:%02d:%02d heap=%lu",settings.system,settings.seconds,now.tm_hour,now.tm_min,now.tm_sec,(unsigned long)heap_bytes_free());
}
static void tick(struct tm *t,TimeUnits u){(void)t;(void)u;if(active&&canvas)layer_mark_dirty(canvas);}
static void cadence(void){tick_timer_service_unsubscribe();tick_timer_service_subscribe(settings.seconds?SECOND_UNIT:MINUTE_UNIT,tick);}
static void inbox(DictionaryIterator *in,void *context){(void)context;Tuple *s=dict_find(in,MESSAGE_KEY_SYSTEM),*v=dict_find(in,MESSAGE_KEY_SECONDS);if(!s&&!v){ack();return;}if(!s||!v||s->length!=4||v->length!=4||(s->type!=TUPLE_INT&&s->type!=TUPLE_UINT)||(v->type!=TUPLE_INT&&v->type!=TUPLE_UINT)||!settings_valid(s->value->int32,v->value->int32)){ack();return;}Settings candidate={(uint8_t)s->value->int32,(uint8_t)v->value->int32};if(persist_write_data(1,&candidate,sizeof(candidate))!=(int)sizeof(candidate)){APP_LOG(APP_LOG_LEVEL_ERROR,"Settings could not be saved");ack();return;}settings=candidate;cadence();if(canvas)layer_mark_dirty(canvas);ack();}
static void focus(bool focused){active=focused;if(active&&canvas)layer_mark_dirty(canvas);}
static void load(Window *w){Layer *root=window_get_root_layer(w);canvas=layer_create(layer_get_bounds(root));if(canvas){layer_set_update_proc(canvas,draw);layer_add_child(root,canvas);}}
static void unload(Window *w){(void)w;if(canvas){layer_destroy(canvas);canvas=NULL;}}
int main(void){Settings saved;if(persist_read_data(1,&saved,sizeof(saved))==(int)sizeof(saved)&&settings_valid(saved.system,saved.seconds))settings=saved;window=window_create();if(!window)return 1;window_set_window_handlers(window,(WindowHandlers){.load=load,.unload=unload});window_stack_push(window,true);app_message_register_inbox_received(inbox);app_message_open(128,128);app_focus_service_subscribe(focus);cadence();app_event_loop();tick_timer_service_unsubscribe();app_focus_service_unsubscribe();app_message_deregister_callbacks();window_destroy(window);return 0;}
