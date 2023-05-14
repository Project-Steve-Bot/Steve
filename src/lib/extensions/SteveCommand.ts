import { Command, type CommandOptions, type PieceContext } from '@sapphire/framework';
import { PermissionsBitField } from 'discord.js';

export abstract class SteveCommand extends Command {

	public constructor(context: PieceContext, options: CommandOptions) {
		super(context, {
			...options,
			requiredClientPermissions: options.requiredClientPermissions
				? new PermissionsBitField('EmbedLinks').add(
					options.requiredClientPermissions
				)
				: 'EmbedLinks'
		});
	}

}
