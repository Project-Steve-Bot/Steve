import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { SteveCommand } from '../../lib/extensions/SteveCommand';
import { pickRandom } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'When should I do something?',
	aliases: ['wsi']
})
export class UserCommand extends SteveCommand {

	private replies = [
		'You should do that now',
		'Do that in the next fifteen minutes',
		'NOW! STOP ASKING AND DO IT! DO IT NOW!',
		'Its important and you know it, what do you think?',
		'If you need to ask, you should probably do it'
	];

	public async messageRun(msg: Message) {
		return send(msg, pickRandom(this.replies));
	}

}
