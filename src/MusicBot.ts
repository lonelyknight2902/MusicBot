import {
  ApplicationCommandOptionType,
  CacheType,
  Client,
  GatewayIntentBits,
  GuildMember,
  Interaction,
  Message,
  OmitPartialGroupDMChannel,
} from "discord.js";
import MusicPlayer from "./MusicPlayer";
import config from "./config";
import { useMainPlayer, useQueue } from "discord-player";
import { execute } from "./interactions/play";

class MusicBot {
  private client: Client;
  private musicPlayer: MusicPlayer;
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.musicPlayer = new MusicPlayer(this.client);
    this.listenToPlayerEvents();
  }

  private async listenToPlayerEvents() {
    this.client.login(config.DISCORD_TOKEN);

    this.client.once("ready", () => {
      console.log("Bot is ready");
    });

    this.client.on("error", console.error);
    this.client.on("warn", console.warn);

    this.client.on("messageCreate", this.onMessageCreate);

    this.client.on("interactionCreate", this.onInteractionCreate);
  }

  private onMessageCreate = async (
    message: OmitPartialGroupDMChannel<Message<boolean>>
  ) => {
    if (message.author.bot || !message.guild) return;
    if (!this.client.application?.owner) await this.client.application?.fetch();
    if (
      message.content === "!deploy" &&
      message.author.id === this.client.application?.owner?.id
    ) {
      console.log("Deploying commands");
      await message.guild.commands.set([
        {
          name: "play",
          description: "Plays a song from youtube",
          options: [
            {
              name: "query",
              type: ApplicationCommandOptionType.String,
              description: "The song you want to play",
              required: true,
            },
          ],
        },
        {
          name: "skip",
          description: "Skip to the current song",
        },
        {
          name: "queue",
          description: "See the queue",
        },
        {
          name: "stop",
          description: "Stop the player",
        },
        {
          name: "ping",
          description: "Ping!",
        },
      ]);

      await message.reply("Deployed!");
    }
  };

  private onInteractionCreate = async (interaction: Interaction<CacheType>) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    if (
      !(interaction.member instanceof GuildMember) ||
      !interaction.member.voice.channel
    ) {
      return void interaction.reply({
        content: "You are not in a voice channel!",
        ephemeral: true,
      });
    }

    if (interaction.commandName === "play") {
      this.play(interaction);
      //   await interaction.deferReply();

      //   const query = interaction.options.get("query")?.value as string;

      //   const player = useMainPlayer();
      //   await player.play(interaction.member.voice.channel, query);
      //   player.nodes.create(interaction.guildId);
      //   const searchResult = await player.search(query, {
      //     requestedBy: interaction.user,
      //     searchEngine: "auto",
      //   });
      //   if (!searchResult || searchResult.tracks.length === 0) {
      //     return void interaction.followUp("No results found!");
      //   }

      //   //   const entry = queue?.tasksQueue.acquire();

      //   // wait for previous task to be released and our task to be resolved
      //   //   await entry?.getTask();

      //   // add track(s) (this will add playlist or single track from the result)
      //   //   queue?.addTrack(searchResult.tracks[0]);
      //   console.log("Search result", searchResult);
      //   const queue = player.nodes.create(interaction.guildId);
      //   if (!queue) return void interaction.followUp("Could not create queue");

      //   queue.insertTrack(searchResult.tracks[0], 0);

      //   try {
      //     if (!queue?.connection)
      //       await queue?.connect(interaction.member.voice.channel);
      //   } catch {
      //     queue?.delete();
      //     return interaction.followUp({
      //       content: "Could not join your voice channel!",
      //     });
      //   }

      //   await interaction.followUp({
      //     content: `⏱ | Loading your ${
      //       searchResult.playlist ? "playlist" : "track"
      //     }...`,
      //   });
      //   console.log("Playing", queue?.tracks);
      //   try {
      //     // if player node was not previously playing, play a song
      //     if (!queue.isPlaying()) await queue.node.play();
      //   } finally {
      //     // release the task we acquired to let other tasks to be executed
      //     // make sure you are releasing your entry, otherwise your bot won't
      //     // accept new play requests
      //     queue.tasksQueue.release();
      //   }
    } else if (interaction.commandName === "skip") {
      this.skip(interaction);
    } else if (interaction.commandName === "queue") {
      this.queue(interaction);
    } else if (interaction.commandName === "stop") {
      this.stop(interaction);
    } else if (interaction.commandName === "ping") {
      await interaction.reply("Pong!");
    }
  };

  private async play(interaction: any) {
    const player = useMainPlayer();
    const channel = interaction.member.voice.channel;
    if (!channel)
      return interaction.reply("You are not connected to a voice channel!"); // make sure we have a voice channel
    const query = interaction.options.getString("query", true); // we need input/query to play

    // let's defer the interaction as things can take time to process
    await interaction.deferReply();

    try {
      const { track } = await player.play(channel, query, {
        nodeOptions: {
          // nodeOptions are the options for guild node (aka your queue in simple word)
          metadata: interaction.channel, // we can access this metadata object using queue.metadata later on
        },
      });

      return interaction.followUp(`**${track.title}** enqueued!`);
    } catch (e) {
      // let's return error if something failed
      return interaction.followUp(`Something went wrong: ${e}`);
    }
  }

  private async skip(interaction: any) {
    const queue = useQueue(interaction.guild?.id);
    if (!queue) return void interaction.reply("No queue found");
    await interaction.deferReply();
    queue.node.skip();
  }

  private async stop(interaction: any) {
    const queue = useQueue(interaction.guild?.id);
    if (!queue) return void interaction.reply("No queue found");
    await interaction.deferReply();
    queue.node.stop();
  }

  private async queue(interaction: any) {
    const queue = useQueue(interaction.guild?.id);
    if (!queue) return void interaction.reply("No queue found");
    await interaction.deferReply();
    console.log("Queue", queue.tracks.toArray());
    const tracks = queue.tracks
      .toArray()
      .map((track) => track.title)
      .join("\n");
    interaction.followUp("Current queue\n", tracks);
  }
}

export default MusicBot;
