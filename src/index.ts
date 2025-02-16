import 'module-alias/register';
import '@lib/setup';
import { ApplicationCommandRegistries, LogLevel, RegisterBehavior } from '@sapphire/framework';
import { SteveBoi } from '@lib/extensions/SteveBoi';
import { startMongo } from '@lib/mongo';
import { ActivityType, Partials } from 'discord.js';

const main = async () => {
	await startMongo();

	ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

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
			loadMessageCommandListeners: true,
			logger: {
				level: LogLevel.Debug
			},
			shards: 'auto',
			intents: [
				'MessageContent',
				'Guilds',
				'GuildMembers',
				'GuildBans',
				'GuildEmojisAndStickers',
				'GuildVoiceStates',
				'GuildMessages',
				'GuildMessageReactions',
				'DirectMessages',
				'DirectMessageReactions'
			],
			partials: [Partials.Message, Partials.Channel, Partials.Reaction]
		});

	try {
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
		client.user?.setPresence({
			activities: [
				{
					type: ActivityType.Custom,
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
