const fs = require("fs"):

const Team = require("../objects/Team.js")

/**
 * Student data and preferences object.
 */
class Student {
	/**
	 * Constructor for a student, given a server they are in.
	 *
	 * Every student must be in at least one server. (It wouldn't make sense
	 * if they weren't.)
	 */
	constructor(userID, serverID, username, userNo, save=true) {
		this.id = userID;
		this.username = `${username}#${userNo}`
		this.preferredServer = serverID;
		this.guilds = new [serverID];
		this.credentials = {};
		this.preferredQueue = null;
		this.latestClientCommand = null;

		if (save) this.save();
	}

	/**
	 * Add a guild to the list of guilds this student is in.
	 */
	addServer(serverID) {
		this.guilds.push(serverID);

		this.save();
	}

	/**
	 * Add a team for one of the guilds this student is in.
	 */
	addTeam(serverID, teamID) {
		if (!guilds.includes(serverID)) {
			this.addServer(serverID);
		}

		let team = Team.fromJSON(JSON.parse(`./teams/${guild}/${teamID}.json`));
		this.credentials[serverID] = {"team": teamID, "passwd": team.passwd};

		this.save();
	}

	/**
	 * Sets the preferred server of the student.
	 */
	setServer(serverID) {
		if (!this.guilds.includes(serverID)) {
			// TODO: handle this exception.
			return;
		}

		this.preferredServer = serverID;

		this.save();
	}

	/**
	 * Sets the preferred queue of the student.
	 */
	setQueue(queue) {
		this.queue = queue;

		this.save();
	}

	/**
	 * Sets the latest queue command used by the student.
	 */
	setCommand(cmd) {
		this.latestClientCommand = cmd;

		this.save();
	}

	/**
	 * Saves the student's information as a JSON file.
	 *
	 * Students are saved as /users/username#discriminator.json, for readability.
	 */ 
	save() {
		if (!fs.existsSync(`./users/`)) fs.mkdirSync(`./users/`);
		// TODO: account for name changes.
		fs.writeFileSync(`./users/${this.username}.json`, JSON.stringify(this));
	}

	/**
	 * Retrieves a student from a JSON file and returns it.
	 */
	static fromJSON(json) {
		return Object.assign(new Student(0, -1, "B0luWasHere", 1337, false), json);
	}
}

module.exports = Student;
