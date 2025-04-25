import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, type CommandOptions, UserError } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Guild, Message, time, TimestampStyles, User } from 'discord.js';
import { oneLine, stripIndent } from 'common-tags';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { resolveDuration, resolveDurationOrTimestamp } from '@lib/resolvers';
import { DateTime, Duration } from 'luxon';

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
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const rawDurationOrTime = interaction.options.getString('durationortimestamp', true);
		const durationOrTimestamp = await this.processDurationOrTimestamp(rawDurationOrTime, interaction.user);

		const content = interaction.options.getString('content', true);
		const rawRepeat = interaction.options.getString('repeat');

		const response = await this.setReminder(content, durationOrTimestamp, interaction.user, interaction.channelId, interaction.guild, rawRepeat);
		return interaction.editReply(response);
	}

	public async messageRun(msg: Message, args: Args) {
		const rawDurationOrTime = await args.pickResult('string');
		const durationOrTimestamp = await this.processDurationOrTimestamp(rawDurationOrTime.unwrap(), msg.author);

		const content = await args.rest('string');
		const rawRepeat = args.getOption('repeat', 'every');

		const response = await this.setReminder(content, durationOrTimestamp, msg.author, msg.channelId, msg.guild, rawRepeat);

		return send(msg, response);
	}

	private async processDurationOrTimestamp(input: string, user: User): Promise<DateTime | Duration> {
		const possibleDurOrTime = await resolveDurationOrTimestamp(input, user);
		if (possibleDurOrTime.isOk()) {
			return possibleDurOrTime.unwrap();
		}

		const errorType = possibleDurOrTime.err().unwrap();
		if (errorType === 'InvalidDurationOrTimestamp') {
			throw new UserError({ identifier: errorType });
		}

		const dbUser = await this.container.db.users.findOne({ id: user.id });
		const formats = dbUser?.dateTimeFormats;
		const zone = dbUser?.timezone;
		if (!formats) {
			throw new Error('No formats for UnknownFormat Error, this should be impossible');
		}

		const now = DateTime.now().setZone(zone);
		const message = `The timestamp you provided did not match any of your set formats. Your Current formats are:
${formats.map(format => `\`${format}\`: ${now.toFormat(format)}`).join('\n')}`;

		throw new UserError({ identifier: errorType, message });
	}

	private async setReminder(
		content: string,
		durationOrTimestamp: DateTime | Duration,
		user: User,
		executionChannel: string,
		guild: Guild | null,
		rawRepeat: string | null
	): Promise<string> {
		const repeat = rawRepeat ? resolveDuration(rawRepeat).unwrap() : null;
		if (repeat && repeat.as('minutes') < 1) {
			throw new UserError({
				identifier: 'RemindRepeatTooShort',
				message: 'A reminder cannot repeat faster than once a minute.'
			});
		}

		const isDur = Duration.isDuration(durationOrTimestamp);

		if (!isDur && durationOrTimestamp < DateTime.now()) {
			return 'Sorry but I can\'t send reminders into the past.';
		}
		const dbUser = await this.container.db.users.findOne({ id: user.id });
		const zone = dbUser?.timezone;

		const expires = isDur
			// Makes a new DateTime in the users timezone and then adds the duration to it
			? DateTime.now().setZone(zone).plus(durationOrTimestamp).toJSDate()
			: durationOrTimestamp.toJSDate();

		const mode = guild ? 'public' : 'private';

		const channel = guild
			? (await this.container.db.guilds.findOne({ id: guild.id }))?.channels?.reminder ?? executionChannel
			: executionChannel;

		await this.container.db.reminder.insertOne({
			content,
			user: user.id,
			mode,
			repeat: repeat?.toObject() ?? null,
			channel,
			expires
		});

		return oneLine`I'll remind you about that at ${time(expires, TimestampStyles.ShortDateTime)}${
			repeat
				? `and again every ${repeat.toHuman()}`
				: ''
		}.`;
	}

}
