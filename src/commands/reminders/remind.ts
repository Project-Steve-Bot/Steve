import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, type CommandOptions, UserError } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Guild, Message, time, TimestampStyles, User } from 'discord.js';
import parse from 'parse-duration';
import prettyMilliseconds from 'pretty-ms';
import { oneLine, stripIndent } from 'common-tags';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { resolveDurationOrTimestamp } from '@lib/resolvers';

@ApplyOptions<CommandOptions>({
	description: 'Create a new reminder',
	options: ['repeat', 'every'],
	detailedDescription: {
		usage: '<duration> <reminder> (--repeat=duration)',
		examples: [
			`12h Improve ${process.env.BOT_NAME}!`,
			'"1 hour 30 minutes" Call mom --every="7 days"'
		],
		extendedHelp: stripIndent`
			• The duration of a reminder comes first now and needs to be in quotes if it has spaces.
			• You can't have a reminder repeat faster than once a minute.
			• Repeating reminders won't stop until you cancel them`
	}
})
export class RemindCommand extends SteveCommand {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option => option
					.setName('durationortimestamp')
					.setDescription('The time that or the time until you want the reminder to be sent')
					.setRequired(true))
				.addStringOption(option => option
					.setName('content')
					.setDescription('What should I remind you about?')
					.setRequired(true))
				.addStringOption(option => option
					.setName('repeat')
					.setDescription('How often do you want me to remind you?'));
		}, { idHints: this.container.idHits.get(this.name) });
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const rawDurationOrTime = interaction.options.getString('durationortimestamp', true);
		const durationOrTimeResult = await resolveDurationOrTimestamp(rawDurationOrTime, interaction.user);

		if (durationOrTimeResult.isErr()) {
			return interaction.editReply('Please provide a valid duration or timestamp.');
		}

		const durationOrTimestamp = durationOrTimeResult.unwrap();
		const content = interaction.options.getString('content', true);
		const rawRepeat = interaction.options.getString('repeat');

		const response = await this.setReminder(content, durationOrTimestamp, interaction.user, interaction.channelId, interaction.guild, rawRepeat);
		return interaction.editReply(response);
	}

	public async messageRun(msg: Message, args: Args) {
		const durationOrTimeResult = await args.pickResult('durationOrTimestamp');
		if (durationOrTimeResult.isErr()) {
			return send(msg, 'Please provide a valid duration or timestamp.');
		}

		const durOrTime = durationOrTimeResult.unwrap();
		const content = await args.rest('string');
		const rawRepeat = args.getOption('repeat', 'every');

		const response = await this.setReminder(content, durOrTime, msg.author, msg.channelId, msg.guild, rawRepeat);

		return send(msg, response);
	}

	private async setReminder(
		content: string,
		durationOrTimestamp: Date | number,
		user: User,
		executionChannel: string,
		guild: Guild | null,
		rawRepeat: string | null
	): Promise<string> {
		const repeat = rawRepeat ? parse(rawRepeat) : null;
		if (repeat && repeat < 60e3) {
			throw new UserError({
				identifier: 'RemindRepeatTooShort',
				message: 'A reminder cannot repeat faster than once a minute.'
			});
		}

		const isDur = typeof durationOrTimestamp === 'number';

		if (!isDur && durationOrTimestamp.getTime() < Date.now()) {
			return 'Sorry but I can\'t send reminders into the past.';
		}

		const expires = isDur ? new Date(durationOrTimestamp + Date.now()) : durationOrTimestamp;

		const mode = guild ? 'public' : 'private';

		const channel = guild
			? (await this.container.db.guilds.findOne({ id: guild.id }))?.channels?.reminder ?? executionChannel
			: executionChannel;

		await this.container.db.reminder.insertOne({
			content,
			user: user.id,
			mode,
			repeat,
			channel,
			expires
		});

		return oneLine`I'll remind you about that at ${time(expires, TimestampStyles.ShortDateTime)}${
			repeat
				? `and again every ${prettyMilliseconds(repeat, { verbose: true })}`
				: ''
		}.`;
	}

}
