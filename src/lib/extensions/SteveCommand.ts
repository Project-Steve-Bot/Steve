import { Command, CommandOptions, PieceContext } from '@sapphire/framework';
import type { SteveBoi } from './SteveBoi';

export abstract class SteveCommand extends Command {

	public client: SteveBoi;
	
	public constructor(context: PieceContext, options: CommandOptions) {
		super(context, options);
		this.client = this.container.client as SteveBoi;
	}

}
