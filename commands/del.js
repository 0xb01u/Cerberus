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

exports.run = async (bot, msg, args) => {
	if (args.length < 1) return msg.reply("you must specify the number of the test to delete.");

	for (i of args) {
		try {
			fs.unlinkSync(`./tests/${i - 1}.sh`);
			fs.unlinkSync(`./outputs/c${i - 1}.txt`);
		} catch (exc) {
			return msg.reply(`invalid test number: ${i}.`);
		}
	}

	let tests = fs.readdirSync(`./tests`).map((e) => e.substring(0, e.length - 3));
	let last = Math.max(...tests);

	let src = 0;
	let dest = 0;
	while (src <= last) {
		if (tests.includes(`${src}`)) {
			fs.writeFileSync(`./tests/${dest}.sh`, fs.readFileSync(`./tests/${src}.sh`).toString());
			fs.writeFileSync(`./outputs/c${dest}.txt`, fs.readFileSync(`./outputs/c${src}.txt`).toString());
			dest++;
		}
		src++;
	}

	while (dest < src) {
		fs.unlinkSync(`./tests/${dest}.sh`);
		fs.unlinkSync(`./outputs/c${dest}.txt`);
		dest++;
	}

	return msg.reply(`correctly deleted tests: ${args}.\n Tests have been re-ordered.`);
}
