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
	keep: KeepType;
	modifier: number
	keepCount?: number;
}

interface DiceResult {
	spec: RollSpec;
	keptRolls: number[];
	lostRolls: number[];
}

const DICE_REGEX = /(\/(?<count>\d{1,3})?d(?<sides>\d{1,4})(?<keep>kl?(?<keepCount>\d{1,3}))?(?<modifier>[+-]\d{1,3})?)/g;

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


	private static spec = Args.make<RollSpec[]>((parameter, { argument }) => {
		parameter = `/${parameter}`;
		const rolls: RollSpec[] = [];
		let match: RegExpExecArray | null;
		while ((match = DICE_REGEX.exec(parameter)) !== null) {
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

			let keep: KeepType = false;
			if (match.groups.keep) {
				const keepLowest = match.groups.keep.includes('l');
				if (keepLowest) keep = 'lowest';
				else keep = 'highest';
			}

			const keepCount = parseInt(match.groups.keepCount, 10);

			rolls.push({ input: match.input, count, sides, modifier, keep, keepCount });
		}
		return Args.ok(rolls);
	});

	public async messageRun(msg: Message, args: Args) {
		const runs: string[] = [];

		do {
			const input = await args.pickResult(UserCommand.spec);
			if (input.isErr()) {
				return send(msg, input.err().unwrap().message);
			}

			const specs = input.unwrap();
			const rollResults: DiceResult[] = [];

			specs.forEach(spec => {
				const keptRolls: number[] = [];
				const lostRolls: number[] = [];
				for (let j = 0; j < spec.count; j++) {
					const roll = this.roll(spec.sides);
					keptRolls.push(roll);
				}

				if (spec.keep) {
					keptRolls.sort((a, b) => a - b);

					if (spec.keep === 'highest') keptRolls.reverse();

					for (let j = 0; j < spec.count - (spec.keepCount ?? 0); j++) {
						lostRolls.push(keptRolls.pop() ?? 0);
					}
					this.container.logger.debug('Kept:', keptRolls);
					this.container.logger.debug('Lost:', lostRolls);
				}

				rollResults.push({ spec, keptRolls, lostRolls });
			});

			runs.push(this.createResultString(rollResults));
		} while (!args.finished);

		return send(msg, runs.join('\n'));
	}

	private roll(sides: number): number {
		return Math.floor(Math.random() * sides) + 1;
	}

	private createResultString(rolls: DiceResult[]): string {
		const addTotal = rolls.length > 1 || rolls[0].spec.count > 1;
		const prefix = addTotal ? '> ' : '';
		let output = '';
		let total = 0;

		rolls.forEach(({ spec, keptRolls, lostRolls }) => {
			const emoji = this.getEmoji(spec, this.findMax(keptRolls));
			const modifierString = spec.modifier === 0
				? ''
				: spec.modifier > 0
					? `+${spec.modifier}`
					: ` ${spec.modifier}`;
			const extrasString = `${modifierString}${spec.keep
				? `k${spec.keep === 'lowest' ? 'l' : ''}${spec.keepCount}`
				: ''}`;

			output += oneLine`${prefix}${emoji} ${spec.count}d${spec.sides}${extrasString}: \`${keptRolls.join('`, `')}\`
			${lostRolls.length ? `, ~~\`${lostRolls.join('`~~, ~~`')}\`~~` : ''}${modifierString} ${emoji}`;

			if (addTotal) {
				output += '\n';
			}

			total += keptRolls.reduce((a, b) => a + b) + spec.modifier;
		});

		return `${output}${addTotal ? `> **Total: ${total}**\n` : ''}`;
	}

	private getEmoji(spec: RollSpec, max: number): string {
		switch (spec.sides) {
			case 4:
				return '<:d4:1031717350526951475>';
			case 6:
				return '<:d6:1031717351663599656>';
			case 8:
				return '<:d8:1031717352850591774>';
			case 10:
				return '<:d10:1031717353404239933>';
			case 12:
				return '<:d12:1031717355107143780>';
			case 20:
				return max === 20 ? '<a:d20crit:1031724228434731100>' : '<:d20:1031717356008915015>';
			default:
				return '<:dice:1032024351060541492>';
		}
	}

	private findMax(nums: number[]) {
		let max = -1;

		nums.forEach(num => {
			if (num > max) max = num;
		});

		return max;
	}

}
