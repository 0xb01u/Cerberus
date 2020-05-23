/*
 * Simplified simulation of life evolution
 *
 * Computacion Paralela, Grado en Informatica (Universidad de Valladolid)
 * 2019/2020
 *
 * v1.5
 *
 * CHANGES:
 * 1) Float values have been substituted by fixed point arithmetics 
 *	using integers. To simplify, the fixed point arithmetics are done 
 *	with PRECISION in base 10. See precision constant in int_float.h
 * 2) It uses a portable approximation to trigonometric functions using
 *	Taylor polynomials. 
 * 3) nrand48 function has been extracted from glibc source code and 
 *	its internal API simplified to allow its use in the GPU.
 *
 * (c) 2020, Arturo Gonzalez Escribano
 */
#include<stdio.h>
#include<stdlib.h>
#include<string.h>
#include<math.h>
#include<stdbool.h>
#include<cputils.h>
#include<cuda.h>
#include<int_float.h>

/* 
 * Constants: Converted to fixed point with the given PRECISION
 */
#define ENERGY_NEEDED_TO_LIVE		PRECISION / 10	// Equivalent to 0.1
#define ENERGY_NEEDED_TO_MOVE		PRECISION	// Equivalent to 1.0
#define ENERGY_SPENT_TO_LIVE		PRECISION / 5	// Equivalent to 0.2
#define ENERGY_SPENT_TO_MOVE		PRECISION	// Equivalent to 1.0
#define ENERGY_NEEDED_TO_SPLIT		PRECISION * 20	// Equivalent to 20.0


/* Structure to store data of a cell */
typedef struct {
	int pos_row, pos_col;		// Position
	int mov_row, mov_col;		// Direction of movement
	int choose_mov[3];		// Genes: Probabilities of 0 turning-left; 1 advance; 2 turning-right
	int storage;			// Food/Energy stored
	int age;			// Number of steps that the cell has been alive
	unsigned short random_seq[3];	// Status value of its particular random sequence
	bool alive;			// Flag indicating if the cell is still alive
} Cell;


/* Structure for simulation statistics */
typedef struct {
	int history_total_cells;	// Accumulated number of cells created
	int history_dead_cells;		// Accumulated number of dead cells
	int history_max_alive_cells;	// Maximum number of cells alive in a step
	int history_max_new_cells;	// Maximum number of cells created in a step
	int history_max_dead_cells;	// Maximum number of cells died in a step
	int history_max_age;		// Maximum age achieved by a cell
	int history_max_food;		// Maximum food level in a position of the culture
} Statistics;


/*
 *
 * START HERE: DO NOT CHANGE THE CODE ABOVE THIS POINT
 *
 *	USE THIS SPACE FOR YOUR KERNEL OR DEVICE FUNTIONS
 *
 */

#include "taylor_trig.h"
#include "glibc_nrand48.h"

/*
 * Get an uniformly distributed random number between 0 and max
 * It uses glibc_nrand, that returns a number between 0 and 2^31
 */
#define int_urand48( max, seq )	(int)( (long)(max) * glibc_nrand48( seq ) / 2147483648 )

/* 
 * Macro function to simplify accessing with two coordinates to a flattened array
 * 	This macro-function can be modified by the students if needed
 *
 */
#define accessMat( arr, exp1, exp2 )	arr[ (int)(exp1) * columns + (int)(exp2) ]

/*
 * Function: Choose a new direction of movement for a cell
 * 	This function can be changed and/or optimized by the students
 */
void cell_new_direction( Cell *cell ) {
	int angle = int_urand48( INT_2PI, cell->random_seq );
	cell->mov_row = taylor_sin( angle );
	cell->mov_col = taylor_cos( angle );
}

/*
 * Function: Mutation of the movement genes on a new cell
 * 	This function can be changed and/or optimized by the students
 */
