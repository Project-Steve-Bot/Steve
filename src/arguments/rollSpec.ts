import { Argument } from '@sapphire/framework';
import type { KeepType, RollSpec } from '@lib/types/rollSpec';

const DICE_REGEX = /(\/(?<count>\d{1,3})?d(?<sides>\d{1,4})(?<keep>kl?(?<keepCount>\d{1,3}))?(?<modifier>[+-]\d{1,3})?)/g;

export class RollSpecArgument extends Argument<RollSpec[][]> {

	public run(parameter: string, context: Argument.Context) {
		const specs = parameter.split(' ');
		const out: RollSpec[][] = [];

		for (let spec of specs) {
			spec = `/${spec}`;
			const rolls: RollSpec[] = [];
			let match: RegExpExecArray | null;
			while ((match = DICE_REGEX.exec(spec)) !== null) {
				if (!match.groups) {
					return this.error({
						context,
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

			if (rolls.length === 0) {
				return this.error({
					context,
					parameter,
					message: 'Please provide a valid spec.',
					identifier: 'MissingOrInvalidSpec'
				});
			}
			out.push(rolls);
		}

		return this.ok(out);
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		rollSpec: RollSpec[][];
	}
}
