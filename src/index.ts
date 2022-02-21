import './lib/setup';
import { LogLevel } from '@sapphire/framework';
import { SteveBoi } from './lib/extendables/SteveBoi';

const client = new SteveBoi({
	defaultPrefix: 'd;',
	regexPrefix: /^dave,( )?/i,
	caseInsensitivePrefixes: true,
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	shards: 'auto',
	intents: [
		'GUILDS',
		'GUILD_MEMBERS',
		'GUILD_BANS',
		'GUILD_EMOJIS_AND_STICKERS',
		'GUILD_VOICE_STATES',
		'GUILD_MESSAGES',
		'GUILD_MESSAGE_REACTIONS',
		'DIRECT_MESSAGES',
		'DIRECT_MESSAGE_REACTIONS',
	],
	partials: ['CHANNEL']
});

const main = async () => {
	try {
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
		client.user?.setPresence({
			activities: [
				{
					type: 'PLAYING',
					name: 'd;help'
				}
			]
		});
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main();
