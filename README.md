# Support me

TL;DR: You can give me money here: [**Ko-fi**](https://ko-fi.com/0xb01u). I will love you more if you do! <3

I have spent countless hours working on Cerberus and Hermes, and I didn't get anything in return except my name on a paper. These (Cerberus and Hermes) have been personal projects I've developed at will, and I have **not** received any credits (ETCSs) nor financial income for working on them.

The amount of effort put into these projects has been enormous. And, for that, I'd be grateful to receive donations.

If you find Cerberus (or Hermes) useful in any way, if you think they have made Computación Paralela a better subject, I would really appreciate if you supported me through my [**Ko-fi**](https://ko-fi.com/0xb01u). It can just be a one-time donation. Any amount, as small as it might be, will be of help. Obviously, you don't need to donate if you don't want to, but I will love you more if you do <3.

Now, back with the real README.

# Cerberus - Underworld's gatekeeper

Cerberus is a Discord bot simulating [UVa's Parallel Computing's Tablón](http://frontendv.infor.uva.es/), a remote-execution system for C programs.

This bot aims to:
 - demonstrate the subject's leaderboard and Discord server could be merged/unified; or at least demonstrate the subject's Discord server could be way more useful.
 - help some students who lack the necessary hardware to test their CUDA programs.
 - save quota on Tablón.
 - build a large and sufficient shared pool of tests.
 - make time comparisons between different students' programs possible (without launching to Tablón).

For installation instructions, see [INSTALLATION.md](./INSTALLATION.md). For usage and command instructions, see [INSTRUCTIONS.md](./INSTRUCTIONS.md).

## How does it work?

Once the bot joins a Discord server, it uses specific channels as request queues. All the .tgz files containing a Makefile sent to these channels will be downloaded, compiled and test against a predefinded set of executions. The bot will reply with important information about the output, such as failed executions, failed tests and execution times.

Tests can be added and removed to the pool using commands.

Executing the programs with custom arguments, instead of against the tests, is also allowed, by providing the arguments in the Discord message properly.

### Security warning

This software doesn't provide any security measure against the programs sent to be executed, as it is only a proof of concept. Malicious software could be easily sent to try to harm the system executing the bot. **This software should be used with extreme caution and only on Discord servers you fully trust.**

### Legal stuff

This software does not support plagiarism in any form.

As a way of avoiding plagiarism, the bot will instantly delete any message sent to the request channel after downloading any .tgz file attached to it (if it's not busy executing earlier tests). The downloaded file will also be deleted as soon as it is compiled.

Individual users are responsible for their usage of this bot and any of its functionalities.
