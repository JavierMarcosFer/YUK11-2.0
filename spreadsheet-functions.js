const { google } = require('googleapis');

// Loads the spreadsheets and prepares it for pulling info
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

// Read the specified range from left to right, top to bottom
async function readGoogleSheetRows(googleSheetClient, sheetId, tabName, range) {
	const res = await googleSheetClient.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: `${tabName}!${range}`,
		majorDimension: 'ROWS',
	});

	return res.data.values;
}

// Read the specified range from top to bottom, left to right
async function readGoogleSheetColumns(googleSheetClient, sheetId, tabName, range) {
	const res = await googleSheetClient.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: `${tabName}!${range}`,
		majorDimension: 'COLUMNS',
	});

	const values = {
		shuffleNo: res.data.values[0],
		completionDate: res.data.values[1],
		submitterName: res.data.values[2],
		submitterID: res.data.values[3],
		characterName: res.data.values[4],
		referenceURL1: res.data.values[5],
		referenceURL2: res.data.values[6],
		referenceURL3: res.data.values[7],
		illustratorName: res.data.values[8],
		illustratorID: res.data.values[9],
		drawingURL: res.data.values[10],
	};

	return values;
}

// Insert a row with the specified data
async function appendGoogleSheet(googleSheetClient, sheetId, tabName, range, data) {
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

// Update an existing row with the specified data
async function updateGoogleSheetRow(googleSheetClient, sheetId, tabName, range, data) {
	await googleSheetClient.spreadsheets.values.update({
		spreadsheetId: sheetId,
		range: `${tabName}!${range}`,
		valueInputOption: 'USER_ENTERED',
		resource: {
			'range': `${tabName}!${range}`,
			'majorDimension': 'ROWS',
			'values': data,
		},
	});
}

// Logs a finished drawing by setting the completion date and drawing URL
async function logFinishedDrawing(googleSheetClient, sheetId, tabName, rowNo, drawingURL) {
	const datetime = new Date();
	await googleSheetClient.spreadsheets.values.batchUpdate({
		spreadsheetId: sheetId,
		valueInputOption: 'USER_ENTERED',
		resource: {
			data: [
				{
					'range': `${tabName}!B${rowNo}`,
					'values': [[datetime.toLocaleString()]],
				},
				{
					'range': `${tabName}!K${rowNo}`,
					'values': [[drawingURL]],
				},
			],
		},
	});
}

// Deletes a submission from the database
// Logs a finished drawing by setting the completion date and drawing URL
async function deleteRow(googleSheetClient, rowNo) {
	const spreadsheetId = process.env.SPREADSHEET_ID;
	const tabID = process.env.SPREADSHEET_TAB_ID;
	await googleSheetClient.spreadsheets.batchUpdate({
		spreadsheetId: spreadsheetId,
		resource: {
			'requests': [
				{
					'deleteRange': {
						'range': {
							'startRowIndex': rowNo - 1,
							'endRowIndex': rowNo,
							'sheetId': tabID,
						},
						'shiftDimension': 'ROWS',
					},
				},
			],
		},
	});
}

async function getSubmittersAndIllustrators(googleSheetClient, sheetId, tabName) {
	const res = await googleSheetClient.spreadsheets.values.batchGet({
		spreadsheetId: sheetId,
		ranges: [
			`${tabName}!D1:D`,
			`${tabName}!J1:J`,
		],
		majorDimension: 'COLUMNS',
	});

	const values = {
		submitters: res.data.valueRanges[0].values[0].filter(entry => entry != ''),
		illustrators: res.data.valueRanges[1].values[0].filter(entry => entry != ''),
	};

	return values;
}

module.exports.getGoogleSheetClient = getGoogleSheetClient;
module.exports.readGoogleSheetRows = readGoogleSheetRows;
module.exports.readGoogleSheetColumns = readGoogleSheetColumns;
module.exports.appendGoogleSheet = appendGoogleSheet;
module.exports.getSubmittersAndIllustrators = getSubmittersAndIllustrators;
module.exports.updateGoogleSheetRow = updateGoogleSheetRow;
module.exports.logFinishedDrawing = logFinishedDrawing;
module.exports.deleteRow = deleteRow;