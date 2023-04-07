import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import { chunk } from '@sapphire/utilities';
import { Collection, Message, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, User, ComponentType } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { getUser, sendLoadingMessage } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Find peoples fax numbers!',
	aliases: ['whocanifax', 'contacts']
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message) {
		const response = await sendLoadingMessage(msg);

		const faxUsers = await this.container.db.users
			.find({
				$and: [
					{ 'fax.number': { $ne: undefined } },
					{ 'fax.channel': { $ne: undefined } }
				]
			})
			.toArray();
		const userMap = new Collection<string, User>();

		for (let i = 0; i < faxUsers.length; i++) {
			const faxUser = faxUsers[i];
			if (!faxUser.fax?.number) return;
			const user = await getUser(faxUser.id);
			userMap.set(faxUser.fax.number, user);
		}

		const rows: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

		const pages = chunk(
			userMap.map((user, number) => ({ user, number })),
			25
		);

		pages.forEach((page, idx) => {
			const dropdown = new StringSelectMenuBuilder()
				.setCustomId(`${msg.author.id}-${msg.id}|${idx}|FaxDeskSelect`)
				.setPlaceholder('Select a user!');
			page.forEach(({ user, number }) => {
				dropdown.addOptions([
					{
						value: number,
						label: user.tag
					}
				]);
			});
			rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(dropdown));
		});

		const coverEmbed = new EmbedBuilder()
			.setTitle('The Rolodex')
			.setThumbnail(
				'https://cdn.discordapp.com/attachments/700378786012594268/733117912310612008/59fcd0a11ac53.png'
			)
			.setImage(
				'https://cdn.discordapp.com/attachments/944669817137418333/947584420464955553/PinClipart.com_index-card-clip-art_1718271.png'
			)
			.setColor('DarkAqua')
			.setTimestamp();

		await response.edit({
			content: ' ',
			embeds: [coverEmbed],
			components: rows
		});

		const collector = response.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 60e3
		});

		collector.on('collect', async (interaction) => {
			if (interaction.user.id !== msg.author.id) {
				await interaction.reply({
					content: "This menu isn't for you.",
					ephemeral: true
				});
				return;
			}

			const selected = interaction.values[0];

			const user = userMap.get(selected);

			if (!user) {
				interaction.reply({
					content:
						"Something went wrong and I couldn't find that user",
					ephemeral: true
				});
				return;
			}

			const userEmbed = new EmbedBuilder()
				.setTitle('The Rolodex')
				.setColor('DarkAqua')
				.addFields([{ name: user.tag, value: selected }])
				.setThumbnail(user.displayAvatarURL());

			interaction.update({ embeds: [userEmbed] });
		});

		collector.on('end', () => {
			rows.forEach((row) => {
				row.setComponents(
					new StringSelectMenuBuilder()
						.setDisabled(true)
						.setPlaceholder('This selecty boi is off.')
						.setCustomId('DISABLED')
						.addOptions([
							{
								value: 'off',
								label: 'This selecty boi is off.'
							}
						])
				);
			});
			response.edit({ components: rows });
		});
	}

}
