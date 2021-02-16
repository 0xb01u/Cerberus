# Bot features

This file contains a list with the entirety of Hermes' currently supported features, as well as a brief explanation for all of them.

## Table of contents
1. [Sending programs to the queue](#sending)
  1. [Default arguments](#default)
  2. [Resend last arguments](#last)
2. [Commands](#commands)
  1. [set](#set)
  2. [config](#config)
  3. [team](#team)


## Sending programs to the queue <a name=sending></a>

To send a program to a Tablón queue, is as easy as sending the source code to the bot, via its Direct Message channel. This is, send the source code directly to the bot as a Discord user, not to any server the bot might be in. The body of the message with the source code attached must contain the request arguments. The request arguments to specify are:
 * `-u TEAM` - The team identifier.
 * `-x PASSWORD` - The password for the team.
 * `-q QUEUE` - The queue to send the program to.
 * `-- ARGS` - The arguments to execute the program with (in non-leaderboard queues).

For example, if I'd like to send my program as team "g110" with password "abcd9876" to the queue "testq", for it to execute with arguments "1 2 3", I'd fill my message with:
```
-u g110 -x abcd9876 -q testq -- 1 2 3
```

### Default arguments <a name=default></a>

Using [`set`](#set) or [`config`](#config) commands (see below), you can set default request arguments for programs sent to the bot, so you don't need to specify them in the message. If these are set, you can still specify request arguments in the message with the source code attached. The specified arguments will override the default ones. So, if I had set default values for my team (and password) and queue, but I'd like to send my program to a different queue, for example, to "differentq", I could write in my message:
```
-q differentq -- 1 2 3
```

If you'd like to use all the default values, you could leave the message blank (if the program doesn't take any argument, or the default queue is a leaderboard one), you could write a doulbe hyphen and the program's arguments (for example `-- 1 2 3`), or you could just write the program's arguments directly (just `1 2 3`).

**NOTE:** by default, Hermes will set your default server to be the very first server you join that already uses it. So, if you're just in one server using Hermes, that will be automatically set as your default server. The default queue won't be automatically set.

### Resend last arguments <a name=last></a>

If you fill the message with the source code attached with `last` or `l` (for short), exactly the same request arguments used in the last request will be reused in this request, regardless of the default arguments.

## Commands <a name=commands></a>

In this section you can find a list of the commands currently supported by Hermes.

In the examples for the commands usage, the character `!` will be used as the prefix for the commands. This might or might not be the case.

### set

`set` sets default values for the [request arguments](#sending) (see above), for the user.

The current settable elements are:
 * `server` - Discord server that uses this bot and in which you have associated some credentials (team identifier and password) to send programs to Tablón.
 * `queue` - The queue to send the programs to.

You can also use `set help` for some (maybe useful) help regarding the command.

For example: If I am in a Discord server called "HPCDiscord" for an University subject that uses Tablón, I can use
```
!set server HPCDiscord
```
and my team and password for that subject will be set as the default ones to use when making requests to the bot. I could also use
```
!set queue leaderboard
```
to set my default queue for the requests to be "leaderboard" queue.

If the Discord server has any space in its name, you must replace them with underscores (`_`) when setting it as your default server. For example, if the Discord server for the University subject was called "HPC Discord" instead, I should use:
```
!set server HPC_Discord
```

**NOTE (again):** by default, Hermes will set your default server to be the very first server you join that already uses it. So, if you're just in one server using Hermes, that will be automatically set as your default server. The default queue won't be automatically set.

### config

`config` lets you see your current default values for the request arguments. Just send:
```
!config
```

`config` can also be used as an alias for `set`. So `config server` and `config queue` are effectively equivalent to `set server` and `set queue`, respectively. (Note that `set`, without any option, is not an alias for `config` and, thus, won't do anything.)

### team

`team` is used to manage teams of students.

If you want to **create a new team**, use:
```
!team join
```
Hermes will automatically generate a team ID, and notify you of which team you've joined.

(The following features are only applicable if the number of students that teams must have is greater than one.)

If you want to **join an already created team**, use:
```
!team join [teamID]
```
where `[teamID]` has to be the ID for an already created team (the ID for a non-created team won't work). This command will create a **request** to join the team. The request will be sent to all the members of the team, and they have to **accept** it for you to join the team.

Requests are accepted by sending a Direct Message to the bot with:
```
!team accept [serverName] [requestID]
```
where `[serverName]` is the name of the Discord server the team belongs to, replacing all the spaces with underscores (`_`), and `[requestID]` is the identifier for the request (don't worry, Hermes will let you know exactly what to write).

Requests are rejected by sending a Direct Message to the bot with:
```
!team reject [serverName] [requestID]
```
where `[serverName]` and `[requestID]` are as specified in the previous paragraph.

Note that **all** the members **must accept** a request for a user to join their team, but **only one rejection** is needed for the request to get denied.

Also, as long as a team hasn't reached its maximum capacity, their members can leave it by using:
```
!team leave
```
