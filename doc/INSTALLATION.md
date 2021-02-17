# Hermes Installation Guide

This guide will help you go through the process of setting up a Discord bot that runs Hermes, from the ground up. The only prerrequisites needed are a Discord account and administrator privileges on the server you want to use Hermes.

## Table of contents
 1. [Creating a bot](#create)
   1.1. [Deleting a bot](#delete)
 2. [Making the bot join a server](#join)
 3. [Installing Hermes](#install)

## Creating a bot <a name=create></a>

These are the steps needed to create a Discord bot user and properly configure it to be able of running Hermes.

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

A bot can only join servers you can create instant invites to. So make sure you have the correct role on the server before attempting to join the bot.

 1. On the Discord Developer Portal, access "OAuth2".
 2. Scroll down. On "Scopes", select "bot".
 3. Scroll down more. On "Bot permissions", select "Administrator". This will give the bot **all the permissions** a user can have. This is mainly needed so that the bot can delete other user's messages (to not clog the text channels when they use the commands incorrectly), and in case in any future version some fancy feature needs other permissions. The bot might be able to work with just "Send Messages", "Manage Messages" and "Embed Links", although this has not been tested yet.
 4. Scroll up just a bit. Copy the URL generated at the bottom of the "Scopes" box.
 5. Access the URL copied. Select the server you want the bot to join. Click "Continue", then "Authorize".

After this, your bot will have succesfully joined the specified server.

## Installing Hermes <a name=install></a>
 1. Install [Node.js](https://nodejs.org/en/). This can be done via the webpage, apt (although probably an outdated version), or from [NodeSource repository](https://github.com/nodesource/distributions#debinstall). The latter is recommended, as is the option I've had the least problems with.
 2. Verify npm has been installed with Node.js by running on a terminal:
 ```
 npm --version
 ```
 3. Install python2. (Yes, python**2**. It's not my fault.)
 4. Donwload the source code for the latest version of **Hermes** from its [GitHub releases' page](https://github.com/0xb01u/Cerberus/releases). Place/extract it where you want the bot's working directory to be.
 5. Open a terminal on your bot's working directory. Execute.
 ```
 npm install
 ```
 6. Create a JSON file `env.json`, with the following elements and the corresponding values:
   * "TOKEN": your bot's **token**, between quotation marks.
   * "PRE": the command preffix, between quotation marks. This is the **substring** any message must start with to be considered a command. For example, if the value of this field is `"!"`, `!team join` will be a valid command.
   * "TEAM_CAPACITY": the number of members a team of student has to have exactly. Currently, different sized teams are not supported.
   * "TEAM_PRE": the prefix for the team's identifiers, between quotation marks. For example, if you want the teams to be identified as g01, g02, g03..., this should be "g".
   * "BOT_CHANNEL": the name of the server's private channel dedicated for special bot commands and activity monitoring.
 An example for such a file would be:
 ```json
 {
 	"TOKEN": ________________,
 	"PRE": "!",
 	"TEAM_CAPACITY": 1,
 	"TEAM_PRE": "g",
 	"BOT_CHANNEL": "bot"
 }
 ```
 For that bot, all commands would start with "!", team IDs would start with "g", teans would be of just 1 person, and the special private bot channel in the server would be #bot.
 7. Execute `run.sh` on the bot's working directory. `run.sh` just contains:
 ```sh
 nohup node . > output.log 2> err.log &
 ```

There it is! Your bot up and running!
