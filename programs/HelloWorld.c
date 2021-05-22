#include <stdio.h>

int main(int argc, char const *argv[])
{
	printf("Hello world, I'm Cerberus!\n");

	for (int i = 0; i < argc; i++) printf("Arg %d is %s\n", i, argv[i]);

	return 0;
}
