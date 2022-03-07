import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { SteveCommand } from '../../lib/extensions/SteveCommand';
import { pickRandom } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Ask the magic 8 ball a question.'
})
export class UserCommand extends SteveCommand {

	private MAGIC8BALL_RESPONSES = [
		'Yes, Ruby should go to bed',
		'Read the blog, do the Dew',
		'Lincoln Nebraska',
		'If at first you don\'t succeed, skydiving is not for you',
		'If you\'re asking a robot, you know its a bad idea',
		'self care is the answer, do self care',
		'Ruby is vocal about the NO',
		'Ask Reginald instead',
		'Ask when I\'m not eating a eucalyptus leaf',
		'Legally, no. Morally, no. But technically...',
		'Stove said yes but I\'m gonna suggest you not listen to him'
	];

	public async messageRun(msg: Message, args: Args) {
		if (args.finished) {
			return send(msg, 'You gonna ask a question there?');
		}

		if (!(await args.rest('string')).endsWith('?')) {
			return send(msg, 'The magic 8 ball only responds to questions, smh!');
		}

		return send(msg, pickRandom(this.MAGIC8BALL_RESPONSES));
	}

}
