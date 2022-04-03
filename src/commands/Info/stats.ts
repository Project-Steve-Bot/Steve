import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { ApplyOptions } from '@sapphire/decorators';
import { CommandOptions, version as sapphireVersion } from '@sapphire/framework';
import { Message, MessageEmbed, version as discordVersion } from 'discord.js';
import { readFileSync } from 'fs';
import prettyMilliseconds from 'pretty-ms';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { makeChart } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: `Get some stats about ${process.env.BOT_NAME}.`,
	aliases: ['version']
})
export class UserCommand extends SteveCommand {

	private botVersion = JSON.parse(readFileSync(`${process.cwd()}/package.json`).toString()).version;

	public async messageRun(msg: Message) {
		const { client } = this.container;

		const paginator = new PaginatedMessage({
			template: {
				embeds: [
					new MessageEmbed()
						.setTitle('Statistics')
						.setColor('DARK_GREEN')
						.setTimestamp()
				]
			}
		});
		paginator.setActions(PaginatedMessage.defaultActions.filter(action => 'customId' in action
			&& [
				'@sapphire/paginated-messages.previousPage',
				'@sapphire/paginated-messages.nextPage',
				'@sapphire/paginated-messages.stop'
			].includes(action.customId))
		);

		paginator.addPageEmbed((embed) =>
			embed.setThumbnail(client.user?.displayAvatarURL() ?? '')
				.addFields([
					{ name: 'Users', value: client.users.cache.size.toString(), inline: true },
					{ name: 'Channels', value: client.channels.cache.size.toString(), inline: true },
					{ name: 'Servers', value: client.guilds.cache.size.toString(), inline: true },
					{ name: 'Uptime', value: prettyMilliseconds(client.uptime ?? 0, { verbose: true }), inline: true },
					{ name: 'Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
					{ name: `${process.env.BOT_NAME} Version`, value: `v${this.botVersion}` },
					{ name: 'Discord.js Version', value: `v${discordVersion}`, inline: true },
					{ name: 'Sapphire Version', value: `v${sapphireVersion}`, inline: true },
					{ name: 'Node.js Version', value: process.version, inline: true }

				])
		);

		paginator.addPage({
			files: [makeChart(this.container.cmdStats, { title: 'Command Usage', name: 'cmdUse' })],
			embeds: [new MessageEmbed().setImage('attachment://cmdUse.png')]
		});

		return paginator.run(msg, msg.author);
	}

}
