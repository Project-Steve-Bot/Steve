import type { PieceContext } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { SubCommandPluginCommand, SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { Message, Permissions } from 'discord.js';

export abstract class SteveCommand extends SubCommandPluginCommand {

	private cmdNames: string[];

	public constructor(context: PieceContext, options: SubCommandPluginCommandOptions) {
		const needsDefault = options.subCommands?.every(subcommand => typeof subcommand === 'string' ? true : !subcommand.default) ?? false;
		const cmdNames = options?.subCommands?.map(subcommand => typeof subcommand === 'string' ? subcommand : subcommand.input.toString()) ?? [];

		if (needsDefault && options.subCommands) {
			options.subCommands = [{ input: 'showSubcommands', default: true }, ...options.subCommands];
		}

		super(context, {
			...options,
			requiredClientPermissions: options.requiredClientPermissions
				? new Permissions('EMBED_LINKS').add(
					options.requiredClientPermissions
				)
				: 'EMBED_LINKS'
		});

		this.cmdNames = cmdNames;
	}

	public showSubcommands(msg: Message) {
		return send(msg, `You're input is not a valid subcommand. Valid options are \`${this.cmdNames.join('`, `')}\`.`);
	}

}
