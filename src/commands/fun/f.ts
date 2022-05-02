import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import { Message, MessageAttachment } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CommandOptions>({
	description: 'Press F to pay respects'
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message) {
		send(msg, {
			files: [
				new MessageAttachment(`${__dirname}../../../../assets/pay_respects.png`)
					.setDescription('A screenshot of a cutscene from Call of Duty: Advanced Warfare, showing a US Marine\'s funeral. A quick-time-event prompt is showing, saying "Press F to pay respects."')
			]
		});
	}

}
