import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { Interaction } from 'discord.js';


@ApplyOptions<Listener.Options>({
	event: 'interactionCreate'
})
export class UserEvent extends Listener {

	public async run(interaction: Interaction) {
		if (interaction.isButton() && interaction.customId.startsWith('remove all components')) {
			if (interaction.customId !== `remove all components|${interaction.user.id}`) {
				return interaction.reply({ content: 'How do you know if thats done or not mate?', ephemeral: true });
			}

			interaction.update({ components: [] });
		}
	}

}
