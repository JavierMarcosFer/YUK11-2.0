const { SlashCommandBuilder } = require('discord.js');
const { google } = require('googleapis');
const gspread = require('../spreadsheet-functions.js')

async function getGoogleSheetClient() {
	const auth = new google.auth.GoogleAuth({
		keyFile: './credentials.json',
		scopes: ['https://www.googleapis.com/auth/spreadsheets'],
	});
	const authClient = await auth.getClient();
	return google.sheets({
		version: 'v4',
		auth: authClient,
	});
}

async function readGoogleSheetRows(googleSheetClient, sheetId, tabName, range) {
	const res = await googleSheetClient.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: `${tabName}!${range}`,
		majorDimension: 'ROWS',
	});

	return res.data.values;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sffl')
		.setDescription('Submit a character to enter the weekly shuffle.')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Name of your character.')
				.setRequired(true),
		)
		.addAttachmentOption(option =>
			option.setName('image')
				.setDescription('Colored, full-body image of your submitted character.')
				.setRequired(false),
		)
		.addStringOption(option =>
			option.setName('link')
				.setDescription('A link to it works fine too.')
				.setRequired(false),
		),
	async execute(interaction) {
		const spreadsheetId = process.env.SPREADSHEET_ID;
		const sheetName = process.env.SHEET_NAME;

		// Generating google sheet client
		const googleSheetClient = await gspread.getGoogleSheetClient();

		const data = await gspread.readGoogleSheetColumns(googleSheetClient, spreadsheetId, sheetName, 'A:H');
		console.log(data);
		
		await interaction.reply('Sad!');
	},
};