import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';
import { getLongCommandName } from '../lib/utils';

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class QuickRollAutocomplete extends InteractionHandler {

	private allowedCommands = [
		'roll dice',
		'quickrolls edit roll',
		'quickrolls delete roll'
	];

	private autoCompleteCache: Map<string, { setAt: number, options: string[] }> = new Map();

	public override async parse(interaction: AutocompleteInteraction) {
		if (!this.allowedCommands.includes(getLongCommandName(interaction))) {
			return this.none();
		}

		const cashedOptions = this.autoCompleteCache.get(interaction.user.id);

		if (!cashedOptions || Date.now() - cashedOptions.setAt > 60e3) {
			const quickRolls = await this.container.db.quickRolls.find({ user: interaction.user.id, active: true }).toArray();
			const options = quickRolls.map(qr => qr.rollName);
			this.autoCompleteCache.set(interaction.user.id, { setAt: Date.now(), options });
			return this.some(options);
		}

		return this.some(cashedOptions.options);
	}

	public override run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
		const focused = interaction.options.getFocused();
		const startsWith = result.filter(option => option.startsWith(focused));
		const includes = result.filter(option => option.includes(focused) && !option.startsWith(focused));
		interaction.respond([...startsWith, ...includes].map(option => ({ name: option, value: option })).slice(0, 25));
	}

}
