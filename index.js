// eslint-disable-next-line no-unused-vars
const keepAlive = require('./keep-alive.js');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');
const gspread = require('./spreadsheet-functions.js');
const CronJob = require('cron').CronJob;
const dotenv = require('dotenv');
const { startShuffle } = require('./shuffle-functions.js');
const moment = require('moment-timezone');
dotenv.config();


// Create a new client instance
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });

// Read commands
discordClient.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	discordClient.commands.set(command.data.name, command);
}

// Read events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		discordClient.once(event.name, (...args) => event.execute(...args));
	}
	else {
		discordClient.on(event.name, (...args) => event.execute(...args));
	}
}

// Set time zone
process.env.TZ = 'US/Pacific';

// Schedule weekly shuffle
const job = new CronJob(
	'0 0 12 * * 3',
	function() {
		console.log('Starting shuffle...');
		startShuffle(discordClient);
	},
	null,
	true,
	'US/Pacific',
);

// Set moment timezone
moment.tz.setDefault('America/Los_Angeles');

// Login to Discord with your client's token
const token = process.env.BOT_TOKEN;
discordClient.login(token);
job.start();

// TODO not clean to have this separated from ready event- gotta work it out eventually.
discordClient.once('ready', () => {
	(async () => {
		// Generating google sheet client and set status
		const googleSheetClient = await gspread.getGoogleSheetClient();
		const sheetId = process.env.SPREADSHEET_ID;
		const sheetName = process.env.SHEET_NAME;
		const spreadData = await gspread.getSubmittersAndIllustrators(googleSheetClient, sheetId, sheetName);
		const entrantNo = spreadData.submitters.length - spreadData.illustrators.length;
		discordClient.user.setPresence({
			activities: [{
				name: `${entrantNo} people for next shuffle`,
			}],
			status: 'online',
		});
		console.log('status changed!');
	})();
});
