/* eslint-disable no-unused-vars */
const { google } = require('googleapis');

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

async function readGoogleSheetColumns(googleSheetClient, sheetId, tabName, range) {
	const res = await googleSheetClient.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: `${tabName}!${range}`,
		majorDimension: 'COLUMNS',
	});

	return res.data.values;
}

async function writeGoogleSheet(googleSheetClient, sheetId, tabName, range, data) {
	await googleSheetClient.spreadsheets.values.append({
		spreadsheetId: sheetId,
		range: `${tabName}!${range}`,
		valueInputOption: 'USER_ENTERED',
		insertDataOption: 'INSERT_ROWS',
		resource: {
			'majorDimension': 'ROWS',
			'values': data,
		},
	});
}

module.exports.getGoogleSheetClient = getGoogleSheetClient;
module.exports.readGoogleSheetRows = readGoogleSheetRows;
module.exports.readGoogleSheetColumns = readGoogleSheetColumns;
module.exports.writeGoogleSheet = writeGoogleSheet;