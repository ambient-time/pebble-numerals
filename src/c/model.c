// Copyright 2026 Luke Steuber. MIT.
#include "model.h"
bool settings_valid(int system,int seconds){return system>=0&&system<NUMERAL_SYSTEMS&&(seconds==0||seconds==1);}
void numeral_time(unsigned h,unsigned m,unsigned s,uint8_t out[3]){out[0]=h%24;out[1]=m%60;out[2]=s%60;}
bool numeral_unpack(const uint8_t *in,size_t n,uint8_t *out,size_t expected){
 if(!in||!out||!expected||expected>NUMERAL_MAX_RAW)return false;
 size_t i=0,o=0;
 while(i<n&&o<expected){unsigned flags=in[i++];for(unsigned bit=0;bit<8&&o<expected;bit++){
  if(flags&(1u<<bit)){if(i>=n)return false;out[o++]=in[i++];}
  else{if(i+1>=n)return false;unsigned token=in[i]|((unsigned)in[i+1]<<8);i+=2;size_t distance=(token>>4)+1,length=(token&15)+3;if(distance>o||length>expected-o)return false;while(length--){out[o]=out[o-distance];o++;}}
 }}
 return o==expected&&i==n;
}
