import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import { chunk } from '@sapphire/utilities';
import { Collection, Message, MessageActionRow, MessageEmbed, MessageSelectMenu, User } from 'discord.js';
import { SteveCommand } from '../../lib/extensions/SteveCommand';
import { getUser, sendLoadingMessage } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Find peoples fax numbers!',
	aliases: ['whocanifax', 'contacts']
})
export class UserCommand extends SteveCommand {
	public async messageRun(msg: Message) {
		const response = await sendLoadingMessage(msg);

		const faxUsers = await this.client.db.users.find({ $and: [{ 'fax.number': { $ne: null } }, { 'fax.channel': { $ne: null } }] }).toArray();
		const userMap = new Collection<string, User>();

		for (let i = 0; i < faxUsers.length; i++) {
			const faxUser = faxUsers[i];
			if (!faxUser.fax?.number) return;
			const user = await getUser(faxUser.id);
			userMap.set(faxUser.fax.number, user);
		}

		const rows: MessageActionRow[] = [];

		const pages = chunk(
			userMap.map((user, number) => {
				return { user, number };
			}),
			25
		);

		pages.forEach((page, idx) => {
			const dropdown = new MessageSelectMenu().setCustomId(`${msg.author.id}-${msg.id}|${idx}|FaxDeskSelect`).setPlaceholder('Select a user!');
			page.forEach(({ user, number }) => {
				dropdown.addOptions([
					{
						value: number,
						label: user.tag
					}
				]);
			});
			rows.push(new MessageActionRow().addComponents(dropdown));
		});

		const coverEmbed = new MessageEmbed()
			.setTitle('The Rolodex')
			.setThumbnail('https://cdn.discordapp.com/attachments/700378786012594268/733117912310612008/59fcd0a11ac53.png')
			.setImage('https://cdn.discordapp.com/attachments/944669817137418333/947584420464955553/PinClipart.com_index-card-clip-art_1718271.png')
			.setColor('DARK_AQUA')
			.setTimestamp();

		await response.edit({ content: '', embeds: [coverEmbed], components: rows });

		const collector = response.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 60e3 });

		collector.on('collect', async (interaction) => {
			if (interaction.user.id !== msg.author.id) {
				await interaction.reply({ content: "This menu isn't for you.", ephemeral: true });
				return;
			}

			const selected = interaction.values[0];

			// interaction.update(`You selected ${selected}`);
			const user = userMap.get(selected);

			if (!user) {
				interaction.reply({ content: "Something went wrong and I couldn't find that user", ephemeral: true });
				return;
			}

			const userEmbed = new MessageEmbed()
				.setTitle('The Rolodex')
				.setColor('DARK_AQUA')
				.addField(user.tag, selected)
				.setThumbnail(user.displayAvatarURL({ dynamic: true }));

			interaction.update({ embeds: [userEmbed] });
		});

		collector.on('end', () => {
			rows.forEach((row) => {
				row.setComponents(
					new MessageSelectMenu()
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
