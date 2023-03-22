import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: 'Shuts down the bot',
	preconditions: ['OwnerOnly'],
	aliases: ['reboot']
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message) {
		await send(msg, 'Shutting down...');
		await this.container.client.destroy();
		process.exit();
	}

}
