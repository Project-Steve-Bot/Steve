# 3.0.0
A lot has changed. If you want something else to change, use the `suggest` command to let me know.
## Commands
Commands not listed below are not in 3.0.0.
- `assign`: Identical behavior to previous version.
- `setembedcolor`: Allows the user to set their accent color for embeds. Replaces `userconf`.
- `setfaxtext`: Allows the user to set the text color of faxes they receive. Replaces `userconf`.
- `settimezone`: Allows the user to set their timezone for use with `remind`. New functionality.
- `setfaxbackgroung`: Allows the user to set the background color of faxes they receive. replaces `userconf`.
- `rockpaperscissors`: Identical behavior to previous version.
- `8ball`: Identical behavior to previous version.
- `roll`: Identical behavior to previous version.
- `poll`: Allows users to create polls. Syntax `poll <question> | <choices...> (--ends:duration) (--multiselect)`. Replaces `poll`.
- `nice`: Identical behavior to previous version.
- `whenshouldi`: Identical behavior to previous version.
- `choose`: Identical behavior to previous version.
- `setdesk`: Identical behavior to previous version.
- `setnumber`: Identical behavior to previous version.
- `rolodex`: View all fax user's and their numbers. Replaces `phonebook`.
- `manageassignableroles`: Allows server moderators to manage the assignable roles list. Replaces `conf`.
- `manageremindchannel`: Allows server moderators to set the channel public reminders will be set to. Replaces `conf`.
- `managefaxchannel`: Allows server moderators to manage the list of channels faxes can be sent to. Replaces `conf`.
- `managecountchannel`: Allows server moderators to set the counting channel. Replaces `conf`.
- `managesnippets`: Allows server moderators to manage the snippets list. Replaces `snippets`.
- `ping`: Identical behavior to previous version.
- `discordstatus`: Identical behavior to previous version.
- `suggest`: Identical behavior to previous version.
- `snippet`: Allows users to view the list of snippets or the content of a snippet. Replaces `snippet`.
- `stats`: Identical behavior to previous version.
- `help`: Identical behavior to previous version.
- `remind`: Allows users to set reminders. Syntax: `remind <duration or timestamp> reminder content [--repeat:duration]`. Replaces `remind`.
- `viewreminders`: Allows users to view their pending reminders. Replaces `remind`.
- `cancelreminder`: Allows users to cancel a pending reminder. Replaces `remind`.

## Server Management
- ### There is no longer a need to set moderator and admin roles.
	3.0.0 allows users to use privileged commands based on their permissions in the server.
- ### There are no more moderation commands.
	You can use discord built in slash commands for that now if you want to be a keyboard warrior.
- ### There are no more logs.
	I'm working on that, expect more in 3.1.0.