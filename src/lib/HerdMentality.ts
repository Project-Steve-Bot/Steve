import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, ComponentType, EmbedBuilder, GuildMember, Message } from 'discord.js';
import { sendLoadingMessage } from './utils';

const ZWS = '\u200B';

export class HerdMentalityManager {

	public readonly id: string;

	private judge: GuildMember;
	private players = new Collection<string, string>();

	private currentBoard: Message;
	private currentQuestion: Question | undefined;

	private questions = new Collection<string, Question>([
		['1', {
			text: 'How many Big Macs could a normal person eat in one 20-minute sitting?',
			url: 'https://i.imgur.com/0ETPUkB.png'
		}],
		['2', {
			text: 'What\'s the best playground game?',
			url: 'https://i.imgur.com/0jC0bcJ.png'
		}],
		['3', {
			text: 'Name a bird that doesn\'t fly.',
			url: 'https://i.imgur.com/1RJ3DYI.png'
		}],
		['4', {
			text: 'What is the best Disney film of all time?',
			url: 'https://i.imgur.com/1YK6i8u.png'
		}],
		['5', {
			text: 'What is the best Christmas movie?',
			url: 'https://i.imgur.com/1wratMU.png'
		}],
		['6', {
			text: 'Best streaming service.',
			url: 'https://i.imgur.com/3myZjh6.png'
		}],
		['7', {
			text: 'What\'s the best thing to stuff in an olive?',
			url: 'https://i.imgur.com/4iwiGbE.png'
		}],
		['8', {
			text: 'What is the best flavor of chips?',
			url: 'https://i.imgur.com/5frAq3B.png'
		}],
		['9', {
			text: 'What is your favorite kitchen utensil?',
			url: 'https://i.imgur.com/5p3LwQe.png'
		}],
		['10', {
			text: 'Name an animal without a tail.',
			url: 'https://i.imgur.com/8klkPwo.png'
		}],
		['11', {
			text: 'Name one of the Seven Dwarves.',
			url: 'https://i.imgur.com/12xTMKs.png'
		}],
		['12', {
			text: 'How many chicken nuggets could you eat in 1 minute?',
			url: 'https://i.imgur.com/Akd57aD.png'
		}],
		['13', {
			text: 'Name an animal that doesn\'t have a tail.',
			url: 'https://i.imgur.com/FTxBcRJ.png'
		}],
		['14', {
			text: 'Name something you would do on the beach.',
			url: 'https://i.imgur.com/GCefgYH.png'
		}],
		['15', {
			text: 'Name an island in the Mediterranean.',
			url: 'https://i.imgur.com/HecunVi.png'
		}],
		['16', {
			text: 'Name an occupation beginning with B.',
			url: 'https://i.imgur.com/KLrpu30.png'
		}],
		['17', {
			text: 'Name a very cold country.',
			url: 'https://i.imgur.com/NQ4ncfS.png'
		}],
		['18', {
			text: 'Still, sparkling or tap water?',
			url: 'https://i.imgur.com/OV8GV1d.png'
		}],
		['19', {
			text: 'Would you rather have a statue of yourself or a painting of yourself?',
			url: 'https://i.imgur.com/PCUjA2e.png'
		}],
		['20', {
			text: 'What would be the best game show to go on?',
			url: 'https://i.imgur.com/PtPWF8t.png'
		}],
		['21', {
			text: 'Name one of Santa\'s reindeer. (Not Rudolph).',
			url: 'https://i.imgur.com/QiRDZDM.png'
		}],
		['22', {
			text: 'Name a movie trilogy',
			url: 'https://i.imgur.com/QjUZsN1.png'
		}],
		['23', {
			text: 'Sweatshirt or hoodie?',
			url: 'https://i.imgur.com/SBPDNer.png'
		}],
		['25', {
			text: 'What\'s the best sauce to eat fries with?',
			url: 'https://i.imgur.com/XfxNulH.png'
		}],
		['26', {
			text: 'What is the stickiest food?',
			url: 'https://i.imgur.com/YCMwno8.png'
		}],
		['27', {
			text: 'What is the most boring sport to watch live?',
			url: 'https://i.imgur.com/b8D8WSD.png'
		}],
		['28', {
			text: 'What is the best room in the house?',
			url: 'https://i.imgur.com/hAAtmPB.png'
		}],
		['29', {
			text: 'Would you rather be the richest person in the world or the smartest?',
			url: 'https://i.imgur.com/kBi8Fad.png'
		}],
		['30', {
			text: 'Best food from France.',
			url: 'https://i.imgur.com/kFUSliC.png'
		}],
		['31', {
			text: 'What\'s the best color highlighter?',
			url: 'https://i.imgur.com/n4brq6p.png'
		}],
		['32', {
			text: 'Would you rather live in the city, country side or seaside?',
			url: 'https://i.imgur.com/o7wFTfB.png'
		}],
		['33', {
			text: 'Name the best pub sport.',
			url: 'https://i.imgur.com/oFi2kit.png'
		}],
		['34', {
			text: 'if you had a potato as a pet, what would you name it?',
			url: 'https://i.imgur.com/phE7Xif.png'
		}],
		['35', {
			text: 'What\'s the best flavor of jelly?',
			url: 'https://i.imgur.com/qWTxdE4.png'
		}],
		['36', {
			text: 'At what time does breakfast become lunch?',
			url: 'https://i.imgur.com/qdpjYzS.png'
		}],
		['37', {
			text: 'Name an insect that can\'t fly.',
			url: 'https://i.imgur.com/vH6AUyz.png'
		}],
		['38', {
			text: 'Name a flavor of Pot Noodle.',
			url: 'https://i.imgur.com/yp6PHXU.png'
		}],
		['39', {
			text: 'Name a famous bird.',
			url: 'https://i.imgur.com/wiXv8jw.png'
		}],
		['40', {
			text: 'Name the biggest fruit you can fit in your mouth without chopping it up.',
			url: 'https://i.imgur.com/z6cXZM7.png'
		}]
	]);

