const fs = require("fs");
const { execSync } = require("child_process");

exports.run = async (bot, msg, args) => {
	// Tests executions:
	if (args.includes("") || args.length == 0) {
		let passed = 0;
		let failed = 0;
		let tests_failed = [];
		let errors = 0;
		let tests_error = [];

		let output_msg = await msg.reply(`test results:`);
		let output = `tests results:`;
		if (msg.channel.type != "dm") output = `<@${msg.member.id}>, ${output}`;

		try {
			execSync(`cd ./programs; tar xzf ${process.env.PROGRAM}.tgz; make`);
		} catch (exc) {
			fs.unlinkSync(`./programs/${process.env.PROGRAM}.tgz`);

			return update(output_msg, output, `\n**COMPILATION ERROR**:\n\`\`\`\n${exc.stderr}\n\`\`\`\n`);
		}

		fs.unlinkSync(`./programs/${process.env.PROGRAM}.tgz`);

		let tests = fs.readdirSync("./tests/");
		for (let i = 0; tests.includes(`${i}.sh`); i++) {
			let result = "";
			let time = 0;
			try {
				result = execSync(`./tests/${i}.sh`, { timeout: parseInt(process.env.TIMEWALL) }).toString();
			} catch (exc) {
				let current = fs.readFileSync(`./tests/${i}.sh`).toString();
				let msg_update = update(output_msg, output, `\n**Test ${i + 1}**: **EXECUTION ERROR**:\n`
					+ `\`${exc.stderr}\`\nTest was: \`.${current.substring("./programs".length)}\``);
				output_msg = msg_update.msg;
				output = msg_update.content;

				errors++;
				tests_error.push(i + 1);

				if (i === 0) {
					execSync(`cd ./programs; make clean; rm -f *.cu *.h Makefile`);

					return msg.reply(`your program couldn't finish executing the very first test. Aborting.`);
				}
				break;
			}

			fs.writeFileSync(`./outputs/${i}.txt`, result);

			try {
				execSync(`diff ./outputs/c${i}.txt ./outputs/${i}.txt`);
				// In case the time is exactly the same (has happened):
				let msg_update = await update(output_msg, output,
					`\n**Test ${i + 1}**: Passed \b\n`
					+ `${result.split("\n")[1]}\n`);
				output_msg = msg_update.msg;
				output = msg_update.content;

				passed++;
				time += parseFloat(result.split("\n")[1].substring(6));
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
					time += parseFloat(lines[3].substring(8))
				}
			}
			fs.unlinkSync(`./outputs/${i}.txt`);
		}

		let summary = `**Summary**:\n${passed} tests passed.\n${failed} tests failed.\n${errors} errors.\n`;
		if (failed > 0) summary += `\nFailed tests: ${tests_failed}`;
		if (errors > 0) summary += `\n Erroneous tests: ${tests_error}`;

		if (failed + errors === 0) {
			summary += `\n\nSum of times: ${time}`
		}

		msg.reply(summary);

		execSync(`cd ./programs; make clean; rm -f *.cu *.h Makefile`);

		return (failed + errors) == 0;

	// Non-tests executions:
	} else if (false) {
		// Just execute the program:
		if (args.includes("n") || args.includes("N")		// These were for "No test".
			|| args.includes("c") || args.includes("C")		// These were for "Custom execution".
			|| args.includes("a") || args.includes("A")) {	// These were for "Alternative execution" or "Args".
			try {
				execSync(`cd programs; nvcc -O3 ${process.env.PROGRAM}.cu -o ${process.env.PROGRAM}`);
				fs.unlinkSync(`./programs/${process.env.PROGRAM}.cu`);
			} catch (exc) {
				fs.unlinkSync(`./programs/${process.env.PROGRAM}.cu`);

				return msg.reply(`\n**COMPILATION ERROR**:\n\`\`\`\n${exc.stderr}\n\`\`\`\n`);
			}

			let exec_args = "";

			let arg_index = Math.max(args.indexOf("n"), args.indexOf("N"),
				args.indexOf("c"), args.indexOf("C"),
				args.indexOf("a"), args.indexOf("A"));
			if (arg_index < args.length - 1) {
				exec_args = args.splice(arg_index + 1).reduce((a, b) => `${a} ${b}`);

				if (exec_args.startsWith("./")) {
					if (exec_args.indexOf(" ") != -1) {
						exec_args = exec_args.substring(exec_args.indexOf(" ") + 1);
					} else {
						exec_args = "";
					}
				}
			}

			try {
				let output = execSync(`./programs/${process.env.PROGRAM} ${exec_args}`, { timeout: parseInt(process.env.TIMEWALL) });
				fs.unlinkSync(`./programs/${process.env.PROGRAM}`);

				return msg.reply(`\n\`\`\`\n${output}\n\`\`\``);

			} catch (exc) {
				fs.unlinkSync(`./programs/${process.env.PROGRAM}`);

				return msg.reply(`**ERROR**:\n${stderr}`);
			}
		} else {
			// Just in case the source file hasn't been deleted yet:
			fs.unlinkSync(`./programs/${process.env.PROGRAM}.cu`);

			return msg.reply("invalid option.");
		}
	}
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
