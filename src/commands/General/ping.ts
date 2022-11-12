import { SteveCommand } from '@lib/extensions/SteveCommand';
import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
	description: 'ping pong'
})
export class UserCommand extends SteveCommand {

	public override registerApplicationCommands(registry: Command.Registry) {
		this.container.logger.debug(this.container.idHits.get(this.name));
		registry.registerChatInputCommand(builder => {
			builder
				.setName(this.name)
				.setDescription(this.description);
		}, { idHints: this.container.idHits.get(this.name) });
	}

	public override async chatInputRun(interaction: Command.ChatInputInteraction) {
		await interaction.reply('Ping?');
		interaction.editReply(`Pong! (Roundtrip took: ${interaction.createdTimestamp - Date.now()
		}ms. Heartbeat: ${Math.round(this.container.client.ws.ping)}ms.)`);
	}

	public async messageRun(message: Message) {
		const msg = await send(message, 'Ping?');

		const content = `Pong! (Roundtrip took: ${
			(msg.editedTimestamp || msg.createdTimestamp) -
			(message.editedTimestamp || message.createdTimestamp)
		}ms. Heartbeat: ${Math.round(this.container.client.ws.ping)}ms.)`;

		return send(message, content);
	}

}
