import type { CommandOptions, PieceContext } from '@sapphire/framework';
import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands';
import { Permissions } from 'discord.js';

export abstract class SteveCommand extends SubCommandPluginCommand {


	public constructor(context: PieceContext, options: CommandOptions) {
		super(context, {
			...options,
			requiredClientPermissions: options.requiredClientPermissions
				? new Permissions('EMBED_LINKS').add(
					options.requiredClientPermissions
				  )
				: 'EMBED_LINKS'
		});
	}

	// TODO: Implement dynamic default subcommands

}
