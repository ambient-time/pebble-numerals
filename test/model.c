#include "../src/c/model.h"
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
int main(int argc,char **argv){assert(argc==3);FILE *f=fopen(argv[1],"rb"),*raw=fopen(argv[2],"rb");assert(f&&raw);uint8_t index[360],compressed[1024],actual[768],expected[768];assert(fread(index,1,360,f)==360);fseek(raw,0,SEEK_END);size_t stride=ftell(raw)/60;rewind(raw);assert(stride<=768);
for(int value=0;value<60;value++){uint8_t *e=index+value*6;unsigned offset=e[0]|e[1]<<8|e[2]<<16|e[3]<<24,length=e[4]|e[5]<<8;assert(length<=1024);fseek(f,offset,SEEK_SET);assert(fread(compressed,1,length,f)==length);assert(numeral_unpack(compressed,length,actual,stride));assert(fread(expected,1,stride,raw)==stride);for(size_t i=0;i<stride;i++)assert(actual[i]==expected[i]);assert(!numeral_unpack(compressed,length-1,actual,stride));}
fclose(f);fclose(raw);uint8_t bad[]={0,0,0};assert(!numeral_unpack(bad,3,actual,3));assert(!settings_valid(-1,1)&&!settings_valid(29,1)&&!settings_valid(0,2));for(int h=0;h<24;h++)for(int m=0;m<60;m++)for(int s=0;s<60;s++){uint8_t v[3];numeral_time(h,m,s,v);assert(v[0]==h&&v[1]==m&&v[2]==s);}puts("60 resources decoded exactly; malformed inputs and all-day time boundaries passed");}
