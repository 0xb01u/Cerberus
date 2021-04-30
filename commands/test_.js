const fs = require("fs");
const { execSync } = require("child_process");

server = "";

/**
 * Send a program to the client.
 */	
exports.run = async (bot, msg, args, file) => {
	let student = global.getStudent(msg.author.id);

	let line = ``;
	// Check if the last valid command should be used:
	if (args.length == 1 && (args[0] === "last" || args[0] === "l")) {
		// Check if there's a last command saved:
		if (student.latestClientCommand == null) {
			return msg.reply(
				`**Error**: I don't have any record of any previous command, ` +
				`so I cannot guess where you are trying to send it.`
			);
		}
		line = student.latestClientCommand;

	} else {
		/* DEFAULT ARGUMENTS COMPLETION */

		// Check if user and password were BOTH sent or not sent:
		if ((!args.includes("-u") && args.includes("-x"))
			|| (args.includes("-u") && !args.includes("-x"))) {
			return msg.reply(
				`**Error**: You must specify both an username (-u) ` +
				`and a password (-x) when sending a program to the queue.`
			);
		// Check and use default user and password:
		} else if ((!args.includes("-u"))) {
			if (!student.preferredServer in student.credentials) {
				return msg.reply(
					`**Error**: You must join a team before launching any request.`
				);
			}
			let credentials = student.credentials[student.preferredServer];
			if (credentials.passwd == null || credentials.passwd == "null") {
				return msg.reply(
					`**Error**: You have no password set for ${credentials.team} yet.`
				);
			}
			line = ` -u ${credentials.team} -x ${credentials.passwd} ` + line;
		}

		// Check if no queue was provided and there's no default one.
		if (!args.includes("-q") && student.preferredQueue == null) {
			return msg.reply(
				`**Error**: You must specify a queue to send the program to.`
			);
		// Check and use default queue:
		} else if (!args.includes("-q")) {
			line = ` -q ${student.preferredQueue} ` + line;
		}

		// Reconstruct the client command:
		line += ` ${args.join(" ")}`;
	}

	// Fetch request server:
	let server = "";
	for (let id of student.guilds) {
		if (id in student.credentials && line.includes(student.credentials[id].team)
			&& line.includes(student.credentials[id].passwd)) {
			server = id;
			break;
		}
	}

	// Send the program to the corresponding queue:
	try {
		// Add Hermes identification to files, for clout 😎
		if (file.endsWith(".c") || file.endsWith(".cu") || file.endsWith(".cpp")) {	// TODO: .asm?
			let program = fs.readFileSync(`./programs/${file}`).toString();
			program = `# // Sent by Hermes, the Messenger, from whence Discord reigns.\n` + program;
			fs.writeFileSync(`./programs/${file}`, program);
		}

		//console.log(`python2 ./tools/client ./programs/${file} ${line}`);
		let output = execSync(`python2 ./tools/client ./programs/${file} ${line}`);
		fs.unlinkSync(`./programs/${file}`);
		student.setCommand(line);
		let outputContent = output.toString().split("\n").filter(line => line.indexOf("ing ") < 0).join("\n");
		msg.reply(`Sent: \`${line}\`\n` + outputContent);

		if (server !== "") {
			global.log(
				msg,
				server,
				`New request:\n` +
				`Sent: \`${line}\`\n` + outputContent
			);
		}

		/* Create the request as a refreshable embed: */

		// Fetch request url:
		let outputLines = output.toString().split("\n");
		let reqURL = outputLines[outputLines.length - 2];
		if (!reqURL.startsWith("http://")) return; // Return on failed executions.

		msg.channel.startTyping();

		// Create request object:
		const Request = require("../objects/Request.js");
		let req = new Request(reqURL, server);
		let table = await req.refresh();

		// Error fetching request table:
		if (!table) {
			if (server !== "") {
				global.log(msg, server,
					"@here **ERROR:** A user's Request couldn't reach the server."
				);
			}

			throw new Error(
				"The results associated to your Request couldn't be found. " +
				"Your program probably didn't reach the server, and so it wasn't processed. " +
				"Check your Request's link to verify this information.\n\n" +
				"Please try again. If this problem persists, contact a server administrator."
			);
		}

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
		console.error(exc.stack);
		console.error(exc.message);
		if (fs.existsSync(`./programs/${file}`)) fs.unlinkSync(`./programs/${file}`);
		let errorMsg = exc.message;
		if (exc.stdout != null && exc.stdout.toString().length > 0) errorMsg += "\n" + exc.stdout.toString();
		if (exc.stderr != null && exc.stderr.toString().length > 0) errorMsg += "\n" + exc.stderr.toString();
		msg.reply(
			`**Error while sending the program to the queue.**\n${errorMsg.substring(0, 1950)}`
		);

		if (server !== "") {
			global.log(
				msg,
				server,
				`**Error while sending a request.**\n${errorMsg.substring(0, 1965)}`
			);
		}
	}
}
