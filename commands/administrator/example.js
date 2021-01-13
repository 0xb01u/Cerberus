const Discord = require("discord.js");

exports.run = async (bot, msg, args) => {
	let i = 1;
	const embed = new Discord.MessageEmbed()
		.setColor(0x00ff00);

	switch (args[0]) {
		case "aoc":{
			embed.setTitle("Leaderboard lb_mars")
				.setURL("http://tablon-aoc.infor.uva.es/leaderboards")
				.setDescription("Check the program with a set of unknown " +
					"reference inputs, to rank the program.\n" +
					"Enviar con: -q lb_mars -u USUARIO -x CONTRASEÑA")
				.addFields(
					{ name: "Pos", value: "\u200B", inline: true },
					{ name: "User", value: "\u200B", inline: true },
					{ name: "Score", value: "\u200B", inline: true },
					{ name: "\u200B", value: i++, inline: true },
					{ name: "\u200B", value: "g08", inline: true },
					{ name: "\u200B", value: 21543, inline: true },
					{ name: "\u200B", value: i++, inline: true },
					{ name: "\u200B", value: "g29", inline: true },
					{ name: "\u200B", value: 19165, inline: true },
					{ name: "\u200B", value: "\u200B", inline: true },
					{ name: "\u200B", value: "Puntuacion_10", inline: true },
					{ name: "\u200B", value: 18125, inline: true },
					{ name: "\u200B", value: i++, inline: true },
					{ name: "\u200B", value: "g24", inline: true },
					{ name: "\u200B", value: 17881, inline: true },
					{ name: "\u200B", value: i++, inline: true },
					{ name: "\u200B", value: "g18", inline: true },
					{ name: "\u200B", value: "s", inline: true },
				);

			break;}

		case "mpi":{
			embed.setTitle("Leaderboard mpilb")
				.setURL("http://frontendv.infor.uva.es/leaderboards")
				.setDescription("Leaderboard MPI para la Simulacion " +
					"de la Evolución\nEnviar con: " +
					"-q mpilb -u USUARIO -x CONTRASEÑA ")
				.addFields(
					{ name: "Pos", value: "\u200B", inline: true },
					{ name: "User", value: "\u200B", inline: true },
					{ name: "Time", value: "\u200B", inline: true },
					{ name: "\u200B", value: i++, inline: true },
					{ name: "\u200B", value: "g110", inline: true },
					{ name: "\u200B", value: "27.622s", inline: true },
					{ name: "\u200B", value: i++, inline: true },
					{ name: "\u200B", value: "g304", inline: true },
					{ name: "\u200B", value: "28.743s", inline: true },
					{ name: "\u200B", value: i++, inline: true },
					{ name: "\u200B", value: "g211", inline: true },
					{ name: "\u200B", value: "37.412s", inline: true },
					{ name: "\u200B", value: i++, inline: true },
					{ name: "\u200B", value: "g302", inline: true },
					{ name: "\u200B", value: "38.259s", inline: true },
					{ name: "\u200B", value: "\u200B", inline: true },
					{ name: "\u200B", value: "Ref2", inline: true },
					{ name: "\u200B", value: "39.795s", inline: true },
					{ name: "\u200B", value: i++, inline: true },
					{ name: "\u200B", value: "g205", inline: true },
					{ name: "\u200B", value: "40.535s", inline: true },
					{ name: "\u200B", value: i++, inline: true },
					{ name: "\u200B", value: "g107", inline: true },
					{ name: "\u200B", value: "40.698s", inline: true },
					{ name: "\u200B", value: "...", inline: true }
				);

			break;}

		case "cuda":{
			embed.setTitle("cudalb");
			embed.setURL("http://frontendv.infor.uva.es/leaderboards");

			let i = 1;
			embed.addField(`${i++}.- g110`, "5.228s");
			embed.addField(`${i++}.- g304`, "6.743s");
			embed.addField(`${i++}.- g109`, "6.770s");
			embed.addField(`${i++}.- g210`, "6.966s");
			embed.addField(`${i++}.- g211`, "7.259s");
			embed.addField(`${i++}.- g302`, "7.285s");
			embed.addField(`${i++}.- g205`, "15.731s");
			embed.addField(`${i++}.- g207`, "16.846s");
			embed.addField(`${i++}.- g206`, "20.420s");
			embed.addField(`${i++}.- g107`, "23.129s");
			embed.addField(`${i++}.- g202`, "26.134s");
			embed.addField(`Ref2`, "26.945s");
			embed.addField(`${i++}.- g102`, "27.975s");
			embed.addField(`${i++}.- g104`, "33.833s");
			embed.addField(`Ref1`, "42.602s");
			embed.addField(`${i++}.- g209`, "42.602s");
			embed.addField(`${i++}.- g106`, "53.379s");
			embed.addField(`${i++}.- g105`, "54.609s");
			embed.addField(`${i++}.- g201`, "54.885s");

			break;}
	}

	msg.reply(embed);
}