void cell_mutation( Cell *cell ) {
	/* 1. Select which genes change:
	 	0 Left grows taking part of the Advance part
	 	1 Advance grows taking part of the Left part
	 	2 Advance grows taking part of the Right part
	 	3 Right grows taking part of the Advance part
	*/
	int mutation_type = int_urand48( 4, cell->random_seq );
	/* 2. Select the amount of mutation (up to 50%) */
	int mutation_percentage = int_urand48( PRECISION / 2, cell->random_seq );
	/* 3. Apply the mutation */
	int mutation_value;
	switch( mutation_type ) {
		case 0:
			mutation_value = intfloatMult( cell->choose_mov[1] , mutation_percentage );
			cell->choose_mov[1] -= mutation_value;
			cell->choose_mov[0] += mutation_value;
			break;
		case 1:
			mutation_value = intfloatMult( cell->choose_mov[0] , mutation_percentage );
			cell->choose_mov[0] -= mutation_value;
			cell->choose_mov[1] += mutation_value;
			break;
		case 2:
			mutation_value = intfloatMult( cell->choose_mov[2] , mutation_percentage );
			cell->choose_mov[2] -= mutation_value;
			cell->choose_mov[1] += mutation_value;
			break;
		case 3:
			mutation_value = intfloatMult( cell->choose_mov[1] , mutation_percentage );
			cell->choose_mov[1] -= mutation_value;
			cell->choose_mov[2] += mutation_value;
			break;
	}
	/* 4. Correct potential precision problems */
	cell->choose_mov[2] = PRECISION - cell->choose_mov[1] - cell->choose_mov[0];
}

/*
 * CUDA block reduction
 * Inputs: 
 *	Device pointer to an array of int of any size
 *	Size of the array
 *	Device pointer to an int to store the result
 * 
 * Launching parameters:
 *	One-dimesional grid of any size
 *	Any valid block size
 *	Dynamic shared memory size equal to: sizeof(int) * block size
 *
 * (c) 2020, Arturo Gonzalez-Escribano
 * Simplification for an assignment in a Parallel Computing course,
 * Computing Engineering Degree, Universidad de Valladolid
 * Academic year 2019/2020
 */
__global__ void reductionMax(int* array, int size, int *result)
{
	int globalPos = threadIdx.x + blockIdx.x * blockDim.x;

	extern __shared__ int buffer[ ];
	if ( globalPos < size ) { 
		buffer[ threadIdx.x ] = array[ globalPos ];
	}
	else buffer[ threadIdx.x ] = 0.0f;
	__syncthreads();

	for( int step=blockDim.x/2; step>=1; step /= 2 ) {
		if ( threadIdx.x < step )
			if ( buffer[ threadIdx.x ] < buffer[ threadIdx.x + step ] )
				buffer[ threadIdx.x ] = buffer[ threadIdx.x + step ];
		if ( step > 32 )
			__syncthreads();
	}

	if ( threadIdx.x == 0 )
		atomicMax( result, buffer[0] );
}


/*
 *
 * STOP HERE: DO NOT CHANGE THE CODE BELOW THIS POINT
 *
 */


#ifdef DEBUG
/* 
 * Function: Print the current state of the simulation 
 */
void print_status( int iteration, int rows, int columns, int *culture, int num_cells, Cell *cells, int num_cells_alive, Statistics sim_stat ) {
	/* 
	 * You don't need to optimize this function, it is only for pretty printing and debugging purposes.
	 * It is not compiled in the production versions of the program.
	 * Thus, it is never used when measuring times in the leaderboard
	 */
	int i,j;

	printf("Iteration: %d\n", iteration );
	printf("+");
	for( j=0; j<columns; j++ ) printf("---");
	printf("+\n");
	for( i=0; i<rows; i++ ) {
		printf("|");
		for( j=0; j<columns; j++ ) {
			char symbol;
			if ( accessMat( culture, i, j ) >= 20 * PRECISION ) symbol = '+';
			else if ( accessMat( culture, i, j ) >= 10 * PRECISION ) symbol = '*';
			else if ( accessMat( culture, i, j ) >= 5 * PRECISION ) symbol = '.';
			else symbol = ' ';

			int t;
			int counter = 0;
			for( t=0; t<num_cells; t++ ) {
				int row = (int)(cells[t].pos_row / PRECISION);
				int col = (int)(cells[t].pos_col / PRECISION);
				if ( cells[t].alive && row == i && col == j ) {
					counter ++;
				}
			}
			if ( counter > 9 ) printf("(M)" );
			else if ( counter > 0 ) printf("(%1d)", counter );
			else printf(" %c ", symbol );
		}
		printf("|\n");
	}
	printf("+");
	for( j=0; j<columns; j++ ) printf("---");
	printf("+\n");
	printf("Num_cells_alive: %04d\nHistory( Cells: %04d, Dead: %04d, Max.alive: %04d, Max.new: %04d, Max.dead: %04d, Max.age: %04d, Max.food: %6f )\n\n", 
		num_cells_alive, 
		sim_stat.history_total_cells, 
		sim_stat.history_dead_cells, 
		sim_stat.history_max_alive_cells, 
		sim_stat.history_max_new_cells, 
		sim_stat.history_max_dead_cells, 
		sim_stat.history_max_age,
		(float)sim_stat.history_max_food / PRECISION
	);
}
#endif

