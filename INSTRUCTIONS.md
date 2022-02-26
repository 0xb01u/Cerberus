# Instructions

This is a reference guide for Cerberus.

## Table of contents
 1. [Sending programs to execute the tests](#sending)
 2. [Adding a test](#adding)
 3. [Viewing a test](#viewing)
 4. [Deleting a test](#deleting)

## Sending programs <a name=sending></a>

To send programs, you just need to drag and drop to the requests channel (i.e. `tablon`) a `.tgz` file containing all the needed files to compile it by using just `make` (with no arguments).

You can add the following rule to the Makefile of your program to make the required tgz easily:
```
tgz:
	tar -czf <program>.tgz Makefile <source>.cu *.h
```

Just sending the `.tgz`, with nothing in the message, will execute its program against all of Cerberus' tests, giving feedback for each one of them.

Sending the `.tgz` with a message containing the character `n`, `c`, or `a` and some arguments after that character will execute its program with those arguments.

## Adding tests <a name=adding></a>

Just send the message:
```
!add <arguments for the test>
```

The bot will execute the reference program against the given arguments, and save the test and its output if executed properly.

## Viewing tests <a name=viewing></a>

You can retrieve the arguments for a given list of tests by sending the message:

```
!test <number of test> [number of second test] [number of third test] [...]
```

I.e:
```
!test 1 2 3 7 9
```

## Deleting tests <a name=deleting></a>

To delete a test, just send the message:

```
!del <number of test to delete> [number of second test] [number of third test] [...]
```

The bot will delete the tests and its outputs, and will reorder the other tests to fill the gaps.

# Bugfixing

If you notice any problem with Cerberus, open an issue in this repository describing the problem and how to replicate it. I will try to fix it as soon as possible.

# Donate

Small reminder that I have a [Ko-fi](https://ko-fi.com/0xb01u) just for this. If you find Cerberus useful, I would really appreciate any support given, as small as it might be.
