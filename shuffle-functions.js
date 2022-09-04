const gspread = require('./spreadsheet-functions.js');

// Returns URL of image attachment.
// Returns 1 if function call did not include an attachment.
// Returns 2 if attachment is not an image.
async function getImage(interaction) {
	if (interaction.options.getAttachment('image') != undefined) {
		console.log('Attachment');
		const attachment = interaction.options.getAttachment('image');
		if (attachment.contentType.startsWith('image/')) {
			return attachment.url;
		}
		else {
			console.log(`Attachment is of type ${attachment.contentType} rather than an image.`);
			await interaction.reply('Huh? This attachment isn\'t an image!');
			return 2;
		}
	}
	else { return 1; }
}

// Returns URL of image attachment.
// Returns 1 if function call did not include an attachment.
// Returns 2 if attachment is not an image.
async function getAttachment(interaction) {
	if (interaction.options.getAttachment('attachment') != undefined) {
		return interaction.options.getAttachment('attachment').url;
	}
	else { return 1; }
}

// Returns passed link to image.
// Returns 1 if function call did not include a link.
// Returns 2 if link is not valid.
async function getLinkToImage(interaction) {
	if (interaction.options.getString('link') != undefined) {
		console.log('Link');
		const httpPrefixRegex = new RegExp('^(ftp|http|https|cdn\\.discordapp)');
		const imageExtendionRegex = new RegExp('(\\.jpg|\\.jpeg|\\.png|\\.webp)$');
		const link = interaction.options.getString('link');
		if (!httpPrefixRegex.test(link)) {
			console.log('Not a link.');
			await interaction.editReply('This isn\'t a link...');
			return 2;
		}
		else if (!imageExtendionRegex.test(link)) {
			console.log('Link does not lead to an image.');
			await interaction.editReply('Hrmm... This is not a link to an image, is it...?');
			return 2;
		}
		else {
			// eslint-disable-next-line no-unused-vars
			return link;
		}
	}
	else { return 1; }
}

// Updates the bot's status to display the number of people
// currently signed up for the shuffle
function setStatus(discordClient, entrantNo) {
	discordClient.user.setPresence({
		activities: [{
			name: `${entrantNo} people for next shuffle`,
		}],
		status: 'online',
	});
}

// Enter a submission into the shuffle
// This function assumes that a name has been passed and checks
// if a valid attachment image or link has been passed
async function addSubmission(interaction, userID) {
	// Get character name
	const characterName = interaction.options.getString('name');

	// Check if command contains an image
	let attachmentURL = await getImage(interaction);
	if (attachmentURL == 1) {
		// Check if command contains a link to an image
		attachmentURL = await getLinkToImage(interaction);
		if (attachmentURL == 1) {
			// Interaction contains neither a link nor an image.
			console.log('None');
			await interaction.editReply('You gotta give me a reference, ya silly!');
			return;
		}
	}
	// A passed image or reference were invalid and error message has been sent
	if (attachmentURL == 2) { return; }

	// Generating google sheet client
	const googleSheetClient = await gspread.getGoogleSheetClient();

	// Fetch database
	const sheetId = process.env.SPREADSHEET_ID;
	const sheetName = process.env.SHEET_NAME;
	const data = await gspread.readGoogleSheetColumns(googleSheetClient, sheetId, sheetName, 'A:K');

	// Check if a submission already exists
	for (let i = data.illustratorID.length; i < data.submitterID.length; i++) {
		if (data.submitterID[i] == userID && typeof data.illustratorID[i] == 'undefined') {
			// Entry exists, update submission
			const range = `C${i + 1}`;
			const newRow = [[
				interaction.user.tag,
				userID,
				characterName,
				attachmentURL,
			]];
			await gspread.updateGoogleSheetRow(googleSheetClient, sheetId, sheetName, range, newRow);

			await interaction.editReply('Entry updated!');
			return;
		}
	}

	// No previous entry- build new one
	const shuffleNo = parseInt(data.shuffleNo[data.illustratorID.length - 1]) + 1;
	const newRow = [[
		shuffleNo,
		'',
		interaction.user.tag,
		userID,
		characterName,
		attachmentURL,
	]];
	const range = `A${data.submitterID.length}`;
	await gspread.appendGoogleSheet(googleSheetClient, sheetId, sheetName, range, newRow);

	// Update status
	const entrantNo = data.submitterID.length - data.illustratorID.length + 1;
	setStatus(interaction.client, entrantNo);

	await interaction.editReply('Entry created!');
	return;
}

async function finishSubmission(interaction, userID) {
	// Check if command contains an image
	let attachmentURL = await getAttachment(interaction);
	if (attachmentURL == 1) {
		// Check if command contains a link to an image
		attachmentURL = await getLinkToImage(interaction);
		if (attachmentURL == 1) {
			// Interaction contains neither a link nor an image.
			console.log('None');
			await interaction.editReply('Done, you say? Then show us watcha got!');
			return;
		}
	}
	// A passed image or reference were invalid and error message has been sent
	if (attachmentURL == 2) { return; }

	// Generating google sheet client
	const googleSheetClient = await gspread.getGoogleSheetClient();

	// Fetch database
	const sheetId = process.env.SPREADSHEET_ID;
	const sheetName = process.env.SHEET_NAME;
	const data = await gspread.readGoogleSheetColumns(googleSheetClient, sheetId, sheetName, 'A:K');

	// Check if a submission already exists
	for (let i = data.illustratorID.length - 1; i > 1; i--) {
		if (data.illustratorID[i] == userID && typeof data.completionDate[i] == 'undefined') {
			await gspread.logFinishedDrawing(googleSheetClient, sheetId, sheetName, i + 1, attachmentURL);

			await interaction.editReply('Drawing finished!');
			return;
		}
	}

	// Pending drawing not found
	await interaction.editReply('Huh... Did you even owe anything??');
	return;
}

async function cancelSubmission(interaction, userID) {
	// Generating google sheet client
	const googleSheetClient = await gspread.getGoogleSheetClient();

	// Fetch database
	const sheetId = process.env.SPREADSHEET_ID;
	const sheetName = process.env.SHEET_NAME;
	const data = await gspread.readGoogleSheetColumns(googleSheetClient, sheetId, sheetName, 'A:K');

	// Check if a submission already exists and illustrator hasn't been assigned
	for (let i = data.illustratorID.length; i < data.submitterID.length; i++) {
		if (data.submitterID[i] == userID && typeof data.illustratorID[i] == 'undefined') {
			// Submission found- remove
			await gspread.deleteRow(googleSheetClient, i + 1);
			await interaction.editReply('Very well, I\'ve removed your submission... Hope to see you again soon!');

			// Update status
			const entrantNo = data.submitterID.length - data.illustratorID.length + 1;
			setStatus(interaction.client, entrantNo);
			return;
		}
	}

	// Pending drawing not found
	await interaction.editReply('Hm? Were you even signed up to begin with?');
	return;
}

module.exports.getImageAttachment = getImage;
module.exports.getLinkToImage = getLinkToImage;
module.exports.setStatus = setStatus;
module.exports.addSubmission = addSubmission;
module.exports.finishSubmission = finishSubmission;
module.exports.cancelSubmission = cancelSubmission;