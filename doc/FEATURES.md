# Bot features

This file contains a list with the entirety of Hermes' currently supported features, as well as a moderately-in-depth explanation for all of them.

## Table of contents
 1. [Sending programs to a queue](#sending)
   1.1. [Default arguments](#default)
   1.2. [Resend last arguments](#last)
 2. [Commands](#commands)
   2.1. [set](#set)
   2.2. [config](#config)
   2.3. [alias](#alias)
   2.4. [team](#team)
 3. [Leaderboards](#leaderboards)
   3.1. [Updating the leaderboards' contents](#refresh)
 4. [Notifications on leaderboard position changes](#notifications)


## Sending programs to a queue <a name=sending></a>

To send a program to a Tablón queue, is as easy as sending the source code to the bot, via its Direct Message channel. This is, send the source code directly to the bot as a Discord user, not to any server the bot might be in. The body of the message with the source code attached must contain the request arguments. The request arguments to specify are:
 * `-u TEAM` - The team identifier.
 * `-x PASSWORD` - The password for the team.
 * `-q QUEUE` - The queue to send the program to.
 * `-- ARGS` - The arguments to execute the program with (in non-leaderboard queues).

For example, if I'd like to send my program as team "g110" with password "abcd9876" to the queue "testq", for it to execute with arguments "1 2 3", I'd fill my message with:
```
-u g110 -x abcd9876 -q testq -- 1 2 3
```

The bot will send an [embed](https://discordjs.guide/popular-topics/embeds.html) with the execution summary, as it may be seen on the corresponding webpage for the request. The information on this embed can be updated ("refreshed") by reacting or de-reacting with :arrows_counterclockwise: to the corresponding message, similar to how leaderboards work. See [the corresponding section on updating the leaderboards' contents](#refresh) for more information.

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

**This command can only be sent to the bot via Direct Message.**

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

You could also use another [alias](#alias) for the server.

**NOTE (again):** by default, Hermes will set your default server to be the very first server you join that already uses it. So, if you're just in one server using Hermes, that will be automatically set as your default server. The default queue won't be automatically set.

### config

**This command can only be sent to the bot via Direct Message.**

`config` lets you see your current default values for the request arguments. Just send:
```
!config
```

`config` can also be used as an alias for `set`. So `config server` and `config queue` are effectively equivalent to `set server` and `set queue`, respectively. (Note that `set`, without any option, is not an alias for `config` and, thus, won't do anything.)

### alias

**This command can only be sent to the bot via Direct Message.**

`alias` lets you set aliases for servers:

```
!alias HPCDiscord hpc
```

this will let you refer to the Discord `HPCDiscord` simply as `hpc`.

The name of a server with all spaces replaced by underscores (`_`) is a default alias for that server.

### team

**This command is associated to a server, and thus must be sent to a server (if possible), or must specify its associated server as its first argument (`!team [serverName] <args>`).** Unless the corresponding command cannot be sent to a server, the `serverName` will be ommited in the explanations and examples.

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
where `[serverName]` is an [alias](#alias) for the Discord server, and `[requestID]` is the identifier for the request (don't worry, Hermes will let you know exactly what to write).

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

Teams can be renamed using `rename`:

```
!team rename newCoolName
```

The name of the team will only be used on [Leaderboard visualziations](#leaderboards), and has only aesthetic effects. Team IDs will still be usable to identify and manage teams. Team IDs are immutable.

## Leaderboards

Admins can create visualizations for Tablón leaderboards hosted on the web, in a dedicated channel (specified as the environmental variable `LB_CHANNEL`). These visualizations will only show the positions, teams, and another of the leaderboard columns, at choice. The syntax to create leaderboard visualizations is:
```
!leaderboard [url] [name] [desiredFields] <description ...>
```
where
 * `[url]` is the URL of the webpage hosting the leaderboard.
 * `[name]` is the name of the leaderboard in the webpage.
 * `[desiredFields]` is the name of the fields to show in the third column, separated by '`,`', '`;`', '`/`' or '`-`'. Underscores '`_`' will be replaced with spaces, and that's the intended way to specify a field that has a space in its name.
 * `<description ...>` is an optional multiple word description. So, all the words written after `[desiredFields]`, will count as description.

As said before, these visualizations are only compatible with leaderboards from webpages using Tablón. Both the URL and the name are needed to locate the desired leaderboard.

Examples of valid commands are:
```
!leaderboard http://frontendv.infor.uva.es:8080/leaderboards cudalb Time Leaderboard CUDA para la Simulacion de la Evolución.
!leaderboard http://frontendv.infor.uva.es:8080/leaderboards mpilb_score Total Leaderboard MPI para la Simulacion de la Evolución, con clasificación por puntos.
!leaderboard http://tablon-aoc.infor.uva.es:8080/leaderboards lb_mars IC,Cod,Score Check the program with a set of unknown reference inputs, to rank the program.
```

Leaderboard are displaeyed via [message embeds](https://discordjs.guide/popular-topics/embeds.html). Due to Discord limitations, various embeds will probably be needed to represent one leaderboard (as embeds can only contain up to 25 fields, approximately 8 rows of data), so a visualization will probably need to be split among various messages. Other Discord limitations include: limiting the number of "real columns" to 3, having to have so much space between rows, and having to show the leaderboard's description in all embeds, so their width is the same. (Well, at least is better than nothing.)

### Updating the leaderboards' contents <a name=refresh></a>

Leaderboard visualizations are not updated ("refreshed") automatically. All Discord users (students and admins) can **refresh leaderboard visualizations by reacting** or de-reacting to any of the messages composing them with :arrows_counterclockwise:. The bot will re-fetch the leaderboard, re-create the embeds, and edit the corresponding messages with updated values. While updating a leaderboard, the bot will appear to be writing on the chat until the information is up to date; so trying to refresh while the bot appears writing on the chat is useless and discouraged. Also, the leaderboards will constantly show the date of the last time the information was updated, up to the minutes, in the bottom of each embed composing them. To avoid high network load and the bot malfunctioning, refreshes will only be processed as frequently as once every 10 seconds.

## Notifications on leaderboard position changes <a name=notifications></a>

The bot can notify all members of the teams whenever their position on a certain leaderboard changes, if the environmental variable `"NOTIFY_LEADERS"` is set to true (in `env.json`). The amount of teams considered to be notified can be set with the environmental variable `"LEADERS`". "Positive" changes (that is, improving their position) would be notified publicly in a server's dedicated channel (set in the environmental variable `"BOT_NEWS"`), and "negative" changes (that is, having any other team surpassing their position) would be notified privately via DM. Public notifications are turned on by setting the environmental variable `"NOTIFY_LEADERS"` to true.
