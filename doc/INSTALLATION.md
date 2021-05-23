# Hermes Installation Guide

This guide will help you go through the process of setting up a Discord bot that runs Hermes, from the ground up. The only prerrequisites needed are a Discord account and instant invite creation privileges on the server you want to use Hermes.

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

A bot can only join servers you can manage (as per the "Manage guild" permission). So make sure you have the correct role on the server before attempting to join the bot.

 1. On the Discord Developer Portal, access "OAuth2".
 2. Scroll down. On "Scopes", select "bot".
 3. Scroll down more. On "Bot permissions", select all the permissions needed for the bot to work. The default permissions for any user should be fine.
 4. Scroll up just a bit. Copy the URL generated at the bottom of the "Scopes" box.
 5. Access the URL copied. Select the server you want the bot to join. Click "Continue", then "Authorize".

After this, your bot will have succesfully joined the specified server.

## Installing Hermes <a name=install></a>
 1. Install [Node.js](https://nodejs.org/en/). This can be done via the webpage, apt (although it will probably host an outdated version), or from [NodeSource repository](https://github.com/nodesource/distributions#debinstall). The latter is recommended, as it is the option we've had the least problems with.
 2. Verify npm has been installed with Node.js by running on a terminal:
 ```
 npm --version
 ```
 3. Install python2. (Yes, python**2**. It's not my fault.)
 4. Make sure the DNS lookup service for your system is working fine; specifically, for the URLs `cdn.discordapp.com` and `discord.com`. In case of doubt, configure your system to automatically resolve those hostnames to their specific IP addresses, without consulting its DNS server. You can check their respective IP addresses by running on a terminal:
 ```sh
 host cdn.discordapp.com
 ```
 and
 ```sh
 host discord.com
 ```
 5. Donwload the source code for the latest version of **Hermes** from its [GitHub releases' page](https://github.com/0xb01u/Cerberus/releases). Place/extract it where you want the bot's working directory to be.
 6. Open a terminal on your bot's working directory. Execute:
 ```
 npm install
 ```
 7. Create a JSON file `env.json`, with the following elements and the corresponding values:
   * "TOKEN": your bot's **token**, between quotation marks.
   * "PRE": the command preffix, between quotation marks. This is the **substring** any message must start with to be considered a command. For example, if the value of this field is `"!"`, `!team join` will be a valid command.
   * "TEAM_CAPACITY": the number of members a team of student must have exactly. Currently, different sized teams are not automatically supported.
   * "TEAM_PRE": the prefix for the team's identifiers, between quotation marks. For example, if you want the teams to be identified as g01, g02, g03..., this should be "g".
   * "BOT_CHANNEL": the name of the server's private channel dedicated for special bot admin commands and activity monitoring.
   * "LB_CHANNEL": the name of the server's public channel dedicated to leaderboard visualization.
   * "NOTIFY_LEADERS": (boolean) whether to publicly and privately notify the top teams on the leaderboards of when their position changes (true) or not (false).
   * "LEADERS": amount of top teams susceptible to position notifications (see NOTIFY_LEADERS).
   * "PUBLIC_NOTIFY": (boolean) whether to post the notifications in a server's public channel (true), or just notify the students privately (false).
   * "BOT_NEWS": the name of the server's public channel where news and notifications such as position updates should be sent, if any.
   * "COLUMN_SEPARATOR": the field separator for multi-field columns in leaderboard visualizations. This is used when visualizing more than 3 fields of a leaderboard: the remaining fields will be grouped in the last column, separated by this.

An example for such a file would be:
 ```json
 {
 	"TOKEN": ________________,
 	"PRE": "!",
 	"TEAM_CAPACITY": 1,
 	"TEAM_PRE": "g",
 	"BOT_CHANNEL": "bot",
 	"LB_CHANNEL": "leaderboards",
 	"NOTIFY_LEADERS": true,
 	"LEADERS": 10,
 	"PUBLIC_NOTIFY": true,
 	"BOT_NEWS": "bot",
 	"COLUMN_SEPARATOR": " - "
 }
 ```
 For that bot, all commands would start with "!", team IDs would start with "g", teams would be of just 1 person, and the special private bot channel in the server would be #bot. The server's channel where the leaderboards would be shown would be #leaderboards, and the top 10 teams of each leaderboard would be notified whenever any team made their position change. Notifications would be posted publicly on the channel #bot. Multi-field columns in the leaderboards visualization will be separed with " - " (e.g: Score1 - Score2 - Time).
 8. Place the corresponding Python client in the directory `tools/`, named simply `client` (without extension). If there's already a `client` file in the directory `tools/`, replace it with the desired one.
 9. Execute `run.sh` on the bot's working directory. `run.sh` just contains:
 ```sh
 nohup node . >> output.log 2>> err.log &
 ```

There it is! Your bot up and running!
