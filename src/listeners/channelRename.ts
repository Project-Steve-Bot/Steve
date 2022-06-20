import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { Interaction } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: 'interactionCreate',
	enabled: false
})
export class UserEvent extends Listener {

	public async run(interaction: Interaction): Promise<unknown> {
		if (!interaction.isButton() || !interaction.customId.startsWith('rename')) return;
		await interaction.deferUpdate();

		const votes = await this.container.db.channelRename.findOne({ messageId: interaction.message.id, channelId: interaction.channelId });

		if (!votes) {
			return interaction.followUp({ content: 'Something went wrong and I couldn\'t find this rename poll :(', ephemeral: true });
		}

		if (interaction.user.id === votes.requester) {
			return interaction.followUp({ content: 'You can\'t vote on your own suggestion', ephemeral: true });
		}
		return;
	}

}
