import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { Interaction } from 'discord.js';


@ApplyOptions<Listener.Options>({
	event: 'interactionCreate'
})
export class UserEvent extends Listener {

	public async run(interaction: Interaction) {
		if (!interaction.isButton() || interaction.customId !== 'remove all components') return;

		interaction.update({ components: [] });
	}

}
