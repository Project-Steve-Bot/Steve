import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import { Message, ActionRowBuilder, StringSelectMenuBuilder, User, ComponentType } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { getChannel, getGuild, sendLoadingMessage } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Set what channel your faxes will go to.',
	aliases: ['desk']
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message) {
		const response = await sendLoadingMessage(msg);

		const faxableGuilds = await this.container.db.guilds
			.find({ $nor: [{ 'channels.fax': { $exists: false } }, { 'channels.fax': { $size: 0 } }] })
			.toArray();

		const dropdown = new StringSelectMenuBuilder()
			.setCustomId(`${msg.author.id}-${msg.id}|FaxDeskSelect`)
			.setPlaceholder('Select where you want your faxes to be sent.')
			.addOptions([
				{
					label: 'DMs',
					value: msg.author.id,
					description: 'Faxes will be send by me to your DMs.'
				}
			]);

		await Promise.all(faxableGuilds.map(async (dbGuild) => {
			console.log(`Checking guild: ${dbGuild.id}`);
			if (!dbGuild.channels?.fax) return;

			const guild = await getGuild(dbGuild.id);
			if (!guild.members.cache.has(msg.author.id)) return;

			dbGuild.channels.fax.forEach(async (channelId) => {
				const channel = await getChannel(channelId);
				if (!channel?.isSendable() || channel.isDMBased()) return;

				dropdown.addOptions({
					label: `#${channel.name}`,
					value: channelId,
					description: channel.guild.name
				});
			});
			return;
		}));

		const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(dropdown);

		await response.edit({ content: 'You can send faxes to all these places!', components: [actionRow] });

		const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60e3 });

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
				interaction.editReply(`I'll send your faxes to <#${selected}>`);
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
		this.container.db.users.findOneAndUpdate({ id: user.id }, { $set: { 'fax.channel': channel } }, { upsert: true });
		return;
	}

}
