import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import { Message, MessageActionRow, MessageSelectMenu, User } from 'discord.js';
import { SteveCommand } from '../../lib/extensions/SteveCommand';
import { getChannel, sendLoadingMessage } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Set what channel your faxes will go to.',
	aliases: ['desk']
})
export class UserCommand extends SteveCommand {
	public async messageRun(msg: Message) {
		const response = await sendLoadingMessage(msg);

		const faxableGuilds = await this.client.db.guilds
			.find({ $nor: [{ 'channels.fax': { $exists: false } }, { 'channels.fax': { $size: 0 } }] })
			.toArray();

		const dropdown = new MessageSelectMenu()
			.setCustomId(`${msg.author.id}-${msg.id}|FaxDeskSelect`)
			.setPlaceholder('Select where you want your faxes to be sent.')
			.addOptions([
				{
					label: 'DMs',
					value: msg.author.id,
					description: 'Faxes will be send by me to your DMs.'
				}
			]);

		faxableGuilds.forEach(async (g) => {
			if (!g.channels?.fax) return;
			g.channels.fax.forEach(async (c) => {
				const channel = await getChannel(c);
				if (!channel?.isText() || channel.type === 'DM' || channel.partial) return;

				dropdown.addOptions({
					label: `#${channel.name}`,
					value: c,
					description: channel.guild.name
				});
			});
		});

		const actionRow = new MessageActionRow().addComponents(dropdown);

		await response.edit({ components: [actionRow], embeds: [] });

		const collector = response.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 60e3 });

		collector.on('collect', async (interaction) => {
			await interaction.deferReply({ ephemeral: true });
			if (interaction.user.id !== msg.author.id) {
				interaction.editReply("This menu isn't for you.");
				return;
			}

			const selected = interaction.values[0];
			if (selected === msg.author.id) {
				const dm = await msg.author.createDM();
				await this.updateFaxChannel(msg.author, dm.id);
				interaction.editReply("I'll send your faxes to DMs.");
			} else {
				await this.updateFaxChannel(msg.author, selected);
				interaction.editReply(`I\'ll send your faxes to <#${selected}>`);
			}
			collector.stop();
		});

		collector.on('end', () => {
			dropdown
				.setDisabled(true)
				.setPlaceholder('This selecty boi is off.');
			actionRow.setComponents([dropdown]);
			response.edit({ components: [actionRow] });
		});
	}

	private async updateFaxChannel(user: User, channel: string): Promise<void> {
		this.client.db.users.findOneAndUpdate({ id: user.id }, { $set: { 'fax.channel': channel } }, { upsert: true });
		return;
	}
}
