import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonInteraction, ModalBuilder, ModalSubmitInteraction, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';

@ApplyOptions<InteractionHandlerOptions>({
	name: 'HerdMentalityButtonHandler',
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class HerdMentalityButtonHandler extends InteractionHandler {

	public parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('Herd|')) {
			return this.none();
		}

		const manager = this.container.hmGames.get(interaction.customId.split('|').at(-1) ?? '');

		if (!manager) {
			interaction.reply({
				content: 'I don\'t know how you managed it but somehow, you clicked a button on a game that\'s over',
				ephemeral: true
			});
			throw new Error(`NoHerdFound\nNo HerdMentalityManager found for ${interaction.customId}`);
		}

		return this.some(manager);
	}

	public async run(interaction: ButtonInteraction, manager: InteractionHandler.ParseResult<this>) {
		const [action, ...args] = interaction.customId.split('|').slice(1, -1);

		switch (action) {
			case 'Join':
				interaction.deferUpdate();
				await manager.addPlayer(interaction.user.id);
				break;
			case 'Start':
			case 'Next':
				if (!args.includes(interaction.user.id)) {
					await interaction.reply({
						content: 'I\'m sorry, but I can\'t let you do that',
						ephemeral: true
					});
					break;
				}

				await manager.sendQuestion();
				break;
			case 'AddAnswer':
				await interaction.showModal(new ModalBuilder()
					.setTitle(manager.currentQuestionText.length <= 45
						? manager.currentQuestionText
						: `${manager.currentQuestionText.slice(0, 42)}...`)
					.setCustomId(`Herd|SubmitAnswer|${manager.id}`)
					.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId('Answer')
							.setLabel('What\'s your answer?')
							.setStyle(TextInputStyle.Short)
							.setRequired(true)
					))
				);
				break;
			case 'End':
				if (!args.includes(interaction.user.id)) {
					await interaction.reply({
						 content: 'Only the person who started the game can end it',
						ephemeral: true
					});
					break;
				}

				interaction.deferUpdate();
				await manager.endGame();
				this.container.hmGames.delete(manager.id);

				break;

			default:
				await interaction.reply({ content: 'Something went wrong!', ephemeral: true });
				throw new Error(`HMUnknownAction: ${action}`);
		}
	}

}

@ApplyOptions<InteractionHandlerOptions>({
	name: 'HerdMentalityModalHandler',
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class HerdMentalityModalHandler extends InteractionHandler {

	public parse(interaction: ModalSubmitInteraction) {
		if (!interaction.customId.startsWith('Herd|')) {
			return this.none();
		}

		const manager = this.container.hmGames.get(interaction.customId.split('|').at(-1) ?? '');

		if (!manager) {
			interaction.reply({
				content: 'I don\'t know how you managed it but somehow, you submitted an answer to a game that\'s over',
				ephemeral: true
			});
			throw new Error(`NoHerdFound\nNo HerdMentalityManager found for ${interaction.customId}`);
		}

		return this.some(manager);
	}

	public async run(interaction: ModalSubmitInteraction, manager: InteractionHandler.ParseResult<this>) {
		await interaction.deferUpdate();

		const answer = interaction.fields.getTextInputValue('Answer');
		await manager.addAnswer(interaction.user.id, answer);
	}

}

@ApplyOptions<InteractionHandlerOptions>({
	name: 'HerdMentalitySelectHandler',
	interactionHandlerType: InteractionHandlerTypes.SelectMenu
})
export class HerdMentalitySelectHandler extends InteractionHandler {

	public parse(interaction: StringSelectMenuInteraction) {
		if (!interaction.customId.startsWith('Herd|')) {
			return this.none();
		}

		const manager = this.container.hmGames.get(interaction.customId.split('|').at(-1) ?? '');

		if (!manager) {
			interaction.reply({
				content: 'I don\'t know how you managed it but somehow, you submitted an answer to a game that\'s over',
				ephemeral: true
			});
			throw new Error(`NoHerdFound\nNo HerdMentalityManager found for ${interaction.customId}`);
		}

		return this.some(manager);
	}

	public async run(interaction: StringSelectMenuInteraction, manager: InteractionHandler.ParseResult<this>) {
		if (!interaction.customId.includes(interaction.user.id)) {
			await interaction.reply({
				content: 'Sorry but you can\'t use this select menu',
				ephemeral: true
			});
			return;
		}
		await interaction.deferUpdate();
		manager.chooseWinners(interaction.values);
	}

}
