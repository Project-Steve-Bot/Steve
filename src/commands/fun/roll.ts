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
	modifier: number
	keepCount?: number;
}

interface DiceResult {
	spec: RollSpec;
	keptRolls: number[];
	lostRolls: number[];
}

const DICE_REGEX = /(?<count>\d{1,3})?d(?<sides>\d{1,4})(?<modifier>[+-]\d{1,3})?(?<explode>!)?(?<keep>kl?(?<keepCount>\d{1,3}))?/;

@ApplyOptions<CommandOptions>({
	description: 'Roll some dice!',
	aliases: ['dice', 'diceroll'],
	detailedDescription: {
		usage: '<spec>',
		examples: ['1d6', 'd20', '1d20+3', '5d10!', '6d12k1', '6d12kl2'],
		extendedHelp: oneLine`Use standard dice notation. You can roll up to 100 dice with up to 1,000 sides each.
		Modifiers work too!	Add a \`!\` at the end of your roll to use exploding dice.
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
		else if (count > 100) count = 100;

		let sides = parseInt(match.groups.sides, 10);
		if (sides > 1000) sides = 1000;

		let modifier = parseInt(match.groups.modifier, 10) ?? 0;
		if (isNaN(modifier)) modifier = 0;
		else if (modifier > 100) modifier = 100;

		const explodes = match.groups.explode === '!';

		let keep: KeepType = false;
		if (match.groups.keep) {
			const keepLowest = match.groups.keep.includes('l');
			if (keepLowest) keep = 'lowest';
			else keep = 'highest';
		}

		const keepCount = parseInt(match.groups.keepCount, 10);

		return Args.ok({ input: match.input, count, sides, modifier, explodes, keep, keepCount });
	});

	public async messageRun(msg: Message, args: Args) {
		let grandTotal = 0;
		const runs: string[] = [];

		do {
			const input = await args.pickResult(UserCommand.spec);
			if (input.isErr()) {
				return send(msg, input.err().unwrap().message);
			}

			const spec = input.unwrap();

			const keptRolls: number[] = [];
			const lostRolls: number[] = [];
			for (let j = 0; j < spec.count; j++) {
				const roll = this.roll(spec.sides, spec.explodes);
				keptRolls.push(roll);
			}

			if (spec.keep) {
				keptRolls.sort();
				if (spec.keep === 'highest') keptRolls.reverse();

				for (let j = 0; j < spec.count - (spec.keepCount ?? 0); j++) {
					lostRolls.push(keptRolls.pop() ?? 0);
				}
			}

			// reorder the dice because I like it better when they are random
			for (let j = keptRolls.length - 1; j > 0; j--) {
				const rand = Math.floor(Math.random() * (j + 1));
				[keptRolls[j], keptRolls[rand]] = [keptRolls[rand], keptRolls[j]];
			}

			const result: DiceResult = { spec, keptRolls, lostRolls };
			const modifierString = spec.modifier === 0
				? ''
				: spec.modifier > 0
					? ` +${spec.modifier}`
					: ` ${spec.modifier}`;

			const emoji = this.getEmoji(result.spec);
			const total = result.keptRolls.reduce((a, b) => a + b) + spec.modifier;
			runs.push(oneLine`${emoji} You rolled: \`${result.keptRolls.join('`, `')}\`${modifierString}
					${result.lostRolls.length ? `, ~~\`${result.lostRolls.join('`~~, ~~`')}\`~~` : ''}
					${emoji}${result.keptRolls.length > 1 || spec.modifier !== 0 ? `\nTotal: **${total}**` : ''}`);
			grandTotal += total;
		} while (!args.finished);

		return send(msg, `${runs.join('\n')}\n${runs.length > 1 ? `__**Grand Total: ${grandTotal}**__` : ''}`);
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
