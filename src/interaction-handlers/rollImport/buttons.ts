import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction } from 'discord.js';

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class rollImport extends InteractionHandler {

	public async parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('RollImport')) {
			return this.none();
		}
		const [, userId, character, type] = interaction.customId.split('|');

		return this.some({ userId, character, type });
	}

	public async run(interaction: ButtonInteraction, { userId, character, type }: InteractionHandler.ParseResult<this>) {
		if (interaction.user.id !== userId) {
			return interaction.reply({ content: 'You can\'t import other peoples rolls', ephemeral: true });
		}

		const importAll = type === 'all';

		await this.container.db.quickRolls.updateMany({
			user: userId,
			'importInfo.type': importAll ? { $exists: true } : type,
			'importInfo.character':	character
		}, {
			$set: { active: true }
		});

		const newButtons: ActionRowBuilder<ButtonBuilder>[] = [];
		interaction.message.components.forEach((row) => {
			newButtons.push(
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents(row.components.map(button =>
						new ButtonBuilder({ ...button.data, disabled: button.disabled || importAll || button.customId?.includes(type) })
					))
			);
		});

		await interaction.message.edit({ components: newButtons });

		return interaction.reply({ content: 'Imported rolls!', ephemeral: true });
	}

}
