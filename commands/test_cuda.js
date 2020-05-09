const fs = require("fs");
const { execSync } = require("child_process");

exports.run = async (bot, msg) => {
	bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });

	let output_msg = await msg.reply(`test results:`);
	let output = `<@${msg.member.id}>, tests results:`;

	try {
		execSync(`cd ./programs; make`);
	} catch (exc) {
		fs.unlinkSync(`./programs/${process.env.PROGRAM}`);

		bot.user.setPresence({ activity: {name: ``}, status: `online` });

		return update(output_msg, output, `\nCOMPILATION ERROR:\n ${exc.stderr}\n`);
	}

	fs.unlinkSync(`./programs/${process.env.PROGRAM}`);

	let tests = fs.readdirSync("./tests/");
	for (i = 0; tests.includes(`${i}.sh`); i++) {
		let result = "";
		try {
			result = execSync(`./tests/${i}.sh`).toString();
		} catch (exc) {
			execSync(`cd ./programs; make clean`);

			bot.user.setPresence({ activity: {name: ``}, status: `online` });

			let current = fs.readFileSync(`./tests/${i}.sh`).toString();
			return update(output_msg, output, `\nTest ${i + 1}: EXECUTION ERROR:\n`
				+ `${exc.stderr}\n\nTest was: ${current.substring("./programs/".length)}\n`);
		}

		fs.writeFileSync(`./outputs/${i}.txt`, result);

		try {
			execSync(`diff ./outputs/o${i}.txt ./outputs/${i}.txt`);
		} catch (exc) {

			let lines = exc.stdout.toString().split("\n");

			if (lines[0] != "2c2") {
				let current = fs.readFileSync(`./tests/${i}.sh`).toString();

				let msg_update = await update(output_msg, output, 
					`\n**Test ${i + 1}**: Failed.\n\n`
					+ `Expected: ${lines[2].substring(10)}\n`
					+ `Got: ${lines[5].substring(10)}\n\n`
					+ `Test was: ${current.substring("./programs/".length)}\n`);
				output_msg = msg_update.msg;
				output = msg_update.content;
			} else {
				let msg_update = await update(output_msg, output,
					`\n**Test ${i + 1}**: Passed \b\n`
					+ `${lines[3].substring(2)}\n`);
				output_msg = msg_update.msg;
				output = msg_update.content;
			}
		}
		fs.unlinkSync(`./outputs/${i}.txt`);
	}

	bot.user.setPresence({ activity: {name: ``}, status: `online` });

	execSync(`cd ./programs; make clean`);
}

async function update(msg, original, addon) {
	let new_content = original + addon;

	if (new_content.length > 2000) {
		addon = original.split("\n")[0] + " (continued)\n" + addon;
		let new_msg = await msg.channel.send(addon);

		return { msg: new_msg, content: addon };
	} else {
		await msg.edit(new_content);

		return { msg: msg, content: new_content };
	}
}