	public constructor(loadingMessage: Message, judge: GuildMember) {
		this.currentBoard = loadingMessage;
		this.id = this.currentBoard.id;
		this.judge = judge;

		this.players.set(this.judge.id, 'Joined');
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

	public async sendLobby() {
		const embed = new EmbedBuilder()
			.setColor('Aqua')
			.setTitle(`${this.judge.displayName} Started a game of Herd Mentality`)
			.setDescription(`Click below to join!\n**Players**${ZWS}\n`);

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

		await this.updatePlayerStats();
	}

	public async addPlayer(playerId: string) {
		this.players.set(playerId, 'Joined');
		await this.updatePlayerStats();
	}

	public async endGame() {
		await this.disableBoard(this.currentBoard);
	}

	public async sendQuestion(): Promise<Message> {
		const embed = new EmbedBuilder();
		const buttons = new ActionRowBuilder<ButtonBuilder>();
		const questionId = this.questions.randomKey();
		this.currentQuestion = this.questions.get(questionId ?? '');

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
		return this.currentBoard.edit({
			content: ' ',
			embeds: [embed],
			components: [buttons]
		});
	}

	private async updateBoard(): Promise<Message> {
		if (this.currentBoard.id !== this.currentBoard.channel.lastMessageId) {
			const newBoard = await sendLoadingMessage(this.currentBoard);
			await this.disableBoard(this.currentBoard);
			this.currentBoard = newBoard;
		}
		return this.currentBoard;
	}

	private async updatePlayerStats() {
		const currentEmbed = this.currentBoard.embeds.at(0);

		if (!currentEmbed) {
			throw new Error('CurrentBoard has no embeds');
		}

		const [embedContent] = currentEmbed?.description?.split(ZWS) ?? [undefined];

		const statString = this.players.reduce((acc, stat, player) => `${acc}\n<@${player}>: ${stat}`, '');

		const newContent = `${embedContent ?? ''}${ZWS}${statString}`;

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
