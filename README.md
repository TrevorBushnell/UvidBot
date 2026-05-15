## UvidBot

A discord bot for my primary Discord social server. Pretty much an excuse for me to learn Typescript and also mess with AI pair programming agents in my IDE (currently using Gemini Code Assist while developing this project). Database currently powered with SQLite.

### Current Features
  
* Ability to store coop speedrun times for Super Mario 64 Coop and Lunch Lady
  * `/sm64-coop-run [category] [time]` & `/sm64-coop-run [category] [time]` -> for inserting a run
  * `sm64-coop-leaderboard [category] [num_players]` & `lunch-lady-leaderboard [category] [num_players]` -> for looking up leaderboards of times

### Future Planned Features

* Discord RaceBot - similar to platforms like Racetime.gg or SpeedRunsLive where you can create/join races, and look up the times you've gotten in races against other people in the server
* SM64 Single Star Daily LTAs - randomly selects a single star and allows members of the server to submit single star times to put on a server exclusive leaderboard

### How to Use

Run with `npx tsx uvidbot.ts`

To update the server with newly developed commands, run `npx tsx deploy-commands.ts`