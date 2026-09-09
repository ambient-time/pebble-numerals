// Copyright 2026 Luke Steuber. MIT.
#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#define NUMERAL_SYSTEMS 29
#define NUMERAL_MAX_RAW 768
#define NUMERAL_MAX_PACKED 1024
typedef struct {uint8_t system,seconds;} Settings;
bool settings_valid(int system,int seconds);
bool numeral_unpack(const uint8_t *input,size_t n,uint8_t *output,size_t expected);
void numeral_time(unsigned hour,unsigned minute,unsigned second,uint8_t out[3]);
