const moment = require('moment-timezone');
const gspread = require('./spreadsheet-functions.js');
// eslint-disable-next-line no-unused-vars
const { EmbedBuilder, SelectMenuOptionBuilder } = require('discord.js');

// TODO get return codes for these functions
// Let the command itself handle each case

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

function buildCard(interaction, characterName, referenceURL) {
	const cardEmbed = new EmbedBuilder()
		.setColor(0xff92b8)
		.setTitle(characterName)
		.setAuthor({
			name: 'Submitted by ' + interaction.user.tag,
			iconURL: interaction.user.avatarURL(),
		})
		.setImage(referenceURL);
	return cardEmbed;
}

// Enter a submission into the shuffle
// This function assumes that a name has been passed and checks
// if a valid attachment image or link has been passed
// If an user was added, update status afterwards
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
				'',
				'',
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

	const card = buildCard(interaction, characterName, attachmentURL);
	await interaction.editReply({ content: `Entry added! ${characterName} has entered the shuffle!`, embeds: [card] });
	return;
}

async function addReference(interaction, userID) {
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
			const range = `G${i + 1}`;
			const newRow = [[
				attachmentURL,
			]];
			await gspread.updateGoogleSheetRow(googleSheetClient, sheetId, sheetName, range, newRow);

			await interaction.editReply('Gotcha, I\'ll pass this along as an additional reference!');
			return;
		}
	}

	// Not in the shuffle
	await interaction.editReply('Did you submit your character first? Ya gotta use **/sffl** for that!');
	return;
}

// Turn in a finished prompt
// This function checks if a valid attachment image or link has been passed
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

// Remove a submission from an upcoming shuffle
// Updates status afterwards
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
			const entrantNo = data.submitterID.length - data.illustratorID.length - 1;
			setStatus(interaction.client, entrantNo);
			return;
		}
	}

	// Pending drawing not found
	await interaction.editReply('Hm? Were you even signed up to begin with?');
	return;
}

// Starts the shuffle
// Return 0 on success
// Returns 1 if it has no participants
// Returns 2 if some other error happened
async function startShuffle(discordClient) {
	// Generating google sheet client
	const googleSheetClient = await gspread.getGoogleSheetClient();

	// Fetch database
	const sheetId = process.env.SPREADSHEET_ID;
	const sheetName = process.env.SHEET_NAME;
	const data = await gspread.readGoogleSheetColumns(googleSheetClient, sheetId, sheetName, 'A:K');

	// Check if too few participants
	const participantCount = data.submitterID.length - data.illustratorID.length;
	if (participantCount < 2) {
		return 1;
	}

	// Build list of participants and potential restrictions
	const participants = await getParticipants(data, process.env.REPEAT_PROTECTION_LEVEL);

	// Try to generate a list randomly
	// TODO If randomness fails once, proceed with a more deliberate approach
	for (let protection = process.env.REPEAT_PROTECTION_LEVEL; protection >= 0; protection--) {
		const result = randomShuffle(participants, protection, 5000);
		if (result != 1) {
			// Write down results to table
			const writeData = buildShuffleWriteData(data, participants);
			const writeRange = `I${data.submitterID.length - participantCount + 1}:J${data.submitterID.length}`;
			await gspread.updateGoogleSheetColumn(googleSheetClient, sheetId, sheetName, writeRange, writeData);

			// Reach out to participants
			await messageParticipants(discordClient, data, writeData);
			// Change status
			await setStatus(discordClient, 0);
			// Change topic
			await updateShuffleTopic(discordClient);

			return 0;
		}
	}

	console.log('aw fuck');
	return 1;

}

// Builds a list of the participants for this shuffle and their restrictions
async function getParticipants(spreadsheetData, startRepeatProtection) {
	const lastShuffleNo = spreadsheetData.shuffleNo[spreadsheetData.shuffleNo.length - 1];
	const entries = spreadsheetData.submitterID.slice(spreadsheetData.illustratorID.length);
	const names = spreadsheetData.submitterName.slice(spreadsheetData.illustratorID.length);
	const restrictions = [];

	entries.forEach(entry => {
		const temp = [];
		for (let i = spreadsheetData.illustratorID.length - 1; spreadsheetData.shuffleNo[i] >= lastShuffleNo - startRepeatProtection; i--) {
			if (spreadsheetData.illustratorID[i] == entry) {
				temp.push(spreadsheetData.submitterID[i]);
			}
		}
		restrictions.push(temp);
	});

	return {
		entries: entries,
		names: names,
		restrictions: restrictions,
	};
}

