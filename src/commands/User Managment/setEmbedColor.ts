import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, MessageEmbed } from 'discord.js';
import { SteveCommand } from '../../lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: 'Set the color used in some embeds',
	aliases: ['embedcolor'],
	detailedDescription: {
		usage: '<color>',
		examples: ['blue', '#000855'],
		extendedHelp:
			'Colors must follow [**The Rules of Color**](https://discord.js.org/#/docs/discord.js/stable/typedef/ColorResolvable)'
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		const color = await args.pick('color');

		await this.client.db.users.findOneAndUpdate(
			{ id: msg.author.id },
			{ $set: { embedColor: `#${color.toString(16).padStart(6, '0')}` } },
			{ upsert: true }
		);

		send(msg, {
			embeds: [
				new MessageEmbed()
					.setColor(color)
					.setDescription('This is your new embed color!')
			]
		});
	}

}
