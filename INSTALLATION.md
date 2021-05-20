# Instructions to install Cerberus

## Table of contents
 1. [Creating a bot](#create)
   1.1. [Deleting a bot](#delete)
 2. [Making the bot join a server](#join)
 3. [Installing Cerberus](#install)

## Creating a bot <a name=create></a>

These are the steps needed to create a Discord bot user and properly configure it to be able of running Cerberus.

 1. Access the [Discord Developer Portal](https://discord.com/developers/applications) and log in with your Discord account.
 2. Create a new application (top right button, "New Application"). Set the name for the application (this **won't** necessarily be the name of the bot). Click OK. 
 3. **OPTIONAL:** Add an app icon and description. These generally won't be used ever.
 4. Go to "Bot", click on "Add Bot" and confirm. Optionally but recommended, add an icon for the bot (this is the profile picture, so it will be shown on the Discord app).
 5. **The token is the key used to log in on Discord as the bot. It must be kept secret.**.Copy the **token** (click on "Copy") and save it somewhere safe, where **no one else can see it**. Tokens can be copied multiple times, in case you lose it; and a new one can be generated (click on "Regenerate"), in case someone else finds it and takes control of the bot.
 6. Scroll down the page and uncheck "Public bot". This way, only the user who is creating the app/bot will be able to join the bot on Discord servers.
 7. Scroll down a bit more and check "Server members intent". This is **needed** so that the bot can **keep track of the students** (the server's users) properly.

### Deleting an app/bot <a name=delete></a>

You can delete your app, and effectively your bot too, in the "General Information" page of your application, in the [Developer Portal](https://discord.com/developers/applications). The button is located in the bottom right of the page. You just need to enter the app name to confirm the deletion, and click on "Delete app".

## Making the bot join a server <a name=join></a>

A bot can only join servers you can manage (as per the "Manage guild" permission). So make sure you have the correct role on the server before attempting to join the bot.

 1. On the Discord Developer Portal, access "OAuth2".
 2. Scroll down. On "Scopes", select "bot".
 3. Scroll down more. On "Bot permissions", select "Administrator". This will give the bot **all the permissions** a user can have. This is mainly needed so that the bot can delete other user's messages (to not clog the text channels when they use the commands incorrectly).
 4. Scroll up just a bit. Copy the URL generated at the bottom of the "Scopes" box.
 5. Access the URL copied. Select the server you want the bot to join. Click "Continue", then "Authorize".

After this, your bot will have succesfully joined the specified server.

## Installing Cerberus <a name=install></a>
 1. Install [Node.js](https://nodejs.org/en/). This can be done via the webpage, apt (although it will probably host an outdated version), or from [NodeSource repository](https://github.com/nodesource/distributions#debinstall). The latter is recommended, as it is the option we've had the least problems with.
 2. Verify npm has been installed with Node.js by running on a terminal:
 ```
 npm --version
 ```
 3. Donwload the source code for the latest version of **Cerberus** from its [GitHub releases' page](https://github.com/0xb01u/Cerberus/releases). Place/extract it where you want the bot's working directory to be.
 4. Open a terminal on your bot's working directory. Execute:
 ```
 npm install
 ```
 5. Create the folders `./outputs/`, `./tests/`, and `./programs`, if they aren't already. Place the reference program that will generate the correct results for the tests on `./programs/`, wrapped in a `.tgz` with name `original.tgz` and a `Makefile` inside to compile it.
 6. Create a JSON file `env.json`, with the following elements and the corresponding values:
   * "TOKEN": your bot's **token**, between quotation marks.
   * "PRE": the command preffix, between quotation 
   * "PROGRAM": the name of the program to work with (no file extensions), for file and path finding, and to generate the scripts to execute the tests.
   * "SEQ_PROGRAM": name of the reference program, to generate the correct results for the tests with.
   * "REQ_CHANNEL": name of the channel used for request handling and tests execution.
   * "TIMEWALL": maximum amount of time, in milliseconds, for a test to execute.
 An example for such a file would be:
 ```json
 {
 	"TOKEN": ________________,
 	"PRE": "!",
 	"PROGRAM": "wind",
 	"SEQ_PROGRAM": "wind_original",
 	"REQ_CHANNEL": "tablon_cuda",
 	"TIMEWALL": "60000"
 }
 ```
 7. Execute `node .` on the bot's working directory. You can also make it run in background:
 ```sh
 nohup node . >> output.log 2>> err.log &
 ```

# Bugfixing

If you notice any problem with Cerberus, send me a message through Discord (B0lu#8913) describing the problem and how to replicate it. I will try to fix it as soon as possible.

# Donate

Small reminder that I have a [Ko-fi](https://ko-fi.com/0xb01u) just for this. If you find Cerberus useful, I would really appreciate any support given, as small as it might be.
