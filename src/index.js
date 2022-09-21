const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config.json');

// equivalent to
const client = new Client({
	authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
	// Generate and scan this code with your phone
	qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
	console.log('Client is ready!');
});

const { MANAGER_CONTACT } = config;

const runTimeData = {
	'': {
		stage: 1,
	},
};

client.on('message', async (msg) => {
	/*
	 * management region
	 */
	// if (msg.author === "MANAGER_CONTACT" || msg.from === "MANAGER_CONTACT") {
	//   const [type, payload] = msg.body.split("-");
	//   switch (type) {
	//     case "GetChatId":
	//       const chatGroup = await client.getChatById(msg.from);
	//       client.sendMessage(
	//         MANAGER_CONTACT,
	//         `${msg.from}
	//          ${chatGroup.name}`
	//       );
	//       break;
	//     // case "MuteGroup":
	//     //     if(payload !==undefined){
	//     //         const chatGroupToMute = await client.getChatById(payload);
	//     //         chatGroupToMute.mute()
	//     //     }
	//     // break

	//     default:
	//       break;
	//   }
	// }
	/*
	 * end management region
	 */
	if (msg.body == '!ping') {
		msg.reply('pong');
	}
});

client.initialize();
