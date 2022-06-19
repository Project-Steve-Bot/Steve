import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { ButtonInteraction, Interaction, MessageEmbed } from 'discord.js';
import type { Poll } from '@lib/types/database';
import { dateToTimestamp } from '@lib/utils';

@ApplyOptions<Listener.Options>({
	event: 'interactionCreate'
})
export class UserEvent extends Listener {

	public async run(interaction: Interaction): Promise<unknown> {
		if (!interaction.isButton() || !interaction.customId.startsWith('poll')) return;
		await interaction.deferUpdate();

		const poll = await this.container.db.polls.findOne({ messageId: interaction.message.id });

		if (!poll) {
			return interaction.followUp({ content: "Something went wrong and I couldn't find this poll :(", ephemeral: true });
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

		return interaction.editReply({ embeds: [embed] });
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
