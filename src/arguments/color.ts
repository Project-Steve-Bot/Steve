import { Argument } from '@sapphire/framework';
import { ColorResolvable, resolveColor } from 'discord.js';

export class ColorArgument extends Argument<ColorResolvable> {

	public run(parameter: string, context: Argument.Context) {
		let color: ColorResolvable;

		try {
			color = resolveColor(parameter.toUpperCase() as ColorResolvable);
		} catch {
			return this.error({
				context,
				parameter,
				message: 'Colors must follow **The Rules of Color** (<https://discord.js.org/#/docs/discord.js/stable/typedef/ColorResolvable>)',
				identifier: 'InvalidColor'
			});
		}
		return this.ok(color);
	}

}

declare module '@sapphire/framework' {
	interface ArgType {
		color: ColorResolvable;
	}
}
