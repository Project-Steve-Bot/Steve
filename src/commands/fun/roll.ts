import { ApplyOptions } from '@sapphire/decorators';
import { Args, CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { oneLine } from 'common-tags';
import { send } from '@sapphire/plugin-editable-commands';
import { SteveCommand } from '@lib/extensions/SteveCommand';

type KeepType = 'highest' | 'lowest' | false;

interface RollSpec {
	input: string;
	count: number;
	sides: number;
	explodes: boolean;
	keep: KeepType;
	keepCount?: number;
}

interface DiceResult {
	spec: RollSpec;
	rolls: number[];
}

const DICE_REGEX = /(?<count>\d{1,2})?d(?<sides>\d{1,4})(?<explode>!)?(?<keep>kl?(?<keepCount>\d{1,2}))?/;

@ApplyOptions<CommandOptions>({
	description: 'Roll some dice!',
	aliases: ['dice', 'diceroll'],
	detailedDescription: {
		usage: '<spec>',
		examples: ['1d6', 'd20', '5d10!', '6d12k1', '6d12kl2'],
		extendedHelp: oneLine`Use standard dice notation. You can roll up to 10 dice with up to 1,000 sides each.
		Add a \`!\` at the end of your roll to use exploding dice.
		To keep the highest n, add \`k<n>\`; to keep the lowest n, add \`kl<n>\` (with n < amount of dice).`
	}
})
export class UserCommand extends SteveCommand {


	private static spec = Args.make<RollSpec>((parameter, { argument }) => {
		const match = DICE_REGEX.exec(parameter);

		if (!match || !match.groups) {
			return Args.error({
				argument,
				parameter,
				message: 'Please provide a valid spec.',
				identifier: 'MissingOrInvalidSpec'
			});
		}

		let count = parseInt(match.groups.count, 10) ?? 1;
		if (isNaN(count)) count = 1;
		else if (count > 10) count = 10;

		let sides = parseInt(match.groups.sides, 10);
		if (sides > 1000) sides = 1000;

		const explodes = match.groups.explode === '!';

		let keep: KeepType = false;
		if (match.groups.keep) {
			const keepLowest = match.groups.keep.includes('l');
			if (keepLowest) keep = 'lowest';
			else keep = 'highest';
		}

		const keepCount = parseInt(match.groups.keepCount, 10);

		return Args.ok({ input: match.input, count, sides, explodes, keep, keepCount });
	});

	public async messageRun(msg: Message, args: Args) {
		const input = await args.pickResult(UserCommand.spec);
		if (!input.success) {
			return send(msg, input.error.message);
		}

		const { value: spec } = input;

		let rolls = [];
		for (let i = 0; i < spec.count; i++) {
			const roll = this.roll(spec.sides, spec.explodes);
			rolls.push(roll);
		}

		if (spec.keep) {
			rolls.sort();
			if (spec.keep === 'highest') rolls.reverse();
			rolls = rolls.slice(0, spec.keepCount);
		}

		const result: DiceResult = { spec, rolls };

		const emoji = this.getEmoji(result.spec);
		const total = result.rolls.reduce((a, b) => a + b);
		const message = `${emoji} You rolled: \`${result.rolls.join(', ')}\` ${emoji}${result.rolls.length > 1 ? `\nTotal: ${total}` : ''}`;
		return send(msg, message);
	}

	private rollOnce(sides: number): number {
		return Math.floor(Math.random() * sides) + 1;
	}

	private getEmoji(spec: RollSpec): string {
		if (spec.keep === 'highest') return '👍';
		if (spec.keep === 'lowest') return '👎';
		if (spec.explodes) return '💥';
		return '🎲';
	}

	private roll(sides: number, explodes: boolean): number {
		if (sides <= 1) return 1; // this one is easy

		if (explodes) {
			let total = 0;
			let roll = 0;
			do {
				roll = this.rollOnce(sides);
				total += roll;
			} while (
				roll === sides
				&& roll < 1e6 // prevent an infinite loop, just in case
			);
			return total;
		} else {
			return this.rollOnce(sides);
		}
	}

}
