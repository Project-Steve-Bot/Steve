import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { makeColorEmbed } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Set the background color of the faxes you receive.',
	aliases: ['faxbg', 'faxbackground'],
	detailedDescription: {
		usage: '<color>',
		examples: ['white', '000855']
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		const color = await args.pick('color');

		await this.container.db.users.findOneAndUpdate(
			{ id: msg.author.id },
			{ $set: { 'fax.background': `#${color.toString(16).padStart(6, '0')}` } },
			{ upsert: true }
		);

		send(msg, {	embeds: [makeColorEmbed(color).setDescription('This is your new fax background color!')] });
	}

}
