import { ApplyOptions } from '@sapphire/decorators';
import { Args, CommandOptions, UserError } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import parse from 'parse-duration';
import prettyMilliseconds from 'pretty-ms';
import { SteveCommand } from '../../lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: 'Create a new reminder',
	options: ['repeat', 'every'],
	detailedDescription: {
		usage: '<duration> <reminder> (--repeat=duration)',
		examples: [`12h Improve ${process.env['BOT_NAME']}!`, '"1 hour 30 minutes" Call mom --every="7 days"'],
		extendedHelp: `• The duration of a reminder comes first now and needs to be in quotes if it has spaces.
			• You can't have a reminder repeat faster than once a minute.
			• Repeating reminders won't stop until you cancel them`.replace('\t', '')
	}
})
export class UserCommand extends SteveCommand {
	public async messageRun(msg: Message, args: Args) {
		const duration = await args.pick('duration');
		const expires = new Date(duration + Date.now());

		const content = await args.rest('string');
		const mode = msg.guild ? 'public' : 'private';
		const user = msg.author.id;

		const rawRepeat = args.getOptions('repeat', 'every');
		const repeat = rawRepeat ? parse(rawRepeat[0]) : null;
		if (repeat && repeat < 60e3) {
			throw new UserError({
				identifier: 'RemindRepeatTooShort',
				message: 'A reminder cannot repeat faster than once a minute.'
			});
		}

		const channel = msg.guild ? (await this.client.db.guilds.findOne({ id: msg.guild.id }))?.channels?.reminder ?? msg.channelId : msg.channelId;

		await this.client.db.reminder.insertOne({
			content,
			user,
			mode,
			repeat,
			channel,
			expires
		});

		return send(msg, `I'll remind you about that at <t:${Math.round(expires.valueOf() / 1e3)}>${
			repeat
			? `and again every ${prettyMilliseconds(repeat, { verbose: true })}`
			: ''
		}.`);
	}
}
