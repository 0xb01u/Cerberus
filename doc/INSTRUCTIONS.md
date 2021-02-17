# Hermes instructions

This file includes some instructions for using Hermes' different features, with the intention of being as concise and simple as possible. For detailed features, see [FEATURES.md](./FEATURES.md).

## Table of contents
 1. [Sending programs to Tablón](#sending)
 2. [Using commands](#commands)
 3. [Using teams](#team)
   3.1. [Creating a team](#create)
   3.2. [Joining a team](#join)
   3.3. [Accepting a team membership request](#accept)
   3.4. [Rejecting a team membership request](#reject)
   3.5. [Leaving a team before it's full](#leave)
   3.6. [Setting the team's password](#pass)
   3.7. [Team conformation overview](#team_overview)
 4. [Setting default arguments](#default)
   4.1. [Setting your default team and password](#default_server)
   4.2. [Setting your default queue](#default_queue)
   4.3. [Default default arguments](#default_default)
   4.4. [Default arguments review](#config)

## Sending programs to Tablón <a name=sending></a>

To send a program to Tablón, just send the source code for the program to the bot **via Direct Message**, specifying in the same message the request arguments: team, password, queue, and program arguments, using the format:

```
-u [TEAM] -x [PASSWORD] -q [QUEUE] -- [ARGS]
```
For example:
```
-u g110 -x abcd9876 -q testq -- 1 2 3
```

If you have set any [default arguments](./FEATURES.md#default), you might not include those in the message, although you can if you want to override the default ones. You can also just write `last` or `l` to execute exactly the last request arguments.

## Using commands <a name=commands></a>

All commands start with a predefined prefix. One of the most common prefixes is the character `!`, and that's the one we'll be using throughout this file. So, the general command format is:
```
!command <args>
```
where `args` are the maybe optional arguments for the command.

Some commands must be associated to a server. In that case, one of two options:
 - A command must be executed inside a Discord server (some commands **can't**; these will be specified).
 - A command must specify the name of the server it is associated to, before any other argument. As spaces are used as argument separators, any space included in the server name must be replaced by a underscore (`_`).

Thus, the command **format for Discord servers** will generally be:
 ```
!command <args>
```
(for example:)
```
!team join g110
```

And when using the commands **on the bot's Direct Message channel**, it will be:
```
!command [serverName] <args>
```
(for example:)
```
!team Discord_Server join g110
```

**For simplicity, any time a command that can be used in a Discord server is explained or exemplified in this file, the server name will be ommited.**

## Using teams <a name=team></a>

### Creating a team <a name=create></a>

To create a new team in the server, you can use [the command `team`](./FEATURES.md#team):
```
!team join
```
A new team will be generated, and a team ID will be assigned to it.

### Joining a team <a name=join></a>

To join an already existing team, use:
```
!team join [teamID]
```
This will create an send a request to all the team members.

### Accepting a team membership request <a name=accept></a>

**Direct message only:** to accept a team join request, reply to the bot properly:
```
!team [serverName] accept [requestID]
```

### Rejecting a team membership request <a name=reject></a>

**Direct message only:** you can also reject the request:
```
!team [serverName] reject [requestID]
```

### Leaving a team before it's full <a name=leave></a>

You can also leave a team, as long as it hasn't reached it's maximum capacity yet:
```
!team leave
```

### Setting the team's password <a name=pass></a>

The team's password will be set by a system administrator. The user doesn't have to worry about this.

### Team conformation overview <a name=team_overview></a>

The regular team-conformation cycle, from its creation to its completeness, would be:
 1. Some user creates a team (`!team join`).
 2. Ohter users request to join the team (`!team join [teamID]`).
 3. The team members accept or reject the membership requests (`!team [serverName] accept/reject [requestID]`).
 4. When the team gets full, it becomes immutable.
 5. The corresponding system administrator provides the password for the team.

## Setting default arguments <a name=default></a>

**Direct message only.**

To set default request arguments, you can use [the command `set`](./FEATURES.md#set). You can set your default `server` (team and password all at once) and your default `queue`.

### Setting your default team and password <a name=default_server></a>

To set your default team and password, you can set your default server:
```
!set server [serverName]
```
You must have joined a team in the server `serverName`. Remember that if there are any spaces in the server's name, `serverName` must have those replaced with underscores (`_`).

### Setting your default queue <a name=default_queue></a>

To set your default queue, use:
```
!set queue [queueName]
```

### Default default arguments <a name=default_default></a>

The bot will automatically set your default server to one of the Discord servers both you and the bot are. It will not set any queue automatically.

### Default arguments review <a name=config></a>

**Direct message only.**

You can view your current default request arguments using [the command `config`](./FEATURES.md#config). Just send:

```
!config
```
