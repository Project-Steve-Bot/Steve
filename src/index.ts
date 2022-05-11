import 'module-alias/register';
import '@lib/setup';
import { LogLevel } from '@sapphire/framework';
import { SteveBoi } from '@lib/extensions/SteveBoi';
import { startMongo } from '@lib/mongo';

const main = async () => {
	await startMongo();

	const prefix = process.env.PREFIX ?? 's;';
	const regexPrefix = new RegExp(`^${(process.env.BOT_NAME ?? 'steve').toLowerCase()},( )?`, 'i');
	const client = new SteveBoi(
		{
			defaultPrefix: prefix,
			regexPrefix,
			fetchPrefix: (msg) => {
				if (msg.guild) {
					return [prefix];
				}
				return [prefix, ''];
			},
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
				'DIRECT_MESSAGE_REACTIONS'
			],
			partials: ['MESSAGE', 'CHANNEL', 'REACTION']
		});

	try {
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
		client.user?.setPresence({
			activities: [
				{
					type: 'PLAYING',
					name: `${prefix}help`
				}
			]
		});
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
