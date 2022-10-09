const { Client, NoAuth } = require('whatsapp-web.js');
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
	authStrategy: new NoAuth(),
	puppeteer: {
		args: [
			'--disable-setuid-sandbox',
			// '--no-sandbox',
			// '--disable-setuid-sandbox',
			// '--disable-dev-shm-usage',
			// '--disable-accelerated-2d-canvas',
			// '--no-first-run',
			// '--no-zygote',
			// '--single-process', // <- this one doesn't works in Windows
			// '--disable-gpu',
		],
		headless: true,
	},
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
	console.log('qr', qr);
	console.log(Date().toLocaleString());
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

				// const contact = await chatGroup.participants;
				// const isAlreadyExist = contact.findIndex(
				// 	(el) => el.id._serialized === msg.from
				// );
				// if (isAlreadyExist !== -1) {
				// 	// isAlreadyExist in this group
				// 	client.sendMessage(msg.from, STRINGS.YOU_ALREADY_MEMBER);
				// 	return;
				// }

				const addedResult = await chatGroup.addParticipants([msg.from]);
				if (addedResult[msg.from].status === 200) {
					client.sendMessage(msg.from, STRINGS.ADD_SUCCESSFUL);
					resetUserData(msg.from);
					return;
				} else {
					const invite = await chatGroup.getInviteCode();
					// send invite
					client.sendMessage(msg.from, `${WHATSAPP_BASE_URL}${invite}`);
					// reset data of user
					resetUserData(msg.from);
					// reset invite
					setTimeout(() => {
						chatGroup.revokeInvite();
					}, 1000 * 60);
					return;
				}
			}
			client.sendMessage(msg.from, STRINGS.CORRECT);
			setStage(msg.from, stage + 1);
			sendQuestion(msg.from, stage + 1);
			return;
		} else {
			// if answer is wrong
			client.sendMessage(msg.from, STRINGS.TRY_AGAIN);
			return;
		}
	}
});
https: client.initialize();
