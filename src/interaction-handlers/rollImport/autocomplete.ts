import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';
import { getLongCommandName } from '@lib/utils';

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class QuickRollAutocomplete extends InteractionHandler {

	private allowedCommands = [
		'quickrolls import update character',
		'quickrolls import delete character'
	];


	public override async parse(interaction: AutocompleteInteraction) {
		if (!this.allowedCommands.includes(getLongCommandName(interaction))) {
			return this.none();
		}

		const characters = await this.container.db.rollImportCharacters.find({ user: interaction.user.id }).toArray();
		return this.some(characters.map(character => character.name));
	}

	public override run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
		const filtered = result.filter(option => option.startsWith(interaction.options.getFocused()));
		interaction.respond(filtered.map(option => ({ name: option, value: option })));
	}

}
