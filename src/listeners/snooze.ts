import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { Interaction } from 'discord.js';


@ApplyOptions<Listener.Options>({
	event: 'interactionCreate'
})
export class UserEvent extends Listener {

	public async run(interaction: Interaction) {
		if (!interaction.isButton() || !interaction.customId.startsWith('snooze')) return;
		await interaction.deferUpdate();

		if (!interaction.customId.includes(interaction.user.id)) {
			return interaction.followUp({ content: 'You can\'t snooze other peoples reminders.', ephemeral: true });
		}

		return interaction.followUp({ content: 'Snooze case.', ephemeral: true });
		// return interaction.editReply({ components: [] });
	}

}
