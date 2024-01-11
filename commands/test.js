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

/**
 * Returns the specification for the given test,
 * as a bash executable command.
 */
exports.run = async (bot, msg, args) => {
	if (args.length < 1) {
		return msg.reply(`invalid usage: ${process.env.PRE}test <number>`);
	}

	// Remove duplicates:
	args = args.filter((value, index, self) => self.indexOf(value) === index);

	let output = `\n`;
	for (i of args) {
		try {
			output += `**Test ${i}**: \`.${fs.readFileSync(`./tests/${i - 1}.sh`).toString().substring(`./programs`.length)}\``;
		} catch (exc) {
			msg.reply(`invalid test number: ${i}.`);
		}
	}

	if (output != `\n`) return msg.reply(output);
}
