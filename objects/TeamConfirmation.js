const fs = require("fs");

const Team = require("./Team.js")

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
		this.requestSent = false;
		if (save) this.save();
	}

	/**
	 * Sends the membership request to all team members, given the bot client
	 * to send the messages with.
	 */
	sendRequest(bot) {
		// Send only once ever:
		if (this.requestSent) return false;

		let serverName = await bot.guilds.fetch(this.server).name;

		let reply = `Sent a confirmation request to join ${this.tm.name} on server ${serverName} to:\n`;
		for (let m of delegates) {
			let member = await bot.users.fetch(m);
			member.send(
				`<@${this.usr}> wants to join team ${this.tm.name}\n` +
				`To accept them, send "${process.env.PRE}team ${serverName} accept ${this.tm.id}#${this.usr}" to me.\n` +
				`To reject and delete the request, send "${process.env.PRE}team ${serverName} reject ${this.tm.id}#${this.usr}" to me. ` +
				this.delegates.size() > 1 ? `(Can't be undone by any other team member.)` : ``
			);
			reply += `<@${m}>\n`;
		}

		bot.users.fetch(this.usr).send(reply);


		// TODO: account for errors fetching users?
		this.requestSent = true;

		this.save();
		
		return true;
	}

	/**
	 * Marks the given user as accepting the new member, and adds
	 * the new member to the team if all older members have accepted them.
	 */
	accept(member) {
		if (!this.delegates.has(member)) {
			// TODO: handle this exception.
			return;
		}
		this.delegates.delete(member);

		if (delegates.size === 0) {
			this.tm.join(this.usr);
			this.delete();
		} else {
			this.save();
		}
	}

	/**
	 * Rejects the new member's request, and informs the other team members.
	 */
	reject(rejecter, bot) {
		if (!this.delegates.has(rejecter)) {
			// TODO: handle this exception.
			return;
		}

		bot.users.fetch(this.usr).send(`Your request to join ${this.tm.name} has been rejected.`);
		for (let member of this.tm.members) {
			if (member != rejecter) {
				bot.users.fetch(member).send(`<@${rejecter}> has rejected the request of <@${this.usr}> to join ${this.tm.name}`);
			}
		}

		reply = `The request has been rejected` + this.tm.members.length > 1 ? `, and all the other team members have been notified.` : `.`;
		bot.users.fetch(rejecter).send(reply);

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
		if (!fs.existsSync(`./teams`)) fs.mkdirSync(`./teams/${this.server}`, { recursive: true });
		else if (!fs.existsSync(`./teams/${this.server}`)) fs.mkdirSync(`./teams/${this.server}`);

		// Write as JSON:
		fs.writeFileSync(`./teams/${this.server}/${this.tm.id}#${this.usr}.json`, JSON.stringify(this));
	}

	/**
	 * Retrieves a confirmation request from a JSON file and returns it.
	 */
	static fromJSON(json) {
		return Object.assign(new TeamConfirmation("g110", -1, false), json);
	}
} 

module.exports = TeamConfirmation;
