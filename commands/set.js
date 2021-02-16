const fs = require("fs");

exports.run = async (bot, msg, args) => {
	if (msg.channel.type !== "dm")  {
		let reply = await msg.reply("this command can only be used via DM. Message me directly!");
		reply.delete({ timeout: 10000 });
		msg.delete({ timeout: 10000 });
	}

	if (args.length < 1) {
		return msg.reply("please, choose what option you want to set:\n"
			+ `\`${process.env.PRE}set [server|queue]\`\n\n`
			+ `Use \`${process.env.PRE}set help\` for help`);
	}

	let user = msg.author.id;
	let student = global.getStudent(user);

	switch (args[0]) {
		case "server":
			let serverName = args[1];
			let guildMap = JSON.parse(fs.readFileSync(`./guilds/guildMap.json`));
			if (!(serverName in guildMap)) {
				return msg.reply(
					`I can't find a server with the name ${serverName} on my list. ` +
					`Are you sure that's the correct name? ` +
					`Did you remember to replace the spaces " " in the name with underscores "_"?`
				);
			}
			console.log(guildMap, serverName, guildMap[serverName], student.credentials);
			if (!(guildMap[serverName] in student.credentials)) {
				return msg.reply(
					`Looks like you're trying to set your default server to ` +
					`a server you're not a member of... ` +
					`(Or maybe you don't have a team associated to that server yet.)\n` +
					`If you think this is an error, please contact a server administrator.`
				);
			}

			student.setServer(guildMap[serverName]);
			return msg.author.send(
				`Succesfully changed your default server to ${serverName}`
			);

		case "queue":
			student.setQueue(args[1]);
			return msg.author.send(
				`Succesfully changed your default queue to ${args[1]}.`
			);

		case "help":
			return msg.author.send(`Usage: \`${process.env.PRE}set [server|queue]\`\n\n`
			+ "`server` sets the your default server to send programs to. "
			+ "That means, I will automatically know with which credentials (team and password) "
			+ "I will have to send your programs, if you have that configured!\n"
			+ "(If you're just in one server that uses me, it should be automatically set, "
			+ "and you shouldn't worry about nor try to change this.)\n\n"
			+ "`queue` sets the default queue to send programs to. "
			+ "So you won't need to write `-q [queue]` all the time!\n\n"
			+ "If you send a program specifying any option (team, password or queue) "
			+ "different than the default ones, I will use those ones and not the defaults!");
			
		default:
			return msg.author.send("I don't recognize that option :(\n"
				+ `Use \`${process.env.PRE}set help\` for help.`)
	}
}
