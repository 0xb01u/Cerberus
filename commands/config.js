exports.run = async (bot, msg, args) => {
	if (msg.channel.type !== "dm") {
		let reply = await msg.reply("this command can only be used via DM. Message me directly!");
		//reply.delete({ timeout: 10000 });
		//msg.delete({ timeout: 10000 });
		return;
	}

	if (args.length > 0) {
		return require("./set.js").run(bot, msg, args);
	} else {
		let user = msg.author.id;
		let student = global.getStudent(user);

		return msg.reply(
			"Your current configuration is:\n" +
			` - Default server: ${bot.guilds.cache.get(student.preferredServer).name}\n` +
			(student.preferredServer in student.credentials ?
				`   + Team: ${student.credentials[student.preferredServer].team}\n` + 
				(student.credentials[student.preferredServer].passwd != null ?
					`   + Password: ${student.credentials[student.preferredServer].passwd}\n` :
						``) :
					``) +
			(student.preferredQueue != null ?
				` - Default queue: ${student.preferredQueue}\n` :
				``)
		);
	}
}
