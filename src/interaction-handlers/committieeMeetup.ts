import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandlerOptions, InteractionHandlerTypes, InteractionHandler } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class CommittieeMeetup extends InteractionHandler {

	public async parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('meetup')) {
			return this.none();
		}
		await interaction.deferReply({ ephemeral: true });
		return this.some();
	}


	public async run(interaction: ButtonInteraction) {
		const meetup = await this.container.db.meetups.findOne({ id: interaction.customId.split('|')[1] });

		if (!meetup) {
			return interaction.editReply('Something went wrong and I couldn\'t find this meetup :(');
		}

		if (!meetup.possibleMembers.includes(interaction.user.id)) {
			return interaction.editReply('Looks like you aren\'t a part of this meetup');
		}

		if (meetup.confirmedMembers.includes(interaction.user.id)) {
			return interaction.editReply('You\'re already confirmed');
		}

		meetup.confirmedMembers.push(interaction.user.id);
		await this.container.db.meetups.updateOne({ id: meetup.id }, { $set: { confirmedMembers: meetup.confirmedMembers } });

		if (meetup.possibleMembers.length >= meetup.confirmedMembers.length) {
			await interaction.message.edit({ components: [
				new ActionRowBuilder<ButtonBuilder>().setComponents(new ButtonBuilder()
					.setLabel('Everyone confirmed!')
					.setCustomId(`meetup|${meetup.id}`)
					.setStyle(ButtonStyle.Primary)
					.setDisabled(true)
				)
			] });
		}

		return interaction.editReply('Thanks for confirming!');
	}

}
