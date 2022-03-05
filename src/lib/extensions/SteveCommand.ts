import type { CommandOptions, PieceContext } from '@sapphire/framework';
import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands';
import { Permissions } from 'discord.js';
import type { SteveBoi } from './SteveBoi';

export abstract class SteveCommand extends SubCommandPluginCommand {

	public client: SteveBoi;

	public constructor(context: PieceContext, options: CommandOptions) {
		super(context, {
			...options,
			requiredClientPermissions: options.requiredClientPermissions
				? new Permissions('EMBED_LINKS').add(
					options.requiredClientPermissions
				  )
				: 'EMBED_LINKS'
		});
		this.client = this.container.client as SteveBoi;
	}

}
