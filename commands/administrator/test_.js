const fs = require("fs");
const { execSync } = require("child_process");

/**
 * Send a program to the client.
 */	
exports.run = async (bot, msg, args, file) => {
	let student = global.getStudent(msg.author.id);

	let line = ``;
	// Check if the last valid command should be used:
	if (args.length == 1 && (args[0] === "last" || args[0] === "l")) {
		// Check if there's a last command saved:
		if (student.latestClientCommand === null) {
			return msg.reply(
				`**Error**: I don't have any record of any previous command, ` +
				`so I cannot guess where you are trying to send it.`
			);
		}
		line = student.latestClientCommand;

	} else {
		if (args.include("-u") || args.include("-q") || args.include("--")) {
			line = args.join(" ").split("--")[0];
		}

		// Check if user and password were BOTH sent or not sent:
		if ((!args.include("-u") && args.include("-x"))
			|| (args.include("-u") && !args.include("-x"))) {
			return msg.reply(
				`**Error**: You must specify both an username (-u) `+
				`and a password (-x) when sending a program to the queue.`
			);
		// Check and use default user and password:
		} else if ((!args.include("-u"))) {
			let credentials = student.credentials[student.preferredServer];
			line += ` -u ${credentials.team} -x ${credentials.passwd} `
		}

		// Check if no queue was provided and there's no default one.
		if (!args.include("-q") && student.preferredQueue === null) {
			return msg.reply(
				`**Error**: You must specify a queue to send the program to.`
			);
		// Check and use default queue:
		} else if (!args.include("-q")) {
			line += ` -q ${student.preferredQueue} `;	
		}

		// Reconstruct the client command:
		if (!args.include("-u") && !args.include("-q") && !args.include("--")) {
			line += ` -- ${args.join(" ")}`;
		} else {
			line += args.join(" ").split("--")[1] == null ? `` : `--${args.join(" ").split("--")[1]}`;
		}
	}

	// Send the program to the corresponding queue:
	try {
		console.log(`python2 ./tools/client ./programs/${file} ${line}`);
		let oùtput = execSync(`python2 ./tools/client ./programs/${file} ${line}`);
		fs.unlinkSync(`./programs/${file}`);
		student.setCommand(line);
		msg.reply(`Sent: \`${line}\`\n` + output.toString());
	} catch (exc) {
		fs.unlinkSync(`./programs/${file}`);
		msg.reply(
			`**Error while sending the program to the queue:**\n${exc.stderr.toString()}`
		);
	}
}
