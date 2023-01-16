import { ApplyOptions } from '@sapphire/decorators';
import type { Args, Command, CommandOptions } from '@sapphire/framework';
import {
	AutocompleteInteraction,
	Guild,
	Message,
	EmbedBuilder,
	TextBasedChannel,
	User
} from 'discord.js';
import { oneLine } from 'common-tags';
import { send } from '@sapphire/plugin-editable-commands';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import type { RollSpec } from '@lib/types/rollSpec';
import { resolveRoll } from '@lib/resolvers';

interface DiceResult {
	spec: RollSpec;
	keptRolls: number[];
	lostRolls: number[];
}

@ApplyOptions<CommandOptions>({
	description: 'Roll some dice!',
	aliases: ['dice', 'diceroll'],
	detailedDescription: {
		usage: '<spec>',
		examples: ['1d6', 'd20', '1d20+3', '5d10!', '6d12k1', '6d12kl2', '1d20+3 6d4/1d8'],
		extendedHelp: oneLine`Use standard dice notation. You can roll up to 100 dice with up to 1,000 sides each.
		Modifiers work too!	To keep the highest n, add \`k<n>\`; to keep the lowest n, add \`kl<n>\` (with n < amount of dice).
		You can also roll multiple dice and even have them added together if you'd like. To add dice together,
		put a \`/\` between the specs.`
	}
})
export class RollCommand extends SteveCommand {

	private autoCompleteCache: Map<string, { setAt: number, options: string[] }> = new Map();

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option =>
					option
						.setName('dice')
						.setDescription('Use standard dice notation or a quick roll that you setup using the managequickrolls command')
						.setRequired(true)
						.setAutocomplete(true)
				);
		}, { idHints: this.container.idHits.get(this.name) });
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const parameter = interaction.options.getString('dice', true);
		const resolvedRoll = await resolveRoll(parameter, interaction.user);

		if (resolvedRoll.isErr()) {
			return interaction.reply(`\`${parameter}\` is not a valid quick roll or spec.`);
		}

		const rollResult = this.preformRolls(resolvedRoll.unwrap());
		const out = interaction.reply(rollResult);

		if (interaction.inGuild()) {
			const guild = await this.container.client.guilds.fetch(interaction.guildId);
			this.logRolls(rollResult, guild, interaction.user);
		}

		return out;
	}

	public async autocompleteRun(interaction: AutocompleteInteraction) {
		const options = await this.fetchAutoCompleteOptions(interaction.user.id);
		const filtered = options.filter(option => option.startsWith(interaction.options.getFocused()));
		interaction.respond(filtered.map(option => ({ name: option, value: option })));
	}

	public async messageRun(msg: Message, args: Args) {
		const input = await args.restResult('roll');
		if (input.isErr()) {
			return send(msg, input.err().unwrap().message);
		}

		const rollResult = this.preformRolls(input.unwrap());
		const out = send(msg, rollResult);

		if (msg.inGuild()) {
			this.logRolls(rollResult, msg.guild, msg.author);
		}

		return out;
	}

	private preformRolls(input: RollSpec[][]): string {
		const runs: string[] = [];
		input.forEach(specs => {
			const rollResults: DiceResult[] = [];

			specs.forEach(spec => {
				const keptRolls: number[] = [];
				const lostRolls: number[] = [];
				for (let j = 0; j < spec.count; j++) {
					const roll = this.roll(spec.sides);
					keptRolls.push(roll);
				}

				if (spec.keep) {
					keptRolls.sort((a, b) => a - b);

					if (spec.keep === 'highest') keptRolls.reverse();

					for (let j = 0; j < spec.count - (spec.keepCount ?? 0); j++) {
						lostRolls.push(keptRolls.pop() ?? 0);
					}
				}

				rollResults.push({ spec, keptRolls, lostRolls });
			});

			runs.push(this.createResultString(rollResults));
		});

		return runs.join('\n');
	}

	private async logRolls(result: string, guild: Guild, author: User) {
		const rollLogId = (await this.container.db.guilds.findOne({ id: guild.id }))?.channels?.rolls;
		if (!rollLogId) return;

		const rollLog = await guild.channels.fetch(rollLogId) as TextBasedChannel;
		rollLog.send({ embeds: [new EmbedBuilder()
			.setAuthor({ name: `${author.tag} rolled...`, iconURL: author.displayAvatarURL() })
			.setDescription(result)
			.setColor('Aqua')
			.setTimestamp()
		] });
	}

	private roll(sides: number): number {
		return Math.floor(Math.random() * sides) + 1;
	}

	private createResultString(rolls: DiceResult[]): string {
		const addTotal = rolls.length > 1 || rolls[0].spec.count > 1 || rolls[0].spec.modifier !== 0;
		const prefix = addTotal ? '> ' : '';
		let output = '';
		let total = 0;

		rolls.forEach(({ spec, keptRolls, lostRolls }) => {
			const emoji = this.getEmoji(spec, this.findMax(keptRolls));
			const modifierString = spec.modifier === 0
				? ''
				: spec.modifier > 0
					? `+${spec.modifier}`
					: ` ${spec.modifier}`;
			const extrasString = `${modifierString}${spec.keep
				? `k${spec.keep === 'lowest' ? 'l' : ''}${spec.keepCount}`
				: ''}`;

			output += oneLine`${prefix}${emoji} ${spec.count}d${spec.sides}${extrasString}: \`${keptRolls.join('`, `')}\`
			${lostRolls.length ? `, ~~\`${lostRolls.join('`~~, ~~`')}\`~~` : ''}${modifierString} ${emoji}`;

			if (addTotal) {
				output += '\n';
			}

			total += keptRolls.reduce((a, b) => a + b) + spec.modifier;
		});

		return `${output}${addTotal ? `> **Total: ${total}**\n` : ''}`;
	}

	private getEmoji(spec: RollSpec, max: number): string {
		switch (spec.sides) {
			case 4:
				return '<:d4:1031717350526951475>';
			case 6:
				return '<:d6:1031717351663599656>';
			case 8:
				return '<:d8:1031717352850591774>';
			case 10:
				return '<:d10:1031717353404239933>';
			case 12:
				return '<:d12:1031717355107143780>';
			case 20:
				return max === 20 ? '<a:d20crit:1031724228434731100>' : '<:d20:1031717356008915015>';
			default:
				return '<:dice:1032024351060541492>';
		}
	}

	private findMax(nums: number[]) {
		let max = -1;

		nums.forEach(num => {
			if (num > max) max = num;
		});

		return max;
	}

	private async fetchAutoCompleteOptions(userId: string): Promise<string[]> {
		const cashedOptions = this.autoCompleteCache.get(userId);

		if (!cashedOptions || Date.now() - cashedOptions.setAt > 60e3) {
			const quickRolls = await this.container.db.quickRolls.find({ user: userId }).toArray();
			const options = quickRolls.map(qr => qr.rollName);
			this.autoCompleteCache.set(userId, { setAt: Date.now(), options });
			return options;
		}

		return cashedOptions.options;
	}

}
