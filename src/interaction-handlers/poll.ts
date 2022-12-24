import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, MessageEmbed } from 'discord.js';
import type { Poll } from '@lib/types/database';
import { dateToTimestamp } from '@lib/utils';

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class PollHandler extends InteractionHandler {

	public async parse(interaction: ButtonInteraction) {
		if (!interaction.id.startsWith('poll')) {
			return this.none();
		}

		await interaction.deferUpdate();
		return this.some(this.container.db.polls.findOne({ messageId: interaction.message.id }));
	}

	public async run(interaction: ButtonInteraction, promisedPoll: InteractionHandler.ParseResult<this>) {
		const poll = await promisedPoll;

		if (!poll) {
			interaction.followUp({ content: 'Something went wrong and I couldn\'t find this poll :(', ephemeral: true });
			return;
		}

		const voterId = interaction.user.id;
		const choiceId = parseInt(interaction.customId.split('|')[1]);
		const choice = poll.choices[choiceId];

		let newPoll: Poll;
		let content: string;

		if (!poll.allVoters.includes(voterId) || (poll.multiSelect && !choice.voters.includes(voterId))) {
			newPoll = this.addVote(interaction, choiceId, poll);
			content = `You have voted for **${choice.text}**. To remove your vote, vote for it again${
				poll.multiSelect ? '' : ' or vote for another option'
			}.`;
		} else if (choice.voters.includes(voterId)) {
			newPoll = this.removeVote(interaction, choiceId, poll);
			content = `Your vote for **${choice.text}** has been removed.`;
		} else {
			newPoll = this.changeVote(interaction, choiceId, poll);
			content = `Your vote has been changed to **${choice.text}**.`;
		}

		await this.container.db.polls.findOneAndReplace({ _id: poll._id }, newPoll);
		await interaction.followUp({ content, ephemeral: true });

		const embed = new MessageEmbed(interaction.message.embeds[0]);
		embed.setDescription(
			`${newPoll.choices
				.map((newChoice) => `${newChoice.text}${newChoice.votes > 0 ? ` - ${newChoice.votes} vote${newChoice.votes === 1 ? '' : 's'}` : ''}`)
				.join('\n')}\n\nThis poll ends at ${dateToTimestamp(poll.expires, 'f')}`
		);

		interaction.editReply({ embeds: [embed] });
	}

	private addVote(interaction: ButtonInteraction, choiceId: number, poll: Poll): Poll {
		poll.allVoters.push(interaction.user.id);
		poll.choices[choiceId].voters.push(interaction.user.id);
		poll.choices[choiceId].votes++;
		return poll;
	}

	private removeVote(interaction: ButtonInteraction, choiceId: number, poll: Poll): Poll {
		// Remove voter from the that choices voters array.
		poll.choices[choiceId].voters.splice(poll.choices[choiceId].voters.indexOf(interaction.user.id), 1);

		// Perhaps the worst way to figure out if this person should still be in the all voters list.
		const setAllVoters = new Set<string>();
		poll.choices.forEach((choice) => choice.voters.forEach((voter) => setAllVoters.add(voter)));
		poll.allVoters = Array.from(setAllVoters);

		poll.choices[choiceId].votes = poll.choices[choiceId].votes > 0 ? poll.choices[choiceId].votes - 1 : 0;

		return poll;
	}

	private changeVote(interaction: ButtonInteraction, choiceId: number, poll: Poll): Poll {
		const oldChoice = poll.choices.find((choice) => choice.voters.includes(interaction.user.id));
		if (!oldChoice) {
			throw new Error('Could not find old choice.');
		}
		const oldChoiceId = poll.choices.indexOf(oldChoice);

		const newPoll = this.removeVote(interaction, oldChoiceId, poll);
		return this.addVote(interaction, choiceId, newPoll);
	}

}
