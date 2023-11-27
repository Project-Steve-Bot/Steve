import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

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
				content: 'I don\'t know how you managed it but somehow, you clicked a button on a game that doesn\'t exits',
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
				if (!args.includes(interaction.user.id)) {
					await interaction.reply({
						content: 'I\'m sorry, but I can\'t let you do that',
						ephemeral: true
					});
				}

				await manager.sendQuestion();
				break;
			case 'AddAnswer':
				await interaction.showModal(new ModalBuilder()
					.setTitle(manager.currentQuestionText)
					.setCustomId(`Herd|SubmitAnswer|${manager.id}`)
					.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId('Answer')
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
				interaction.reply({ content: 'Something went wrong!', ephemeral: true });
				break;
		}
	}

}