import type { PieceContext } from '@sapphire/framework';
import { Subcommand, SubcommandOptions } from '@sapphire/plugin-subcommands';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, Permissions } from 'discord.js';

export abstract class SteveSubcommand extends Subcommand {

	private cmdNames: string[];

	public constructor(context: PieceContext, options: SubcommandOptions) {
		const needsDefault = options.subcommands?.every(subcommand =>
			subcommand.type === 'method'
				? !subcommand.default
				: subcommand.type === 'group'
					? subcommand.entries.every(entry => !entry.default)
					: true) ?? false;

		const names: string[] = [];
		if (needsDefault && options.subcommands) {
			options?.subcommands?.forEach(subcommand => {
				if (subcommand.type === 'group') {
					subcommand.entries.forEach(entry => {
						names.push(`${subcommand.name} ${entry.name}`);
					});
				} else {
					names.push(subcommand.name);
				}
			});
			options.subcommands = [{ name: 'default', messageRun: 'showSubcommands', default: true }, ...options.subcommands];
		}

		super(context, {
			...options,
			requiredClientPermissions: options.requiredClientPermissions
				? new Permissions('EMBED_LINKS').add(
					options.requiredClientPermissions
				)
				: 'EMBED_LINKS'
		});

		this.cmdNames = names;
	}

	public showSubcommands(msg: Message) {
		return send(msg, `You're input is not a valid subcommand. Valid options are \`${this.cmdNames.join('`, `')}\`.`);
	}

}
