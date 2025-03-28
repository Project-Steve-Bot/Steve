import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ComponentType, StringSelectMenuBuilder, time, TimestampStyles } from 'discord.js';
import { generateSnoozeButtons } from '../lib/utils';
import { Duration } from 'luxon';

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class Snooze extends InteractionHandler {

	public async parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('snooze')) {
			return this.none();
		}
		await interaction.deferUpdate();
		return this.some();
	}

	public async run(interaction: ButtonInteraction) {
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

			await selectInt.update(`${msg.content}\nI've snoozed this reminder and will remind you again at ${time(expires, TimestampStyles.ShortDateTime)}.`);
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

	private get choices() {
		return new ActionRowBuilder<StringSelectMenuBuilder>()
			.addComponents([
				new StringSelectMenuBuilder()
					.setCustomId('snooze')
					.addOptions([
						{
							label: '5 minutes',
							value: Duration.fromObject({
								minutes: 5
							}).toMillis().toString()
						},
						{
							label: '10 minutes',
							value: Duration.fromObject({
								minutes: 10
							}).toMillis().toString()
						},
						{
							label: '15 minutes',
							value: Duration.fromObject({
								minutes: 15
							}).toMillis().toString()
						},
						{
							label: '30 minutes',
							value: Duration.fromObject({
								minutes: 30
							}).toMillis().toString()
						},
						{
							label: '1 hour',
							value: Duration.fromObject({
								hours: 1
							}).toMillis().toString()
						},
						{
							label: '2 hours',
							value: Duration.fromObject({
								hours: 2
							}).toMillis().toString()
						},
						{
							label: '3 hours',
							value: Duration.fromObject({
								hours: 3
							}).toMillis().toString()
						},
						{
							label: '4 hours',
							value: Duration.fromObject({
								hours: 4
							}).toMillis().toString()
						},
						{
							label: '5 hours',
							value: Duration.fromObject({
								hours: 5
							}).toMillis().toString()
						},
						{
							label: '6 hours',
							value: Duration.fromObject({
								hours: 6
							}).toMillis().toString()
						},
						{
							label: '7 hours',
							value: Duration.fromObject({
								hours: 7
							}).toMillis().toString()
						},
						{
							label: '8 hours',
							value: Duration.fromObject({
								hours: 8
							}).toMillis().toString()
						},
						{
							label: '1 day',
							value: Duration.fromObject({
								days: 1
							}).toMillis().toString()
						},
						{
							label: '3 days',
							value: Duration.fromObject({
								days: 3
							}).toMillis().toString()
						},
						{
							label: '1 week',
							value: Duration.fromObject({
								weeks: 1
							}).toMillis().toString()
						},
						{
							label: 'Random (between 1 week and 3 years)',
							value: `${Math.floor(Math.random() * ((94608000000 - 604800000) + 604800000))}`,
							emoji: '❓'
						}
					])
			]);
	}

}
