import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, ComponentType, EmbedBuilder, GuildMember, Message } from 'discord.js';
import { sendLoadingMessage } from './utils';
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
		return new ButtonBuilder()
			.setCustomId(`Herd|End|${this.judge.id}|${this.id}`)
			.setLabel('End Game')
			.setStyle(ButtonStyle.Danger);
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
			new ButtonBuilder()
				.setCustomId(`Herd|Join|${this.id}`)
				.setLabel('Join!')
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId(`Herd|Start|${this.judge.id}|${this.id}`)
				.setLabel('Start Game')
				.setStyle(ButtonStyle.Success)
				.setEmoji('✅'),
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
		this.players.set(playerId, 'Joined');
		await this.updatePlayerStats('Click below to join!\n**Players**');
	}

	public async endRound() {
		this.players.forEach((_, player) => this.players.set(player, this.answers.get(player) ?? 'Did not answer ☹️'));
		await this.updatePlayerStats(`${this.judge.displayName}, pick the winners!`);
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
				new ButtonBuilder()
					.setCustomId(`Herd|AddAnswer|${this.id}`)
					.setLabel('Answer!')
					.setStyle(ButtonStyle.Primary)
					.setEmoji('📝'),
				this.endGameButton
			);
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

	// Game Management
	private async updateBoard(): Promise<Message> {
		if (this.currentBoard.id !== this.currentBoard.channel.lastMessageId) {
			const newBoard = await sendLoadingMessage(this.currentBoard);
			await this.disableBoard(this.currentBoard);
			this.currentBoard = newBoard;
		}
		return this.currentBoard;
	}

	private async updatePlayerStats(description = '') {
		const currentEmbed = this.currentBoard.embeds.at(0);

		if (!currentEmbed) {
			throw new Error('CurrentBoard has no embeds');
		}

		const statString = this.players.reduce((acc, stat, player) => `${acc}\n<@${player}>: ${stat}`, '');

		const newContent = `${description}${statString}`;

		const newEmbed = new EmbedBuilder(currentEmbed.data).setDescription(newContent);

		await this.currentBoard.edit({ embeds: [newEmbed] });
	}

	private async disableBoard(board: Message) {
		const buttons = board.components.at(0);

		if (!buttons || buttons.components.length === 0) {
			return;
		}

		await board.edit({
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					buttons.components.map(({ data }) => new ButtonBuilder({
						...data,
						type: ComponentType.Button,
						disabled: true
					}))
				)
			]
		});
		return;
	}

};

export type Question = {
	text: string;
	url?: string;
};
