import type { KeepType, RollSpec } from '@lib/types/rollSpec';
import { Result } from '@sapphire/framework';

const DICE_REGEX = /(\/(?<count>\d{1,3})?d(?<sides>\d{1,4})(?<keep>kl?(?<keepCount>\d{1,3}))?(?<min>r\d{1,2})?(?<modifier>[+-]\d{1,3})?)/g;

export function resolveRollSpec(parameter: string): Result<RollSpec[][], 'MissingOrInvalidSpec'> {
	const specs = parameter.split(' ');
	const out: RollSpec[][] = [];

	for (let spec of specs) {
		spec = `/${spec}`;
		const rolls: RollSpec[] = [];
		let match: RegExpExecArray | null;
		while ((match = DICE_REGEX.exec(spec)) !== null) {
			if (!match.groups) {
				return Result.err('MissingOrInvalidSpec');
			}

			let count = parseInt(match.groups.count, 10) ?? 1;
			if (isNaN(count)) count = 1;
			else if (count > 100) count = 100;

			let sides = parseInt(match.groups.sides, 10);
			if (sides > 1000) sides = 1000;

			let modifier = parseInt(match.groups.modifier, 10) ?? 0;
			if (isNaN(modifier)) modifier = 0;
			else if (modifier > 100) modifier = 100;

			let minimum = parseInt(match.groups.min.substring(1), 10) ?? 0;
			if (isNaN(minimum)) minimum = 0;
			else if (minimum > 20) minimum = 20;


			let keep: KeepType = false;
			if (match.groups.keep) {
				const keepLowest = match.groups.keep.includes('l');
				if (keepLowest) keep = 'lowest';
				else keep = 'highest';
			}

			const keepCount = parseInt(match.groups.keepCount, 10);

			rolls.push({ input: match.input, count, sides, modifier, keep, keepCount, minimum });
		}

		if (rolls.length === 0) {
			return Result.err('MissingOrInvalidSpec');
		}
		out.push(rolls);
	}

	return Result.ok(out);
}