/*
 * Function: Print usage line in stderr
 */
void show_usage( char *program_name ) {
	fprintf(stderr,"Usage: %s ", program_name );
	fprintf(stderr,"<rows> <columns> <maxIter> <max_food> <food_density> <food_level> <short_rnd1> <short_rnd2> <short_rnd3> <num_cells>\n");
	fprintf(stderr,"\tOptional arguments for special food spot: [ <row> <col> <size_rows> <size_cols> <density> <level> ]\n");
	fprintf(stderr,"\n");
}


/*
 * MAIN PROGRAM
 */
int main(int argc, char *argv[]) {
	int i,j;

	// Simulation data
	int max_iter;			// Maximum number of simulation steps
	int rows, columns;		// Cultivation area sizes
	int *culture;			// Cultivation area values
	int *culture_cells;		// Ancillary structure to count the number of cells in a culture space

	float max_food;			// Maximum level of food on any position
	float food_density;		// Number of food sources introduced per step
	float food_level;		// Maximum number of food level in a new source

	bool food_spot_active = false;	// Special food spot: Active
	int food_spot_row = 0;		// Special food spot: Initial row
	int food_spot_col = 0;		// Special food spot: Initial row
	int food_spot_size_rows = 0;	// Special food spot: Rows size
	int food_spot_size_cols = 0;	// Special food spot: Cols size
	float food_spot_density = 0.0f;	// Special food spot: Food density
	float food_spot_level = 0.0f;	// Special food spot: Food level

	unsigned short init_random_seq[3];	// Status of the init random sequence
	unsigned short food_random_seq[3];	// Status of the food random sequence
	unsigned short food_spot_random_seq[3];	// Status of the special food spot random sequence

	int	num_cells;		// Number of cells currently stored in the list
	Cell	*cells;			// List to store cells information

	// Statistics
	Statistics sim_stat;	
	sim_stat.history_total_cells = 0;
	sim_stat.history_dead_cells = 0;
	sim_stat.history_max_alive_cells = 0;
	sim_stat.history_max_new_cells = 0;
	sim_stat.history_max_dead_cells = 0;
	sim_stat.history_max_age = 0;
	sim_stat.history_max_food = 0.0f;

	/* 1. Read simulation arguments */
	/* 1.1. Check minimum number of arguments */
	if (argc < 11) {
		fprintf(stderr, "-- Error: Not enough arguments when reading configuration from the command line\n\n");
		show_usage( argv[0] );
		exit( EXIT_FAILURE );
	}

	/* 1.2. Read culture sizes, maximum number of iterations */
	rows = atoi( argv[1] );
	columns = atoi( argv[2] );
	max_iter = atoi( argv[3] );

	/* 1.3. Food data */
	max_food = atof( argv[4] );
	food_density = atof( argv[5] );
	food_level = atof( argv[6] );

	/* 1.4. Read random sequences initializer */
	for( i=0; i<3; i++ ) {
		init_random_seq[i] = (unsigned short)atoi( argv[7+i] );
	}

	/* 1.5. Read number of cells */
	num_cells = atoi( argv[10] );

	/* 1.6. Read special food spot */
	if (argc > 11 ) {
		if ( argc < 17 ) {
			fprintf(stderr, "-- Error in number of special-food-spot arguments in the command line\n\n");
			show_usage( argv[0] );
			exit( EXIT_FAILURE );
		}
		else {
			food_spot_active = true;
			food_spot_row = atoi( argv[11] );
			food_spot_col = atoi( argv[12] );
			food_spot_size_rows = atoi( argv[13] );
			food_spot_size_cols = atoi( argv[14] );
			food_spot_density = atof( argv[15] );
			food_spot_level = atof( argv[16] );

			// Check non-used trailing arguments
			if ( argc > 17 ) {
				fprintf(stderr, "-- Error: too many arguments in the command line\n\n");
				show_usage( argv[0] );
				exit( EXIT_FAILURE );
			}
		}
	}

#ifdef DEBUG
	/* 1.7. Print arguments */
	printf("Arguments, Rows: %d, Columns: %d, max_iter: %d\n", rows, columns, max_iter);
	printf("Arguments, Max.food: %f, Food density: %f, Food level: %f\n", max_food, food_density, food_level);
	printf("Arguments, Init Random Sequence: %hu,%hu,%hu\n", init_random_seq[0], init_random_seq[1], init_random_seq[2]);
	if ( food_spot_active ) {
		printf("Arguments, Food_spot, pos(%d,%d), size(%d,%d), Density: %f, Level: %f\n",
			food_spot_row, food_spot_col, food_spot_size_rows, food_spot_size_cols, food_spot_density, food_spot_level );
	}
	printf("Initial cells: %d\n", num_cells );
#endif // DEBUG


	/* 1.8. Initialize random sequences for food dropping */
	for( i=0; i<3; i++ ) {
		food_random_seq[i] = (unsigned short)glibc_nrand48( init_random_seq );
		food_spot_random_seq[i] = (unsigned short)glibc_nrand48( init_random_seq );
	}

	/* 1.9. Initialize random sequences of cells */
	cells = (Cell *)malloc( sizeof(Cell) * (size_t)num_cells );
	if ( cells == NULL ) {
		fprintf(stderr,"-- Error allocating: %d cells\n", num_cells );
		exit( EXIT_FAILURE );
	}
	for( i=0; i<num_cells; i++ ) {
		// Initialize the cell ramdom sequences
		for( j=0; j<3; j++ ) 
			cells[i].random_seq[j] = (unsigned short)glibc_nrand48( init_random_seq );
	}


#ifdef DEBUG
	/* 1.10. Print random seed of the initial cells */
	/*
	printf("Initial cells random seeds: %d\n", num_cells );
	for( i=0; i<num_cells; i++ )
		printf("\tCell %d, Random seq: %hu,%hu,%hu\n", i, cells[i].random_seq[0], cells[i].random_seq[1], cells[i].random_seq[2] );
	*/
#endif // DEBUG


	// CUDA start
	cudaSetDevice(0);
	cudaDeviceSynchronize();

	/* 2. Start global timer */
	double ttotal = cp_Wtime();

/*
 *
 * START HERE: DO NOT CHANGE THE CODE ABOVE THIS POINT
 *
 */

#include "cuda_check.h"
#include "cuda_time.h"

	/* 3. Initialize culture surface and initial cells */
	culture = (int *)malloc( sizeof(int) * (size_t)rows * (size_t)columns );
	culture_cells = (int *)malloc( sizeof(int) * (size_t)rows * (size_t)columns );
#ifdef DEVELOPMENT
	if ( culture == NULL || culture_cells == NULL ) {
		fprintf(stderr,"-- Error allocating culture structures for size: %d x %d \n", rows, columns );
		exit( EXIT_FAILURE );
	}
#endif // DEVELOPMENT
	// 3.1
	time_start();
	for( i=0; i<rows; i++ )
		for( j=0; j<columns; j++ ) 
			accessMat( culture, i, j ) = 0;
	time_end(time3_1);

	// 3.2
	time_start();
	for( i=0; i<num_cells; i++ ) {
		cells[i].alive = true;
		// Initial age: Between 1 and 20 
		cells[i].age = 1 + int_urand48( 19, cells[i].random_seq );
		// Initial storage: Between 10 and 20 units
		cells[i].storage = 10 * PRECISION + int_urand48( 10 * PRECISION, cells[i].random_seq );
		// Initial position: Anywhere in the culture arena
		cells[i].pos_row = int_urand48( rows * PRECISION, cells[i].random_seq );
		cells[i].pos_col = int_urand48( columns * PRECISION, cells[i].random_seq );
		// Movement direction: Unity vector in a random direction
		cell_new_direction( &cells[i] );
		// Movement genes: Probabilities of advancing or changing direction: The sum should be 1.00
		cells[i].choose_mov[0] = PRECISION / 3;
		cells[i].choose_mov[2] = PRECISION / 3;
		cells[i].choose_mov[1] = PRECISION - cells[i].choose_mov[0] - cells[i].choose_mov[2];
	}

	// Statistics: Initialize total number of cells, and max. alive
	sim_stat.history_total_cells = num_cells;
	sim_stat.history_max_alive_cells = num_cells;
	time_end(time3_2);

#ifdef DEBUG
	/* Show initial cells data */
	printf("Initial cells data: %d\n", num_cells );
	for( i=0; i<num_cells; i++ ) {
		printf("\tCell %d, Pos(%f,%f), Mov(%f,%f), Choose_mov(%f,%f,%f), Storage: %f, Age: %d\n",
				i, 
				(float)cells[i].pos_row / PRECISION, 
				(float)cells[i].pos_col / PRECISION, 
				(float)cells[i].mov_row / PRECISION, 
				(float)cells[i].mov_col / PRECISION, 
				(float)cells[i].choose_mov[0] / PRECISION, 
				(float)cells[i].choose_mov[1] / PRECISION, 
				(float)cells[i].choose_mov[2] / PRECISION, 
				(float)cells[i].storage / PRECISION,
				cells[i].age );
	}
#endif // DEBUG

	/* 4. Simulation */
	int current_max_food = 0;
	int num_cells_alive = num_cells;
	int iter;
	int max_food_int = max_food * PRECISION;

	int num_new_sources = (int)(rows * columns * food_density);
	int num_new_sources_spot = food_spot_active ? (int)(food_spot_size_rows * food_spot_size_cols * food_spot_density) : 0;
	for( iter=0; iter<max_iter && current_max_food <= max_food_int && num_cells_alive > 0; iter++ ) {
		update_times();

		int step_new_cells = 0;
		int step_dead_cells = 0;

		/* 4.1. Spreading new food */
		time_start();
		// Across the whole culture
		for (i=0; i<num_new_sources; i++) {
			int row = int_urand48( rows, food_random_seq );
			int col = int_urand48( columns, food_random_seq );
			int food = int_urand48( food_level * PRECISION, food_random_seq );
			accessMat( culture, row, col ) = accessMat( culture, row, col ) + food;
		}
		// In the special food spot
		if ( food_spot_active ) {
			for (i=0; i<num_new_sources_spot; i++) {
				int row = food_spot_row + int_urand48( food_spot_size_rows, food_spot_random_seq );
				int col = food_spot_col + int_urand48( food_spot_size_cols, food_spot_random_seq );
				int food = int_urand48( food_spot_level * PRECISION, food_spot_random_seq );
				accessMat( culture, row, col ) = accessMat( culture, row, col ) + food;
			}
		}
		time_end(time4_1);

		/* 4.2. Prepare ancillary data structures */
		time_start();
		/* 4.2.1. Clear ancillary structure of the culture to account alive cells in a position after movement */
		for( i=0; i<rows; i++ )
			for( j=0; j<columns; j++ ) 
				accessMat( culture_cells, i, j ) = 0;
 		/* 4.2.2. Allocate ancillary structure to store the food level to be shared by cells in the same culture place */
		int *food_to_share = (int *)malloc( sizeof(int) * num_cells );
#ifdef DEVELOPMENT
		if ( food_to_share == NULL ) {
			fprintf(stderr,"-- Error allocating food_to_share structures for size: %d x %d \n", rows, columns );
			exit( EXIT_FAILURE );
		}
#endif // DEVELOPMENT
		time_end(time4_2);

		/* 4.3. Cell movements */
		time_start();
		for (i=0; i<num_cells; i++) {
			if ( cells[i].alive ) {
				cells[i].age ++;
				// Statistics: Max age of a cell in the simulation history
				if ( cells[i].age > sim_stat.history_max_age ) sim_stat.history_max_age = cells[i].age;

				/* 4.3.1. Check if the cell has the needed energy to move or keep alive */
				if ( cells[i].storage < ENERGY_NEEDED_TO_LIVE ) {
					// Cell has died
					cells[i].alive = false;
					num_cells_alive --;
					step_dead_cells ++;
					continue;
				}
				if ( cells[i].storage < ENERGY_NEEDED_TO_MOVE ) {
					// Almost dying cell, it cannot move, only if enough food is dropped here it will survive
					cells[i].storage -= ENERGY_SPENT_TO_LIVE;
				}
				else {
					// Consume energy to move
					cells[i].storage -= ENERGY_SPENT_TO_MOVE;
						
					/* 4.3.2. Choose movement direction */
					int prob = int_urand48( PRECISION, cells[i].random_seq );
					if ( prob < cells[i].choose_mov[0] ) {
						// Turn left (90 degrees)
						int tmp = cells[i].mov_col;
						cells[i].mov_col = cells[i].mov_row;
						cells[i].mov_row = -tmp;
					}
					else if ( prob >= cells[i].choose_mov[0] + cells[i].choose_mov[1] ) {
						// Turn right (90 degrees)
						int tmp = cells[i].mov_row;
						cells[i].mov_row = cells[i].mov_col;
						cells[i].mov_col = -tmp;
					}
					// else do not change the direction
					
					/* 4.3.3. Update position moving in the choosen direction*/
					cells[i].pos_row += cells[i].mov_row;
					cells[i].pos_col += cells[i].mov_col;
					// Periodic arena: Left/Rigth edges are connected, Top/Bottom edges are connected
					if ( cells[i].pos_row < 0 ) cells[i].pos_row += rows * PRECISION;
					if ( cells[i].pos_row >= rows * PRECISION) cells[i].pos_row -= rows * PRECISION;
					if ( cells[i].pos_col < 0 ) cells[i].pos_col += columns * PRECISION;
					if ( cells[i].pos_col >= columns * PRECISION) cells[i].pos_col -= columns * PRECISION;
				}

				/* 4.3.4. Annotate that there is one more cell in this culture position */
				accessMat( culture_cells, cells[i].pos_row / PRECISION, cells[i].pos_col / PRECISION ) += 1;
				/* 4.3.5. Annotate the amount of food to be shared in this culture position */
				food_to_share[i] = accessMat( culture, cells[i].pos_row / PRECISION, cells[i].pos_col / PRECISION );
			}
		} // End cell movements
		time_end(time4_3);
		
		/* 4.4. Cell actions */
		time_start();
		// Space for the list of new cells (maximum number of new cells is num_cells)
		Cell *new_cells = (Cell *)malloc( sizeof(Cell) * num_cells );
#ifdef DEVELOPMENT
		if ( new_cells == NULL ) {
			fprintf(stderr,"-- Error allocating new cells structures for: %d cells\n", num_cells );
			exit( EXIT_FAILURE );
		}
#endif // DEVELOPMENT

		for (i=0; i<num_cells; i++) {
			if ( cells[i].alive ) {
				/* 4.4.1. Food harvesting */
				int food = food_to_share[i];
				int count = accessMat( culture_cells, cells[i].pos_row / PRECISION, cells[i].pos_col / PRECISION );
				int my_food = food / count;
				cells[i].storage += my_food;

				/* 4.4.2. Split cell if the conditions are met: Enough maturity and energy */
				if ( cells[i].age > 30 && cells[i].storage > ENERGY_NEEDED_TO_SPLIT ) {
					// Split: Create new cell
					num_cells_alive ++;
					sim_stat.history_total_cells ++;
					step_new_cells ++;

					// New cell is a copy of parent cell
					new_cells[ step_new_cells-1 ] = cells[i];

					// Split energy stored and update age in both cells
					cells[i].storage /= 2;
					new_cells[ step_new_cells-1 ].storage /= 2;
					cells[i].age = 1;
					new_cells[ step_new_cells-1 ].age = 1;

					// Random seed for the new cell, obtained using the parent random sequence
					new_cells[ step_new_cells-1 ].random_seq[0] = (unsigned short)glibc_nrand48( cells[i].random_seq );
					new_cells[ step_new_cells-1 ].random_seq[1] = (unsigned short)glibc_nrand48( cells[i].random_seq );
					new_cells[ step_new_cells-1 ].random_seq[2] = (unsigned short)glibc_nrand48( cells[i].random_seq );

					// Both cells start in random directions
					cell_new_direction( &cells[i] );
					cell_new_direction( &new_cells[ step_new_cells-1 ] );
				
					// Mutations of the movement genes in both cells
					cell_mutation( &cells[i] );
					cell_mutation( &new_cells[ step_new_cells-1 ] );
				}
			}
		} // End cell actions
		time_end(time4_4);

		/* 4.5. Clean ancillary data structures */
		time_start();
		/* 4.5.1. Clean the food consumed by the cells in the culture data structure */
		for (i=0; i<num_cells; i++) {
			if ( cells[i].alive ) {
				accessMat( culture, cells[i].pos_row / PRECISION, cells[i].pos_col / PRECISION ) = 0;
			}
		}
		/* 4.5.2. Free the ancillary data structure to store the food to be shared */
		free( food_to_share );
		time_end(time4_5);

		/* 4.6. Clean dead cells from the original list */
		time_start();
		// 4.6.1. Move alive cells to the left to substitute dead cells
		int free_position = 0;
		int alive_in_main_list = 0;
		for( i=0; i<num_cells; i++ ) {
			if ( cells[i].alive ) {
				alive_in_main_list ++;
				if ( free_position != i ) {
					cells[free_position] = cells[i];
				}
				free_position ++;
			}
		}
		// 4.6.2. Reduce the storage space of the list to the current number of cells
		num_cells = alive_in_main_list;
		cells = (Cell *)realloc( cells, sizeof(Cell) * num_cells );
		time_end(time4_6);

		/* 4.7. Join cell lists: Old and new cells list */
		time_start();
		if ( step_new_cells > 0 ) {
			cells = (Cell *)realloc( cells, sizeof(Cell) * ( num_cells + step_new_cells ) );
			for (j=0; j<step_new_cells; j++)
				cells[ num_cells + j ] = new_cells[ j ];
			num_cells += step_new_cells;
		}
		free( new_cells );
		time_end(time4_7);

		/* 4.8. Decrease non-harvested food */
		time_start();
		current_max_food = 0;
		for( i=0; i<rows; i++ )
			for( j=0; j<columns; j++ ) {
				accessMat( culture, i, j ) -= accessMat( culture, i, j ) / 20;
				if ( accessMat( culture, i, j ) > current_max_food ) 
					current_max_food = accessMat( culture, i, j );
			}
		time_end(time4_8);

		/* 4.9. Statistics */
		time_start();
		// Statistics: Max food
		if ( current_max_food > sim_stat.history_max_food ) sim_stat.history_max_food = current_max_food;
		// Statistics: Max new cells per step
		if ( step_new_cells > sim_stat.history_max_new_cells ) sim_stat.history_max_new_cells = step_new_cells;
		// Statistics: Accumulated dead and Max dead cells per step
		sim_stat.history_dead_cells += step_dead_cells;
		if ( step_dead_cells > sim_stat.history_max_dead_cells ) sim_stat.history_max_dead_cells = step_dead_cells;
		// Statistics: Max alive cells per step
		if ( num_cells_alive > sim_stat.history_max_alive_cells ) sim_stat.history_max_alive_cells = num_cells_alive;
		time_end(time4_9);


#ifdef DEBUG
		/* 4.10. DEBUG: Print the current state of the simulation at the end of each iteration */
		print_status( iter, rows, columns, culture, num_cells, cells, num_cells_alive, sim_stat );
#endif // DEBUG
	}

	print_times();
	
/*
 *
 * STOP HERE: DO NOT CHANGE THE CODE BELOW THIS POINT
 *
 */

	// CUDA stop
	cudaDeviceSynchronize();

	/* 5. Stop global time */
	ttotal = cp_Wtime() - ttotal;

#ifdef DEBUG
	printf("List of cells at the end of the simulation: %d\n\n", num_cells );
	for( i=0; i<num_cells; i++ ) {
		printf("Cell %d, Alive: %d, Pos(%f,%f), Mov(%f,%f), Choose_mov(%f,%f,%f), Storage: %f, Age: %d\n",
				i,
				cells[i].alive,
				(float)cells[i].pos_row / PRECISION, 
				(float)cells[i].pos_col / PRECISION, 
				(float)cells[i].mov_row / PRECISION, 
				(float)cells[i].mov_col / PRECISION, 
				(float)cells[i].choose_mov[0] / PRECISION, 
				(float)cells[i].choose_mov[1] / PRECISION, 
				(float)cells[i].choose_mov[2] / PRECISION, 
				(float)cells[i].storage / PRECISION,
				cells[i].age );
	}
#endif // DEBUG

	/* 6. Output for leaderboard */
	printf("\n");
	/* 6.1. Total computation time */
	printf("Time: %lf\n", ttotal );

	/* 6.2. Results: Number of iterations and other statistics */
	printf("Result: %d, ", iter);
	printf("%d, %d, %d, %d, %d, %d, %d, %f\n", 
		num_cells_alive, 
		sim_stat.history_total_cells, 
		sim_stat.history_dead_cells, 
		sim_stat.history_max_alive_cells, 
		sim_stat.history_max_new_cells, 
		sim_stat.history_max_dead_cells, 
		sim_stat.history_max_age,
		(float)sim_stat.history_max_food / PRECISION
	);

	/* 7. Free resources */	
	free( culture );
	free( culture_cells );
	free( cells );

	/* 8. End */
	return 0;
}
