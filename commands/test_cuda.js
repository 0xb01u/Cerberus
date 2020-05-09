const fs = require("fs");
const { execSync } = require("child_process");

exports.run = async (bot, msg) => {
	await bot.user.setPresence({ activity: {name: `EXECUTING.`}, status: `dnd` });

	let passed = 0;
	let failed = 0;
	let tests_failed = [];
	let errors = 0;
	let tests_error = [];

	let output_msg = await msg.reply(`test results:`);
	let output = `<@${msg.member.id}>, tests results:`;

	try {
		execSync(`cd ./programs; make cuda`);
	} catch (exc) {
		fs.unlinkSync(`./programs/${process.env.PROGRAM}.cu`);

		bot.user.setPresence({ activity: {name: ``}, status: `online` });

		return update(output_msg, output, `\nCOMPILATION ERROR:\n ${exc.stderr}\n`);
	}

	fs.unlinkSync(`./programs/${process.env.PROGRAM}.cu`);

	let tests = fs.readdirSync("./tests/");
	for (let i = 0; tests.includes(`${i}.sh`); i++) {
		let result = "";
		try {
			result = execSync(`./tests/${i}.sh`).toString();
		} catch (exc) {
			execSync(`cd ./programs; make clean`);

			bot.user.setPresence({ activity: {name: ``}, status: `online` });

			let current = fs.readFileSync(`./tests/${i}.sh`).toString();
			let msg_update = update(output_msg, output, `\n**Test ${i + 1}**: EXECUTION ERROR:\n`
				+ `${exc.stderr}\nTest was: \`.${current.substring("./programs".length)}\``);
			output_msg = msg_update.msg;
			output = msg_update.content;

			errors++;
			tests_error.push(i + 1);

			if (i === 0) return msg.reply(`your program couldn't finish executing the very first test. Aborting.`);
			break;
		}

		fs.writeFileSync(`./outputs/${i}.txt`, result);

		try {
			execSync(`diff ./outputs/o${i}.txt ./outputs/${i}.txt`);
			// In case the time is exactly the same (has happened):
			let msg_update = await update(output_msg, output,
				`\n**Test ${i + 1}**: Passed \b\n`
				+ `${result.split("\n")[1]}\n`);
			output_msg = msg_update.msg;
			output = msg_update.content;

			passed++;
		} catch (exc) {
			let lines = exc.stdout.toString().split("\n");

			if (lines[0] != "2c2") {
				let expected_line = 2;
				let result_line = 5;
				// In case the time is exactly the same (has happened twice):
				if (lines[0] === "3c3") {
					expected_line--;
					result_line -= 2;
				}

				let current = fs.readFileSync(`./tests/${i}.sh`).toString();

				let msg_update = await update(output_msg, output, 
					`\n**Test ${i + 1}**: Failed.\n`
					+ `Expected: ${lines[expected_line].substring(10)}\n`
					+ `Got: ${lines[result_line].substring(10)}\n`
					+ `Test was: \`.${current.substring("./programs".length)}\``);
				output_msg = msg_update.msg;
				output = msg_update.content;

				failed++;
				tests_failed.push(i + 1);
			} else {
				let msg_update = await update(output_msg, output,
					`\n**Test ${i + 1}**: Passed \b\n`
					+ `${lines[3].substring(2)}\n`);
				output_msg = msg_update.msg;
				output = msg_update.content;

				passed++;
				console.log(i, passed);
			}
		}
		fs.unlinkSync(`./outputs/${i}.txt`);
	}

	let summary = `**Summary**:\n${passed} tests passed.\n${failed} tests failed.\n${errors} errors.\n`;
	if (failed > 0) summary += `\nFailed tests: ${tests_failed}`;
	if (errors > 0) summary += `\n Erroneous tests: ${tests_error}`;

	msg.reply(summary);

	bot.user.setPresence({ activity: {name: ``}, status: `online` });

	execSync(`cd ./programs; make clean`);

	return (failed + errors) == 0;
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
