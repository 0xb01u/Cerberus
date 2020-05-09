CFLAGS= -I. -O3 -DCP_TABLON
CFLAGS_DEBUG= -I. -g -O0
LIBS=-lm
CC=gcc
OMPCC=gcc -fopenmp
MPICC=mpicc
CUDACC=nvcc

evolution: placeholder.c
	$(CC) $(CFLAGS) $< -o $@ $(LIBS)

omp: placeholder.c
	$(OMPCC) $(CFLAGS) $< -o evolution $(LIBS)

mpi: placeholder.c
	$(MPICC) $(CFLAGS) $< -o evolution $(LIBS)

cuda: placeholder.cu
	$(CUDACC) $(CFLAGS) $< -o evolution $(LIBS)

debug: placeholder.c
	$(CC) $(CFLAGS_DEBUG) -DDEBUG $< -o $@ $(LIBS)

original: original.c
	$(CC) $(CFLAGS) $< -o $@ $(LIBS)

original_debug: original.c
	$(CC) $(CFLAGS_DEBUG) -DDEBUG $< -o $@ $(LIBS)

clean:
	rm -f evolution debug original original_debug

