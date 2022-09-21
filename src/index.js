const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config.json');

const WHATSAPP_BASE_URL = 'https://chat.whatsapp.com/';
const { MANAGER_CONTACT, challenges, STRINGS, INITIAL_STRING, GROUP_ID } =
	config;

let runTimeData = {};

const initialRunTimeData = () => {
	runTimeData = {
		users: {},
	};
};

const resetUserData = (id) => {
	runTimeData.users[id] = undefined;
};

const client = new Client({
	authStrategy: new LocalAuth(),
});
const sendQuestion = (to, stage) => {
	client.sendMessage(to, challenges[stage].question);
};

const setStage = (id, newStage) => {
	runTimeData.users[id] = {
		stage: newStage,
	};
};

client.on('qr', (qr) => {
	// Generate and scan this code with your phone
	qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
	console.log('Client is ready!');
	initialRunTimeData();
});

client.on('message', async (msg) => {
	/**
	 * management region
	 **/
	if (msg.author === MANAGER_CONTACT || msg.from === MANAGER_CONTACT) {
		const [type, payload] = msg.body.split('-');
		switch (type) {
			case 'GetChatId':
				const chatGroup = await client.getChatById(msg.from);
				client.sendMessage(
					MANAGER_CONTACT,
					`${msg.from}
	         ${chatGroup.name}`
				);
				break;
			case 'GetRunTimeData':
				client.sendMessage(MANAGER_CONTACT, JSON.stringify(runTimeData));
				break;
			case 'ResetRunTimeData':
				initialRunTimeData();
				break;

			default:
				break;
		}
	}
	// end management region

	// if is newUser
	if (
		runTimeData.users[msg.from] === undefined &&
		msg.body === INITIAL_STRING
	) {
		const stage = 0;
		sendQuestion(msg.from, stage);
		setStage(msg.from, stage);
		return;
	}
	// if is know user
	if (runTimeData.users[msg.from] !== undefined) {
		const stage = runTimeData.users[msg.from].stage;
		//if is correct answer
		if (challenges[stage].answer === msg.body) {
			// if end of questions array
			if (challenges.length - 1 == stage) {
				client.sendMessage(msg.from, STRINGS.YOU_FINISH);

				const chatGroup = await client.getChatById(GROUP_ID);
				if (chatGroup.isReadOnly || !chatGroup.isGroup) {
					return;
				}
				const invite = await chatGroup.getInviteCode();
				client.sendMessage(msg.from, `${WHATSAPP_BASE_URL}${invite}`);
				// reset data of user
				resetUserData(msg.from);
				// reset invite
				setTimeout(() => {
					chatGroup.revokeInvite();
				}, 1000 * 60);
				return;
			}
			client.sendMessage(msg.from, STRINGS.CORRECT);
			setStage(msg.from, stage + 1);
			sendQuestion(msg.from, stage + 1);
			return;
		} else {
			client.sendMessage(msg.from, STRINGS.TRY_AGAIN);
			return;
		}
	}
});
https: client.initialize();
