exports.run = async (bot, msg, args, serverID) => {
	if (msg.channel.type !== "dm") {
		let reply = await msg.reply("this command can only be used via DM. Message me directly!");
		//reply.delete({ timeout: 10000 });
		//msg.delete({ timeout: 10000 });
	}

	let student = global.getStudent(msg.author.id);

	if (args.length != 1 && !(args.length == 2 && serverID == null)) {
		return msg.reply(
			`Usage: \`${process.env.PRE}alias <serverAlias> <newAlias>\`\n` +
			`The server's name, replacing all spaces with underscores (\`_\`), ` +
			`is a default \`<serverAlias>\`.`
		);
	}

	if (serverID == null && !(args[0] in student.aliases) && !(args[1] in student.aliases)) {
		return msg.reply(
			`Neither ${args[0]} nor ${args[1]} are currently a server alias. ` +
			`One of them must be a current server alias, and the other a new alias ` +
			`for the same server.\n` +
			`Send \`${process.env.PRE}alias\` for help.`
		);
	}

	if (serverID != null) {
		student.addRawAlias(serverID, args[0]);

		return msg.channel.send(
			`Added ${args[0]} as an alias for ${msg.content.split(" ")[1]}`
		);
	} else {
		let newAlias = args[0] in student.aliases ? args[1] : args[0];
		let oldAlias = args[0] in student.aliases ? args[0] : args[1];
		student.addAlias(oldAlias, newAlias);

		return msg.channel.send(
			`Added ${newAlias} as another alias for ${oldAlias}.`
		);
	}
}
