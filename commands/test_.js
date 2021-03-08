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
		/* DEFAULT ARGUMENTS COMPLETION */
		if (args.includes("-u") || args.includes("-q") || args.includes("--")) {
			line = args.join(" ").split("--")[0];
		}

		// Check if user and password were BOTH sent or not sent:
		if ((!args.includes("-u") && args.includes("-x"))
			|| (args.includes("-u") && !args.includes("-x"))) {
			return msg.reply(
				`**Error**: You must specify both an username (-u) `+
				`and a password (-x) when sending a program to the queue.`
			);
		// Check and use default user and password:
		} else if ((!args.includes("-u"))) {
			let credentials = student.credentials[student.preferredServer];
			line += ` -u ${credentials.team} -x ${credentials.passwd} `
		}

		// Check if no queue was provided and there's no default one.
		if (!args.includes("-q") && student.preferredQueue === null) {
			return msg.reply(
				`**Error**: You must specify a queue to send the program to.`
			);
		// Check and use default queue:
		} else if (!args.includes("-q")) {
			line += ` -q ${student.preferredQueue} `;	
		}

		// Reconstruct the client command:
		if (!args.includes("-u") && !args.includes("-q") && !args.includes("--")) {
			line += ` -- ${args.join(" ")}`;
		} else {
			line += args.join(" ").split("--")[1] == null ? `` : `--${args.join(" ").split("--")[1]}`;
		}
	}

	// Send the program to the corresponding queue:
	try {
		//console.log(`python2 ./tools/client ./programs/${file} ${line}`);
		let output = execSync(`python2 ./tools/client ./programs/${file} ${line}`);
		fs.unlinkSync(`./programs/${file}`);
		student.setCommand(line);
		msg.reply(`Sent: \`${line}\`\n` + output.toString());

		// Fetch request server:
		let server = "";
		for (let id of student.guilds) {
			if (id in student.credentials && line.includes(student.credentials[id].team)
				&& line.includes(student.credentials[id].passwd)) {
				server = id;
				break;
			}
		}

		global.log(
			msg,
			server,
			`New request:\n` +
			`Sent: \`${line}\`\n` + output.toString()
		);


		/* Create the request as a refreshable embed: */

		// Fetch request url:
		let outputLines = output.toString().split("\n");
		let reqURL = outputLines[outputLines.length - 2];
		if (!reqURL.startsWith("http://")) return; // Return on failed executions.

		msg.channel.startTyping();

		// Create request object:
		const Request = require("../objects/Request.js");
		let req = new Request(reqURL, server);
		await req.refresh();

		// Create and send embed:
		let embed = req.toEmbed();
		let reply;
		if (req.output !== "") {
			reply = await msg.reply(req.output, embed);
		} else {
			reply = await msg.reply(embed);
		}
		reply.react("🔄");

		msg.channel.stopTyping();
	} catch (exc) {
		msg.channel.stopTyping();
		console.log(exc.stack);
		global.log(msg, `\`\`\`\n${exc.stack}\n\`\`\``);
		if (fs.existsSync(`./programs/${file}`)) fs.unlinkSync(`./programs/${file}`);
		msg.reply(
			`**Error while sending the program to the queue.**\n${exc.stderr.toString()}`
		);
	}
}
