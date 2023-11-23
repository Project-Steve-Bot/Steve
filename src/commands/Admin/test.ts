import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { sendLoadingMessage } from '@lib/utils';
import { HerdMentalityManager } from '@lib/HerdMentality';

@ApplyOptions<CommandOptions>({
	description: 'hm',
	aliases: ['hm'],
	preconditions: ['OwnerOnly'],
	runIn: 'GUILD_TEXT'
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message) {
		const board = await sendLoadingMessage(msg);

		if (!msg.member) {
			await board.edit('This game can only be played in a server!');
			return;
		}

		const hmGame = new HerdMentalityManager(board, msg.member);
		this.container.hmGames.set(hmGame.id, hmGame);

		await hmGame.sendLobby();
	}

}
