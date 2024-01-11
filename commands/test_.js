/*
 *  Cerberus - Discord bot for cooperative CUDA executions in parallel
 *  programming courses using gamification techniques
 *  Copyright (C) 2020-2024  Bolu - email: bolu@tuta.io
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
const fs = require("fs");
const { execSync } = require("child_process");

/**
 * Execute a program and return its output.
 *
 * The program must have already been downloaded to the corresponding folder.
 * The program must be compressed in a .tgz file, and include the source code
 * as one or many files, all other dependencies, and a Makefile to properly
 * compile it.
 */
exports.run = async (bot, msg, args, queue) => {
	// Tests executions:
	if (args.length == 1 && (args[0] === "" || args[0].toLowerCase() === "update")) {
		let passed = 0;
		let tests_failed = [];
		let tests_error = [];

		let output_msg = await msg.reply(`test results:`);
		let output = `tests results:`;
		if (msg.channel.type != "dm") output = `<@${msg.member.id}>, ${output}`;

		try {
			execSync(`cd ./programs; tar xzf ${process.env.PROGRAM}.tgz; make`);
		} catch (exc) {
			fs.unlinkSync(`./programs/${process.env.PROGRAM}.tgz`);

			return update(output_msg, output, `**COMPILATION ERROR**:\n${exc.stderr}`);
		}

		fs.unlinkSync(`./programs/${process.env.PROGRAM}.tgz`);

		let tests = fs.readdirSync("./tests/");
		let time = 0;
		for (let i = 0; tests.includes(`${i}.sh`); i++) {
			let result = "";
			try {
				result = execSync(`./tests/${i}.sh`, { timeout: parseInt(process.env.TIMEWALL) }).toString();
			} catch (exc) {
				// TODO: print stdout on Timewall
				let current = fs.readFileSync(`./tests/${i}.sh`).toString();
				let msg_update = null;
				if (exc.stderr.length === 0) {
					let program_output = exc.stdout.toString().length > 0 ? `\`\`\`\n${exc.stdout}\`\`\`\n` : "";
					msg_update = await update(output_msg, output, `\n**Test ${i + 1}**: **TIMEWALL REACHED** (${process.env.TIMEWALL/1000}s) :clock10:\n`
						+ `${program_output}Test was: \`.${current.substring("./programs".length)}\``);
				} else {
					if (exc.stdout.length + exc.stderr.length > 0) {
						msg_update = await update(output_msg, output, `\n**Test ${i + 1}**: **EXECUTION ERROR** :x:\n`
							+ `\`\`\`${exc.stdout}\n${exc.stderr}\`\`\`\nTest was: \`.${current.substring("./programs".length)}\``);
					} else {
						msg_update = await update(output_msg, output, `\n**Test ${i + 1}**: **EXECUTION ERROR** :x:\n`
							+ `Test was: \`.${current.substring("./programs".length)}\``);
					}
				}
				output_msg = msg_update.msg;
				output = msg_update.content;

				tests_error.push(i + 1);

				//break;
				continue;
			}

			//let output_type = queue === "cuda" ? "c" : "o";
			let output_type = queue === "cuda" ? "c" : "c";	// Placeholder.
															// One day, I will implement queues. One day...

			if (args[0].toLowerCase() === "update") {
				let prev_result = fs.readFileSync(`./outputs/${output_type}${i}.txt`).toString();
				fs.writeFileSync(`./outputs/${output_type}${i}.txt`, result);

				let msg_update = await update(output_msg, output,
					`\n**Test ${i + 1}**: Updated :new:\n`
					+ `Previous result: ${prev_result.split("\n")[2]}\n`
					+ `New result: ${result.split("\n")[2]}\n`
					+ `${result.split("\n")[1]}\n`);
				output_msg = msg_update.msg;
				output = msg_update.content;
			} else {
				fs.writeFileSync(`./outputs/${i}.txt`, result);
				try {

					execSync(`diff ./outputs/${output_type}${i}.txt ./outputs/${i}.txt`);
					let msg_update = await update(output_msg, output,
						`\n**Test ${i + 1}**: Passed :white_check_mark:\n`
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
							`\n**Test ${i + 1}**: Failed :woozy_face:\n`
							+ `Expected: ${lines[expected_line].substring(10)}\n`
							+ `Got: ${lines[result_line].substring(10)}\n`
							+ `Test was: \`.${current.substring("./programs".length)}\``);
						output_msg = msg_update.msg;
						output = msg_update.content;

						tests_failed.push(i + 1);

						//break;
					} else {
						let msg_update = await update(output_msg, output,
							`\n**Test ${i + 1}**: Passed :white_check_mark:\n`
							+ `${lines[3].substring(2)}\n`);
						output_msg = msg_update.msg;
						output = msg_update.content;

						passed++;
						time += parseFloat(lines[3].substring(8))
					}
				}
				fs.unlinkSync(`./outputs/${i}.txt`);
			}
		}

		let summary = `**Summary**:\n${passed} tests passed.\n${tests_failed.length} tests failed.\n${tests_error.length} errors.\n`;
		if (tests_failed.length > 0) summary += `\nFailed tests: ${tests_failed}`;
		if (tests_error.length > 0) summary += `\nErroneous tests: ${tests_error}`;

		if (tests_failed.length + tests_error.length === 0) {
			summary += `\nSum of times: ${time}`
		}

		if (args[0].toLowerCase() !== "update") msg.reply(summary);
		else msg.reply("all tests have been updated.");

		execSync(`cd ./programs; make clean; rm -f *.c *.h *.cpp *.hpp *.cu Makefile`);

		return (tests_failed.length + tests_error.length) == 0;

	// Non-tests executions:
	} else {
		let reply = await msg.reply();
		// Just execute the program:
		if (args.includes("n") || args.includes("N")		// These were for "No test".
			|| args.includes("c") || args.includes("C")		// These were for "Custom execution".
			|| args.includes("a") || args.includes("A")) {	// These were for "Alternative execution" or "Args".
			try {
				execSync(`cd programs; tar xzf ${process.env.PROGRAM}.tgz; make`);
				fs.unlinkSync(`./programs/${process.env.PROGRAM}.tgz`);
			} catch (exc) {
				fs.unlinkSync(`./programs/${process.env.PROGRAM}.tgz`);

				return update(reply, reply.content, `**COMPILATION ERROR**:\n\`\`\`${exc.stderr}\`\`\``);
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
				execSync(`cd ./programs; make clean; rm -f *.cu *.h Makefile`);	

				return update(reply, reply.content, `\`\`\`${output}\`\`\``);

			} catch (exc) {
				execSync(`cd ./programs; make clean; rm -f *.cu *.h Makefile`);

				return update(reply, reply.content, `**ERROR**:\n\`\`\`${exc.stdout.toString().substring(0, 1500)}\n${exc.stderr.toString().substring(0, 480)}\`\`\``);
			}
		} else {
			// Just in case the source file hasn't been deleted yet:
			fs.unlinkSync(`./programs/${process.env.PROGRAM}.tgz`);
			execSync(`cd ./programs; make clean; rm -f *.cu *.h Makefile`);

			return update(reply, reply.content, " invalid option.");
		}
	}
}

async function update(msg, original, addon) {
	let header = original.split("\n")[0];

	if (addon.length > 2000 - header.length) {
		addon = addon.substring(0, 2000 - header.length);
	}
	let new_content = original + addon;

	if (new_content.length > 2000) {
		// TODO: take into account more than 10 continuations?
		let continuation = isNaN(header.substring(header.length - 2, header.length - 1)) ?
			1 : parseInt(header.substring(header.length - 2, header.length - 1)) + 1;
		if (continuation === 1) {
			header += ` (continued 1)`
		}
		header = `${header.substring(0, header.length - 2)}${continuation})`
		// TODO; allow addons larger than 2000 characters?

		addon = header + `\n${addon}\n`;
		let new_msg = await msg.channel.send(addon);

		return { msg: new_msg, content: addon };
	} else {
		await msg.edit(new_content);

		return { msg: msg, content: new_content };
	}
}
