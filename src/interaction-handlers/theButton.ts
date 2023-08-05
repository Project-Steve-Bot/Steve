import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonInteraction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.Button,
	name: 'The Button handler'
})
export class TheButtonClick extends InteractionHandler {

	public async parse(interaction: ButtonInteraction) {
		if (interaction.customId !== 'SafetyButton') {
			return this.none();
		}

		return this.some();
	}

	public async run(interaction: ButtonInteraction) {
		if (!process.env.OWNERS) {
			throw new Error('No Owners defined');
		}
		await this.container.client.users.fetch(process.env.OWNERS).then(owner => owner.send('**The Button** was pressed'));

		interaction.showModal(new ModalBuilder()
			.setCustomId('SafetyModal')
			.setTitle('You clicked The Button')
			.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId('SafetyContext')
					.setLabel('Add context to your click?')
					.setStyle(TextInputStyle.Paragraph)
					.setPlaceholder('Please click submit with this box empty if you wish to not add context')
					.setRequired(false)
			))
		);
	}

}

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
	name: 'The Button Modal handler'
})
export class TheButtonModal extends InteractionHandler {

	public async parse(interaction: ModalSubmitInteraction) {
		if (interaction.customId !== 'SafetyModal') {
			return this.none();
		}

		return this.some();
	}

	public async run(interaction: ModalSubmitInteraction) {
		if (!process.env.OWNERS) {
			throw new Error('No Owners defined');
		}

		const input = interaction.fields.getTextInputValue('SafetyContext');

		await this.container.client.users.fetch(process.env.OWNERS)
			.then(owner => owner.send(input === '' ? 'No context provided' : input));

		interaction.reply({
			content: `${input === '' ? 'No additional context was sent' : 'I\'ve sent that context'}`,
			ephemeral: true
		});
	}

}
