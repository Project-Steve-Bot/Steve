import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, type Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { send } from '@sapphire/plugin-editable-commands';
import { oneLine } from 'common-tags';

@ApplyOptions<CommandOptions>({
	description: 'Creates **The Button**',
	requiredUserPermissions: PermissionFlagsBits.Administrator
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message) {
		await send(msg, {
			content: `# The Button\n${oneLine(`Below is **The Button**. Clicking it will immediately notify ${msg.author.displayName}.
			You can choose to add context or not.`)}`,
			components: [
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents(new ButtonBuilder()
						.setCustomId(`SafetyButton|${msg.author.id}`)
						.setLabel('The Button')
						.setStyle(ButtonStyle.Primary)
					)
			]
		});

		msg.delete();
	}

}
