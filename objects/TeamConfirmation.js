const fs = require("fs");

/**
 * Class defining objects responsible for new member confirmation
 * in students' teams.
 *
 * New team members must be confirmed by all the (already) team members
 * in order for them to join the team.
 */

class TeamConfirmation {
	/**
	 * Constructor for a confirmation for the given user to join
	 * the given team.
	 */
	constructor(team, userID, save=true) {
		this.usr = userID;
		this.tm = team;
		this.server = team.server;
		this.delegates = new Set(team.members);
		this.delegatesCopy = team.members;
		this.requestSent = false;
		if (save) this.save();
	}

	/**
	 * Sends the membership request to all team members, given the bot client
	 * to send the messages with.
	 */
	async sendRequest(bot) {
		// Send only once ever:
		if (this.requestSent) return false;

		let user = await bot.users.fetch(this.usr);

		let serverName = (await bot.guilds.fetch(this.server)).name.replaceAll(" ", "_");

		let reply = `Sent a confirmation request to join ${this.tm.name} on server ${serverName} to:\n`;
		for (let m of this.delegates) {
			let member = await bot.users.fetch(m);
			member.send(
				`<@${this.usr}> (${user.username}#${user.discriminator}) wants to join team ${this.tm.name} on the server ${(await bot.guilds.fetch(this.server)).name}.\n` +
				`To accept them, send \`${process.env.PRE}team ${serverName} accept ${this.tm.id}#${this.usr}\` to me (**in this channel**).\n` +
				`To reject and delete the request, send \`${process.env.PRE}team ${serverName} reject ${this.tm.id}#${this.usr}\` instead` +
				((this.delegates.size > 1) ? ` (it can't be undone by any other team member.)` : `.`)
			);
			reply += `<@${m}>\n`;
		}

		user.send(reply);


		// TODO: account for errors fetching users?
		this.requestSent = true;

		this.save();
		
		return true;
	}

	/**
	 * Marks the given user as accepting the new member, and adds
	 * the new member to the team if all older members have accepted them.
	 */
	async accept(member, bot=null) {
		if (!this.delegates.has(member)) {
			// TODO: handle this exception.
			return;
		}
		this.delegates.delete(member);
		this.delegatesCopy = Array.from(this.delegates);

		if (this.delegates.size === 0) {
			this.tm.join(this.usr);
			if (bot != null) {
				(await bot.users.fetch(this.usr)).send(`You've been accepted on team ${this.tm.name} on ${(await bot.guilds.fetch(this.server)).name}.`);
			}


			this.delete();
		} else {
			this.save();
		}
	}

	/**
	 * Rejects the new member's request, and informs the other team members.
	 */
	async reject(rejecter, bot) {
		if (!this.delegates.has(rejecter)) {
			// TODO: handle this exception.
			return;
		}

		(await bot.users.fetch(this.usr)).send(`Your request to join ${this.tm.name} on ${(await bot.guilds.fetch(this.server)).name} has been rejected.`);
		for (let member of this.tm.members) {
			if (member != rejecter) {
				(await bot.users.fetch(member)).send(`<@${rejecter}> has rejected the request of <@${this.usr}> to join ${this.tm.name}`);
			}
		}

		let reply = `The request has been rejected` + this.tm.members.length > 1 ? `, and all the other team members have been notified.` : `.`;
		(await bot.users.fetch(rejecter)).send(reply);

		this.delete();
	}

	/**
	 * Deletes this confirmation request from the system.
	 */
	delete() {
		fs.unlinkSync(`./teams/${this.server}/${this.tm.id}#${this.usr}.json`);
	}

	/**
	 * Saves the confirmation request as a JSON file.
	 *
	 * Confirmations are saved as /teams/<guild_id>/<team_id>#<user_requesting_id>.json
	 */
	save() {
		// Create directories if they don't exist:
		//  - Done on team.js -

		// Write as JSON:
		fs.writeFileSync(`./teams/${this.server}/${this.tm.id}#${this.usr}.json`, JSON.stringify(this, null, 2));
	}

	/**
	 * Retrieves a confirmation request from a JSON file and returns it.
	 */
	static fromJSON(json) {
		let tc = Object.assign(new TeamConfirmation("g110", -1, false), json);
		tc.delegates = new Set(tc.delegatesCopy);

		const Team = require("./Team.js");
		tc.tm = Object.assign(new Team("g110", -1, false), tc.tm);

		return tc;
	}
} 

module.exports = TeamConfirmation;
