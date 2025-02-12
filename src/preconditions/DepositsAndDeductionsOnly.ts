import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';

export class UserPrecondition extends Precondition {

	public async messageRun(message: Message) {
		return message.guildId === '989658500563095562'
			? this.ok()
			: this.error({
				message: 'This command can only be run in the Deposits & Deductions Server'
			});
	}

	public chatInputRun(interaction: CommandInteraction) {
		return interaction.guildId === '989658500563095562'
			? this.ok()
			: this.error({
				message: 'This command can only be run in the Deposits & Deductions Server'
			});
	}

}

declare module '@sapphire/framework' {
	interface Preconditions {
		DepositsAndDeductionsOnly: never;
	}
}
