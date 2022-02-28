import { ApplyOptions } from '@sapphire/decorators';
import { Args, CommandOptions, UserError } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { ColorResolvable, Message, MessageEmbed, Util } from 'discord.js';
import { SteveCommand } from '../../lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: 'Set the color used in some embeds',
	aliases: ['embedcolor'],
	detailedDescription: {
		usage: '<color>',
		examples: ['blue', '#000855'],
		extendedHelp: 'Colors must follow [**The Rules of Color**](https://discord.js.org/#/docs/discord.js/stable/typedef/ColorResolvable)'
	}
})
export class UserCommand extends SteveCommand {
	public async messageRun(msg: Message, args: Args) {
		const rawColor = await args.pick('string');

		let color: ColorResolvable;

		try {
			color = Util.resolveColor(rawColor.toUpperCase() as ColorResolvable);
		} catch {
			throw new UserError({
				identifier: 'InvalidColor',
				message: 'Colors must follow **The Rules of Color** (<https://discord.js.org/#/docs/discord.js/stable/typedef/ColorResolvable>)'
			});
		}

		await this.client.db.users.findOneAndUpdate(
			{ id: msg.author.id },
			{ $set: { embedColor: `#${color.toString(16).padStart(6, '0')}` } },
			{ upsert: true }
		);

		send(msg, { embeds: [new MessageEmbed().setColor(color).setDescription('This is your new embed color!')] });
	}
}
