CFLAGS= -I. -O3
CFLAGS_DEBUG= -I. -g -O0
LIBS=-lm
CC=nvcc

evolution: placeholder.cu
	$(CC) $(CFLAGS) $< -o $@ $(LIBS)

debug: placeholder.cu
	$(CC) $(CFLAGS_DEBUG) -DDEBUG $< -o $@ $(LIBS)

original: original.c
	$(CC) $(CFLAGS) $< -o $@ $(LIBS)

original_debug: original.c
	$(CC) $(CFLAGS_DEBUG) -DDEBUG $< -o $@ $(LIBS)

clean:
	rm -f evolution debug original original_debug

