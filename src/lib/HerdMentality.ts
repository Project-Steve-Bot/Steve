import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Collection,
	ComponentEmojiResolvable,
	EmbedBuilder,
	GuildMember,
	Message,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder
} from 'discord.js';
import { pluralize, sendLoadingMessage } from './utils';
import { promptList } from '../assets/herdMentalityPrompts.json';

export class HerdMentalityManager {

	public readonly id: string;

	private judge: GuildMember;
	private players = new Collection<string, string>();
	private answers = new Collection<string, string>();
	private points = new Collection<string, number>();

	private currentBoard: Message;
	private currentQuestion: Question | undefined;
	private currentAnswers = new Collection<string, string>();

	private questions = promptList.reduce((collection, { id, question }) =>
		collection.set(id, question), new Collection<string, Question>());

	public constructor(loadingMessage: Message, judge: GuildMember) {
		this.currentBoard = loadingMessage;
		this.id = this.currentBoard.id;
		this.judge = judge;

		this.players.set(this.judge.id, 'Joined');
		this.points.set(this.judge.id, 0);
	}

	private get endGameButton() {
		return this.makeButton({
			action: 'End',
			label: 'End Game',
			judgeOnly: true,
			style: ButtonStyle.Danger
		});
	}

	public get currentQuestionText() {
		return this.currentQuestion?.text ?? 'There is currently no prompt.';
	}

	// Game Lifecycle
	public async sendLobby() {
		const embed = new EmbedBuilder()
			.setColor('Aqua')
			.setTitle(`${this.judge.displayName} Started a game of Herd Mentality`);

		const buttons = new ActionRowBuilder<ButtonBuilder>();

		buttons.addComponents(
			this.makeButton({
				action: 'Join',
				label: 'Join!',
				judgeOnly: false,
				style: ButtonStyle.Primary
			}),
			this.makeButton({
				action: 'Start',
				label: 'Start Game',
				judgeOnly: true,
				style: ButtonStyle.Success,
				emote: '✅'
			}),
			this.endGameButton
		);

		await this.currentBoard.edit({
			content: ' ',
			embeds: [embed],
			components: [buttons]
		});

		await new Promise(resolve => setTimeout(resolve, 500));

		await this.updatePlayerStats('Click below to join!\n**Players**');
	}

	public async addPlayer(playerId: string) {
		this.players.set(playerId, this.currentQuestion ? 'Waiting...' : 'Joined');
		this.points.set(playerId, 0);
		await this.updatePlayerStats(this.currentQuestion ? '' : 'Click below to join!\n**Players**');
	}

