import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
	description: 'ping pong',
})
export class UserCommand extends Command {

	public async messageRun(message: Message) {
		const msg = await send(message, 'Ping?');

		const content = `Pong! (Roundtrip took: ${
			(msg.editedTimestamp || msg.createdTimestamp) -
			(message.editedTimestamp || message.createdTimestamp)
		}ms. Heartbeat: ${Math.round(this.container.client.ws.ping)}ms.)`;

		return send(message, content);
	}

}
