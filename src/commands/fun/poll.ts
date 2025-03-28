import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, type CommandOptions, UserError } from '@sapphire/framework';
import { chunk } from '@sapphire/utilities';
import { type EmbedAuthorData, Message, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, time, TimestampStyles, ApplicationCommandType, userMention } from 'discord.js';
import { stripIndent } from 'common-tags';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { getLoadingMessage, sendLoadingMessage } from '@lib/utils';
import { DateTime, Duration } from 'luxon';
import { resolveDuration } from '@lib/resolvers';

const NUMBER_EMOTES = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

@ApplyOptions<CommandOptions>({
	description: 'Create a poll!',
	aliases: ['vote'],
	flags: ['monoselect', 'ms', 'anonymous', 'anon'],
	options: ['ends'],
	detailedDescription: {
		usage: '<question> | <choices...> (--ends=duration) (--monoselect) (--anonymous)',
		examples: [
			'Is butt legs? | Butt is legs | Butt is butt',
			'Should I do it? | Do it | Let your dreams be memes --ends:30m'
		],
		extendedHelp: stripIndent`
		• Polls must have at least two options an no more than 10.
		• You can limit people to only vote for one option with the \`--monoselect\` flag.
		• You can specify when a poll should end with the \`--ends\` option. By default, polls end after 24 hours.
		• By default, you'll see who voted for what when a poll ends. You can turn that off with the \`--anonymous\` flag.`
	}
})
export class PollCommand extends SteveCommand {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option =>
					option
						.setName('question')
						.setDescription('The question you\'re asking')
						.setRequired(true)
				);

			for (let i = 1; i <= 10; i++) {
				builder.addStringOption(option => option.setName(`option${i}`).setDescription(`Option ${i}`).setRequired(i <= 2));
			}

			return builder
				.addStringOption(option => option.setName('ends').setDescription('How log until the poll ends (default 24h)'))
				.addBooleanOption(option =>
					option
						.setName('monoselect')
						.setDescription('Only allow people to chose one option (default false)')
				)
				.addBooleanOption(option =>
					option
						.setName('anonymous')
						.setDescription('Hides who voted for what at the end of the poll (default false)')
				);
		});

		registry.registerContextMenuCommand(builder => {
			builder
				.setName('Poll: Show Voters')
				.setType(ApplicationCommandType.Message);
		});
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		interaction.reply(getLoadingMessage());

		const question = interaction.options.getString('question', true);
		const choices: string[] = [];

		for (let i = 1; i <= 10; i++) {
			const maybeChoice = interaction.options.getString(`option${i}`);
			if (maybeChoice) {
				choices.push(maybeChoice);
			}
		}

		const reply = await interaction.fetchReply();

		let showName = interaction.user.username;
		let showAvatar = interaction.user.displayAvatarURL();

		if (interaction.member && 'displayName' in interaction.member) {
			showName = interaction.member.displayName;
			showAvatar = interaction.member.displayAvatarURL();
		}

		const editReply = await this.generatePoll({
			question,
			choices,
			rawExpires: interaction.options.getString('ends'),
			multiSelect: !interaction.options.getBoolean('monoselect'),
			anonymous: !!interaction.options.getBoolean('anonymous'),
			messageId: reply.id,
			channelId: interaction.channelId,
			author: { name: `${showName} asks...`, iconURL: showAvatar }
		});

		interaction.editReply(editReply);
	}

	public async messageRun(msg: Message, args: Args) {
		const choices = (await args.rest('string')).split('|').map(item => item.trim());
		const question = choices.shift();

		if (!question || choices.length < 2 || choices.length > 10) {
			throw new UserError({
				identifier: 'InvalidChoiceAmount',
				message:
					'Polls must have at least two options an no more than 10.'
			});
		}

		const response = await sendLoadingMessage(msg);

		const editReply = await this.generatePoll({
			question,
			choices,
			rawExpires: args.getOption('ends'),
			multiSelect: !args.getFlags('monoselect', 'ms'),
			anonymous: args.getFlags('anonymous', 'anon'),
			messageId: response.id,
			channelId: response.channel.id,
			author: {
				name: `${msg.member?.displayName ?? msg.author.username} asks...`,
				iconURL: msg.member?.displayAvatarURL() ?? msg.author.displayAvatarURL()
			}
		});

		response.edit(editReply);
	}

	private async generatePoll(
		{ question, choices, rawExpires, multiSelect, anonymous, messageId, channelId, author }:
		{
			question: string,
			choices: string[],
			rawExpires: string | null,
			multiSelect: boolean,
			anonymous: boolean,
			messageId: string,
			channelId: string,
			author: EmbedAuthorData
		}
	): Promise<{ content: ' ', embeds: EmbedBuilder[], components: ActionRowBuilder<ButtonBuilder>[]}> {
		if (choices.length < 2 || choices.length > 10) {
			throw new UserError({
				identifier: 'InvalidChoiceAmount',
				message:
					'Polls must have at least two options an no more than 10.'
			});
		}

		choices = choices.map((choice, idx) => `${NUMBER_EMOTES[idx]} ${choice}`);
		const length = rawExpires ? resolveDuration(rawExpires).unwrap() : Duration.fromObject({ day: 1 });
		const expires = DateTime.now().plus(length).toJSDate();

		const embed = new EmbedBuilder()
			.setTitle(question)
			.setColor('Random')
			.setAuthor(author)
			.setDescription(`${choices.join('\n')}\n\nThis poll ends at ${time(expires, TimestampStyles.ShortDateTime)}`);

		const components: ActionRowBuilder<ButtonBuilder>[] = [];

		chunk(choices, 2).forEach((pair) => {
			const row = new ActionRowBuilder<ButtonBuilder>();
			pair.forEach((choice) => {
				row.addComponents([
					new ButtonBuilder()
						.setCustomId(
							`poll|${choices.indexOf(choice)}|${messageId}`
						)
						.setStyle(ButtonStyle.Primary)
						.setLabel(
							choice.length < 80
								? choice
								: `${choice.substring(0, 77)}...`
						)
				]);
			});
			components.push(row);
		});

		await this.container.db.polls.insertOne({
			messageId, channelId, multiSelect, anonymous, expires, allVoters: [],
			choices: choices.map((choice) => ({
				text: choice,
				voters: [],
				votes: 0
			}))
		});

		return { content: ' ', embeds: [embed], components };
	}

	public async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		if (!interaction.isMessageContextMenuCommand()) {
			return interaction.reply({ content: 'This maze wasn\'t meant for you... What did you do.', ephemeral: true });
		}

		const poll = await this.container.db.polls.findOne({ messageId: interaction.targetMessage.id });

		if (!poll) {
			return interaction.reply({ content: 'This message either has no poll or the poll has ended.', ephemeral: true });
		}

		if (poll.anonymous) {
			return interaction.reply({
				content: 'This poll has been set to anonymous mode and therefor I can\'t show you the voters.',
				ephemeral: true
			});
		}

		return interaction.reply({
			content: `## Votes as of ${time(new Date(), TimestampStyles.ShortDateTime)}
${poll.choices.map((choice, idx) => `${NUMBER_EMOTES[idx]} ${choice.voters.map(userMention).join(', ')}`).join('\n')}`,
			allowedMentions: {},
			ephemeral: true
		});
	}

}
