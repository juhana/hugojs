# Basic makefile for the Hugo Engine

# Name of executable:
HE = he.js
# Compiler:
CC = emcc $(DEFINES)
DEFINES = -s ASYNCIFY=1

OBJECTS = he.o hejs.o heexpr.o hemisc.o heobject.o heparse.o heres.o herun.o heset.o stringfn.o

all : he

he : $(OBJECTS)

$(OBJECTS) : heheader.h
