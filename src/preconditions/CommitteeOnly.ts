import { Precondition } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class UserPrecondition extends Precondition {

	public async run(message: Message) {
		return message.guildId === '700378785605877820' 
			? this.ok()
			: this.error({
				message: 'This command can only be run in the Server By Committiee'
			})
	}

}

declare module '@sapphire/framework' {
	interface Preconditions {
		CommitteeOnly: never;
	}
}
