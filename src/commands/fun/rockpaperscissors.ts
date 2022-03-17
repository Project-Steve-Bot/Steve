import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { pickRandom } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Play an epic game of rock paper scissors against everyone\'s favorite bot.',
	aliases: ['rps', 'roshambo'],
	detailedDescription: {
		usage: '<rock | paper | scissors>'
	}
})
export class UserCommand extends SteveCommand {

	private plays = ['rock', 'paper', 'scissors'];

	public async messageRun(msg: Message, args: Args) {
		const input = await args.pickResult('string');

		if (!input.success || !this.plays.includes(input.value.toLowerCase())) {
			return send(msg, 'You gotta play rock, paper, or scissors mate.');
		}

		const playerChoice = input.value.toLowerCase();
		const botChoice = pickRandom(this.plays);

		const playerNum = this.plays.indexOf(playerChoice);
		const botNum = this.plays.indexOf(botChoice);

		const winner = this.checkWinner(botNum, playerNum);

		return send(msg, `You chose ${playerChoice}, I chose ${botChoice}. ${winner === 0 ? 'Nobody' : winner === -1 ? 'I' : 'You'} won!`);
	}

	private checkWinner(botPlay: number, playerPlay: number): number {
		if (botPlay === playerPlay) return 0;

		const adjacent = Math.abs(botPlay - playerPlay) === 1;

		if (botPlay > playerPlay) {
			return adjacent
				? -1
				: 1;
		}

		return adjacent
			? 1
			: -1;
	}

}
