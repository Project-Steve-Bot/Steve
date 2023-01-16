import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Interaction, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, ButtonBuilder } from 'discord.js';
import parse from 'parse-duration';
import { dateToTimestamp, generateSnoozeButtons } from '@lib/utils';


@ApplyOptions<Listener.Options>({
	event: 'interactionCreate'
})
export class UserEvent extends Listener {

	public async run(interaction: Interaction) {
		if (!interaction.isButton() || !interaction.customId.startsWith('snooze')) return;
		await interaction.deferUpdate();

		if (!interaction.customId.includes(interaction.user.id)) {
			interaction.followUp({ content: 'You can\'t snooze other peoples reminders.', ephemeral: true });
			return;
		}

		const msg = await interaction.editReply({ components: [this.choices] });

		await interaction.editReply({ components: [this.choices] });

		const collector = msg.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 60e3
		});

		collector.on('collect', async (selectInt) => {
			if (selectInt.user.id !== interaction.user.id) {
				await selectInt.reply({ content: 'This selecty boi isn\'t for you!', ephemeral: true });
				return;
			}

			const expires = new Date(interaction.createdTimestamp + parseInt(selectInt.values[0]));

			if (expires < new Date()) {
				await selectInt.reply({ content: 'I can\'t snooze reminders into the past!', ephemeral: true });
				collector.stop('invalid time');
				return;
			}

			const remindContent = msg.content.split('\n').slice(1).join('\n');
			const mode = msg.inGuild() ? 'public' : 'private';

			await this.container.db.reminder.insertOne({
				content: remindContent,
				user: interaction.user.id,
				channel: msg.channelId,
				expires,
				mode,
				repeat: null
			});

			await selectInt.update(`${msg.content}\nI've snoozed this reminder and will remind you again at ${dateToTimestamp(expires)}.`);
			return collector.stop(`snoozed`);
		});

		collector.on('end', (_, reason) => {
			let components: ActionRowBuilder<ButtonBuilder>[] = [];

			if (reason !== 'snoozed') {
				components = generateSnoozeButtons(interaction.user.id);
			}

			interaction.editReply({ components });
		});
	}

	private choices = new ActionRowBuilder<StringSelectMenuBuilder>()
		.addComponents([
			new StringSelectMenuBuilder()
				.setCustomId('snooze')
				.addOptions([
					{
						label: '5 minutes',
						value: `${parse('5m')}`
					},
					{
						label: '10 minutes',
						value: `${parse('10m')}`
					},
					{
						label: '15 minutes',
						value: `${parse('15m')}`
					},
					{
						label: '30 minutes',
						value: `${parse('30m')}`
					},
					{
						label: '1 hour',
						value: `${parse('1h')}`
					},
					{
						label: '2 hours',
						value: `${parse('2h')}`
					},
					{
						label: '3 hours',
						value: `${parse('3h')}`
					},
					{
						label: '4 hours',
						value: `${parse('4h')}`
					},
					{
						label: '5 hours',
						value: `${parse('5h')}`
					},
					{
						label: '6 hours',
						value: `${parse('6h')}`
					},
					{
						label: '7 hours',
						value: `${parse('7h')}`
					},
					{
						label: '8 hours',
						value: `${parse('8h')}`
					},
					{
						label: '1 day',
						value: `${parse('1d')}`
					},
					{
						label: '3 days',
						value: `${parse('3d')}`
					},
					{
						label: '1 week',
						value: `${parse('1w')}`
					}
				])
		]);


}
