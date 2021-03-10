const fs = require("fs");

exports.run = async (bot, msg, args) => {
	// Server-only command:
	if (msg.channel.type === "dm") {
		return msg.author.send("That is a server-only command!");
	}

	// TODO: Role
	// "Admin"-only command:
	if (!msg.member.hasPermission("MANAGE_GUILD")) {
		return msg.reply("nice try.");
	}

	// Channel-specific command:
	if (msg.channel.name !== process.env.BOT_CHANNEL) {
		msg.delete();
		return msg.author.send(
			`Pssst! You used the \`${process.env.PRE}botconfig\` command in the wrong channel!\n`
			+ `It must be used in #${process.env.BOT_CHANNEL}.`
		);
	}

	// env.json must be accesed to show/save the configuration.
	let env = JSON.parse(fs.readFileSync("env.json"));

	/*
	 * Show current configuration (no args).
	 */
	if (args.length === 0) {
		let envCopy = Object.assign({}, env);
		envCopy.TOKEN = "=== OMITTED ===";

		delete env;
		return msg.channel.send(`Current configuration:\n\`\`\`\n${JSON.stringify(envCopy, null, 2)}\`\`\``);
	/*
	 * Change or delete a configuration field.
	 */
	} else {
		let field = args.shift().toUpperCase();

		/*
		 * Just one arg: delete field.
		 */
		if (args.length === 0) {
			if (field === "TOKEN" || field === "PRE") {
				return msg.channel.send(`I'm sorry ${msg.author.username}. I'm afraid I can't do that.`);
			}

			delete process.env[field];
			delete env[field];
			msg.channel.send(`Deleted \`${field}\` field.`);
		/*
		 * Value given: modify arg.
		 */
		} else {
			if (args.length > 1) {
				process.env[field] = args.join(" ");
				env[field] = args.join(" ");
			} else if (!isNaN(parseInt(args[0]))) {
				process.env[field] = parseInt(args[0]);
				env[field] = parseInt(args[0]);
			} else if (args[0] === "true") {
				process.env[field] = true;
				env[field] = true;
			} else if (args[0] === "false") {
				process.env[field] = false;
				env[field] = false;
			} else {
				process.env[field] = args[0];
				env[field] = args[0];
			}

			msg.channel.send(`Changed \`${field}\` field to \`${env[field]}\`.`);
		}
		
		// Save the env file:
		fs.writeFileSync("env.json", JSON.stringify(env, null, 2));
		delete env;
	}
}