// Shuffle entrants by random brute force.
// Shuffles participants and their respective restrictions randomly, then checks if the list is valid.
// If the list invalid, tries shuffling again, up to the number of times specified by genLimit.
// Returns 1 upon failing to generate a valid shuffle
// Otherwise returns a shuffled list of participants
function randomShuffle(participants, repeatProtection, genLimit) {
	console.log('randomShuffle: Generating list with protection level ', repeatProtection);

	// Generate list
	for (let n = 0; n < genLimit; n++) {
		// While there remain elements to shuffle.
		for (let i = participants.entries.length - 1; i > 0; i--) {
			// Pick a remaining element.
			const randomIndex = Math.floor(Math.random() * (i + 1));

			// And swap it with the current element.
			let t = participants.entries[i];
			participants.entries[i] = participants.entries[randomIndex];
			participants.entries[randomIndex] = t;

			t = participants.names[i];
			participants.names[i] = participants.names[randomIndex];
			participants.names[randomIndex] = t;

			t = participants.restrictions[i];
			participants.restrictions[i] = participants.restrictions[randomIndex];
			participants.restrictions[randomIndex] = t;
		}

		// Check validity
		if (isShuffleValid) {
			return participants;
		}
	}

	console.log('randomShuffle: Failed to generate valid shuffle');
	return 1;
}

function buildShuffleWriteData(data, participants) {
	const namesColumn = [];
	const idsColumn = [];
	for (let i = data.illustratorID.length; i < data.submitterID.length; i++) {
		// Find entrant in participants list
		const submitterIndex = participants.entries.indexOf(data.submitterID[i]);

		// Assign illustrator for this submission
		// If last on the list, loop back to start
		if (submitterIndex == participants.entries.length - 1) {
			idsColumn.push(participants.entries[0]);
			namesColumn.push(participants.names[0]);
		}
		else {
			idsColumn.push(participants.entries[submitterIndex + 1]);
			namesColumn.push(participants.names[submitterIndex + 1]);
		}
	}

	return [
		namesColumn,
		idsColumn,
	];
}

// Check if the passed list is valid
// returns true if the list if valid
function isShuffleValid(participants, repeatProtection) {
	for (let i = 0; i < participants.entries.length - 1; i++) {
		// Check if the adjacent entrant is restricted
		const res = participants.restrictions[i].indexOf(participants.entries[i + 1]);
		if (res >= 0 && res < repeatProtection) {
			// If yes, list is invalid
			return false;
		}
	}
	// Check last entrant
	const res = participants.restrictions[0].indexOf(participants.entries[participants.entries.length]);
	if (res >= 0 && res < repeatProtection) {
		// If yes, list is invalid
		return false;
	}

	// If you reach the end, list is valid
	return true;
}

async function messageParticipants(discordClient, data, writeData) {
	const startIndex = data.illustratorID.length;
	for (let i = startIndex; i < data.submitterID.length; i++) {
		const illustratorName = writeData[0][i - startIndex].slice(0, -5);
		const illustratorID = writeData[1][i - startIndex];
		const submitterName = data.submitterName[i].slice(0, -5);
		const characterName = data.characterName[i];
		const reference1 = data.referenceURL1[i];
		const reference2 = data.referenceURL2[i];
		const note = data.note[i];

		let message = 'Hello ' + illustratorName + ', and welcome to the shuffle!\nThis time you got ' + submitterName + '\'s character: ' + characterName + '!';

		if (note != '' && note != undefined) {
			message = message + '\n\n> ' + note;
		}

		message = message + '\n\nGood luck!';

		setTimeout(function() {
			console.log('Messaging ' + illustratorName + '.');
		}, 500);

		try {
			const userChannel = await discordClient.users.cache.get(illustratorID);

			if (reference2 != '' && reference2 != undefined) {
				await userChannel.send({ content: message, files: [reference1, reference2] });
			}
			else {
				await userChannel.send({ content: message, files: [reference1] });
			}
		}
		catch (err) {
			// TODO post error message on admin channel
			console.log('shuffle-functions.js: messageParticiants - Couldn\'t message ' + illustratorName + '!');
			console.log(err);
		}
	}
}

// Change the topic (description) for the shuffle channel to show whent he next shuffle begins
async function updateShuffleTopic(discordClient) {
	const shuffleChannelID = process.env.SHUFFLE_CHANNEL_ID;
	const shuffleChannel = await discordClient.channels.cache.get(shuffleChannelID);
	const timestamp = moment().startOf('week').add(1, 'week').add(3, 'day').add(12, 'hour').unix();
	await shuffleChannel.setTopic('The shuffle event channel, a weekly secret santa! - Next shuffle starts in <t:' + timestamp + ':R>');
	return;
}

module.exports.getImageAttachment = getImage;
module.exports.getLinkToImage = getLinkToImage;
module.exports.setStatus = setStatus;
module.exports.addSubmission = addSubmission;
module.exports.finishSubmission = finishSubmission;
module.exports.cancelSubmission = cancelSubmission;
module.exports.addReference = addReference;
module.exports.startShuffle = startShuffle;