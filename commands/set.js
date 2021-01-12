const fs = require("fs");

exports.run = async (bot, msg, args, ..._) => {
	if (msg.channel.type !== "dm") return;	// TODO: warn?

	let user = msg.author.id;
	let student = global.getStudent(user);

	// TODO: check args length.
	switch (args[0]) {
		case "server":
			let serverName = args[1];
			let guildMap = JSON.parse(`./guilds/guildMap.json`);
			if (!(serverName in guildMap)) {
				return msg.reply(
					`I can't find a server with the name ${serverName} on my list. ` +
					`Are you sure that's the correct name? ` +
					`Did you remember to replace the spaces " " in the name with underscores "_"?`
				);
			}
			if (!(guildMap[serverName] in student.credentiasl)) {
				return msg.reply(
					`Looks like you're trying to set your default server to ` +
					`a server you're not a member of...` +
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
		// TODO: add default.
	}
}
