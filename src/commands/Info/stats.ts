import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { ApplyOptions } from '@sapphire/decorators';
import { CommandOptions, version as sapphireVersion } from '@sapphire/framework';
import { Message, EmbedBuilder, version as discordVersion } from 'discord.js';
import { readFileSync } from 'fs';
import prettyMilliseconds from 'pretty-ms';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { chunkCollection, makeChart } from '@lib/utils';

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
					new EmbedBuilder()
						.setTitle('Statistics')
						.setColor('DarkGreen')
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

		paginator.addPage({
			embeds: [new EmbedBuilder()
				.setThumbnail(client.user?.displayAvatarURL() ?? '')
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

				])],
			files: []
		});

		const statsPages = chunkCollection(this.container.cmdStats, 10);

		statsPages.forEach((statsPage, idx) =>
			paginator.addPage({
				files: [makeChart(statsPage, { title: 'Command Usage', name: `cmdUse${idx}` })],
				embeds: [new EmbedBuilder().setImage(`attachment://cmdUse${idx}.png`)]
			})
		);


		return paginator.run(msg, msg.author);
	}

}