	public async endRound() {
		this.players.forEach((_, player) => this.players.set(player, this.answers.get(player) ?? 'Did not answer ☹️'));
		const selectablePlayers = this.players.filter(resp => resp !== 'Did not answer ☹️');
		const components = [
			new ActionRowBuilder<StringSelectMenuBuilder>()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`Herd|Winners|${this.judge.id}|${this.id}`)
						.setPlaceholder('Choose the winners!')
						.setMinValues(0)
						.setMaxValues(selectablePlayers.size)
						.addOptions(selectablePlayers.map((_, id) =>
							new StringSelectMenuOptionBuilder()
								.setValue(id)
								.setLabel(this.judge.guild.members.cache.get(id)?.displayName ?? id)
						))
				),
			/* For the Future
			new ActionRowBuilder<StringSelectMenuBuilder>()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`Herd|Cow|${this.judge.id}|${this.id}`)
						.setPlaceholder('Choose a Cow of Shame')
						.setMinValues(0)
						.setMaxValues(1)
						.addOptions(this.players.map((_, id) =>
							new StringSelectMenuOptionBuilder()
								.setValue(id)
								.setLabel(this.judge.guild.members.cache.get(id)?.displayName ?? id)
						))
				),
			*/
			new ActionRowBuilder<ButtonBuilder>()
				.addComponents(
					this.makeButton({
						action: 'Next',
						label: 'Next Prompt!',
						judgeOnly: true,
						style: ButtonStyle.Primary,
						emote: '⏭️'
					}),
					this.endGameButton
				)
		];

		await this.updatePlayerStats(`${this.judge.displayName}, pick the winners!`).then(msg => msg.edit({ components }));
	}

	public async endGame() {
		await this.disableBoard(this.currentBoard);
	}

	// Player Actions
	public async sendQuestion() {
		const embed = new EmbedBuilder();
		const buttons = new ActionRowBuilder<ButtonBuilder>();
		const questionId = this.questions.randomKey();
		this.currentQuestion = this.questions.get(questionId ?? '');

		this.players.forEach((_, player) => {
			this.currentAnswers.set(player, 'No Answer');
			this.players.set(player, 'Waiting...');
		});

		this.answers.clear();

		if (!questionId || !this.currentQuestion) {
			embed.setColor('Red')
				.setTitle('There are no more prompts left!');
		} else {
			embed.setTitle(this.currentQuestion.text)
				.setImage(this.currentQuestion.url ?? null)
				.setColor('Aqua');

			buttons.addComponents(
				this.makeButton({
					action: 'AddAnswer',
					judgeOnly: false,
					label: 'Answer!',
					style: ButtonStyle.Primary,
					emote: '📝'
				}),
				this.makeButton({
					action: 'EndRound',
					judgeOnly: true,
					label: 'End Round Early',
					style: ButtonStyle.Secondary,
					emote: '⏭️'
				}),
				this.endGameButton
			);
			this.questions.delete(questionId);
		}

		await this.updateBoard();
		await this.currentBoard.edit({
			content: ' ',
			embeds: [embed],
			components: [buttons]
		});
		await this.updatePlayerStats();
	}

	public async addAnswer(playerId: string, answer: string) {
		this.answers.set(playerId, answer);
		this.players.set(playerId, 'Answered!');

		await this.updatePlayerStats();

		if (this.players.every(state => state === 'Answered!')) {
			await this.endRound();
		}
	}

	public async chooseWinners(winners: string[]) {
		this.players.forEach((_, player) => {
			if (winners.includes(player)) {
				const newPoints = (this.points.get(player) ?? 0) + 1;
				this.points.set(player, newPoints);
				this.players.set(player, `${newPoints} ${pluralize('point', newPoints)}: ${this.answers.get(player) ?? 'No answer'} - Winner! `);
			} else {
				const points = this.points.get(player) ?? 0;
				this.players.set(player, `${points} ${pluralize('point', points)} : ${this.answers.get(player) ?? 'No answer'}`);
			}
		});

		const components = [
			new ActionRowBuilder<StringSelectMenuBuilder>()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`Herd|Winners|${this.judge.id}|${this.id}`)
						.setPlaceholder('Choose the winners!')
						.addOptions(new StringSelectMenuOptionBuilder().setLabel('Dummy').setValue('Dummy'))
						.setDisabled(true)
				),
			/* For the Future
			new ActionRowBuilder<StringSelectMenuBuilder>()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`Herd|Cow|${this.judge.id}|${this.id}`)
						.setPlaceholder('Choose a Cow of Shame')
						.setMinValues(0)
						.setMaxValues(1)
						.addOptions(this.players.map((_, id) =>
							new StringSelectMenuOptionBuilder()
								.setValue(id)
								.setLabel(this.judge.guild.members.cache.get(id)?.displayName ?? id)
						))
				),
			*/
			new ActionRowBuilder<ButtonBuilder>()
				.addComponents(
					this.makeButton({
						action: 'Next',
						label: 'Next Prompt!',
						judgeOnly: true,
						style: ButtonStyle.Primary,
						emote: '⏭️'
					}),
					this.endGameButton
				)
		];
		await this.updatePlayerStats().then(msg => msg.edit({ components }));
	}

	// Game Management
	private async updateBoard(): Promise<Message> {
		if (this.currentBoard.id !== this.currentBoard.channel.lastMessageId) {
			const newBoard = await sendLoadingMessage(this.currentBoard);
			await this.disableBoard(this.currentBoard);
			this.currentBoard = newBoard;
		}
		return this.currentBoard;
	}

	private async updatePlayerStats(description = ''): Promise<Message> {
		const currentEmbed = this.currentBoard.embeds.at(0);

		if (!currentEmbed) {
			throw new Error('CurrentBoard has no embeds');
		}

		const statString = this.players.reduce((acc, stat, player) => `${acc}\n<@${player}>: ${stat}`, '');

		const newContent = `${description}${statString}`;

		const newEmbed = new EmbedBuilder(currentEmbed.data).setDescription(newContent);

		return this.currentBoard.edit({ embeds: [newEmbed] });
	}

	private async disableBoard(board: Message) {
		const buttons = board.components.at(0);

		if (!buttons || buttons.components.length === 0) {
			return;
		}

		await board.edit({
			content: 'This game is now over',
			components: []
		});
		return;
	}

	// Utilities
	private makeButton(options: { action:string, judgeOnly: boolean, label:string, style: ButtonStyle, emote ?: ComponentEmojiResolvable }): ButtonBuilder {
		const button = new ButtonBuilder()
			.setCustomId(`Herd|${options.action}|${options.judgeOnly ? `${this.judge.id}|` : ''}${this.id}`)
			.setLabel(options.label)
			.setStyle(options.style);

		if (options.emote) {
			button.setEmoji(options.emote);
		}

		return button;
	}

};

export type Question = {
	text: string;
	url?: string;
};
