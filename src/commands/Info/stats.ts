import { ApplyOptions } from '@sapphire/decorators';
import { CommandOptions, version as sapphireVersion } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, MessageEmbed, version as discordVersion } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { readFileSync } from 'fs';

@ApplyOptions<CommandOptions>({
	description: `Get some stats about ${process.env.BOT_NAME}.`,
	aliases: ['version']
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message) {
		const { client } = this.container;
		const { version: botVersion } = JSON.parse(readFileSync(`${process.cwd()}/package.json`).toString());

		send(msg, { embeds: [new MessageEmbed()
			.setTitle('Statistics')
			.setColor('DARK_GREEN')
			.setThumbnail(client.user?.displayAvatarURL() ?? '')
			.setTimestamp()
			.addFields([
				{ name: 'Users', value: client.users.cache.size.toString(), inline: true },
				{ name: 'Channels', value: client.channels.cache.size.toString(), inline: true },
				{ name: 'Servers', value: client.guilds.cache.size.toString(), inline: true },
				{ name: 'Uptime', value: prettyMilliseconds(client.uptime ?? 0, { verbose: true }), inline: true },
				{ name: 'Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
				{ name: `${process.env.BOT_NAME} Version`, value: `v${botVersion}` },
				{ name: 'Discord.js Version', value: `v${discordVersion}`, inline: true },
				{ name: 'Sapphire Version', value: `v${sapphireVersion}`, inline: true },
				{ name: 'Node.js Version', value: process.version, inline: true }

			])
		] });
	}

}
