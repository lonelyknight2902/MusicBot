import {
  AppleMusicExtractor,
  BridgeProvider,
  BridgeSource,
  SoundCloudExtractor,
  SpotifyExtractor,
} from "@discord-player/extractor";
import { Player, SearchOptions } from "discord-player";
import { YoutubeiExtractor } from "discord-player-youtubei";
import { Client } from "discord.js";

class MusicPlayer {
  private player: Player;

  constructor(client: Client) {
    console.log("MusicPlayer constructor");
    const bridgeProvider = new BridgeProvider(BridgeSource.Auto);
    this.player = new Player(client, {
      bridgeProvider,
      blockExtractors: [
        // this will block the listed extractors from being
        // able to query metadata (aka search results parsing)
        // This example disables youtube search
        // SpotifyExtractor.identifier,
        AppleMusicExtractor.identifier,
        // SoundCloudExtractor.identifier,
      ],
    });
    this.loadExtractor();
    this.listenToPlayerEvents();
  }

  private listenToPlayerEvents() {
    this.player.events.on("playerStart", (queue, track) => {
      queue.metadata.send(`Now playing: ${track.title}`);
    });

    this.player.events.on("audioTrackAdd", (queue, track) => {
      // Emitted when the player adds a single song to its queue
      queue.metadata.send(`Track **${track.title}** queued`);
    });

    this.player.events.on("audioTracksAdd", (queue, track) => {
      // Emitted when the player adds multiple songs to its queue
      queue.metadata.send(`Multiple Track's queued`);
    });

    this.player.events.on("playerSkip", (queue, track) => {
      // Emitted when the audio player fails to load the stream for a song
      queue.metadata.send(`Skipping **${track.title}** due to an issue!`);
    });

    this.player.events.on("disconnect", (queue) => {
      // Emitted when the bot leaves the voice channel
      queue.metadata.send("Looks like my job here is done, leaving now!");
    });
    this.player.events.on("emptyChannel", (queue) => {
      // Emitted when the voice channel has been empty for the set threshold
      // Bot will automatically leave the voice channel with this event
      queue.metadata.send(
        `Leaving because no vc activity for the past 5 minutes`
      );
    });
    this.player.events.on("emptyQueue", (queue) => {
      // Emitted when the player queue has finished
      queue.metadata.send("Queue finished!");
    });

    this.player.on("debug", async (message) => {
      // Emitted when the player sends debug info
      // Useful for seeing what dependencies, extractors, etc are loaded
      console.log(`General player debug event: ${message}`);
    });

    this.player.events.on("debug", async (queue, message) => {
      // Emitted when the player queue sends debug info
      // Useful for seeing what state the current queue is at
      console.log(`Player debug event: ${message}`);
    });

    this.player.events.on("error", (queue, error) => {
      // Emitted when the player queue encounters error
      console.log(`General player error event: ${error.message}`);
      console.log(error);
    });

    this.player.events.on("playerError", (queue, error) => {
      // Emitted when the audio player errors while streaming audio track
      console.log(`Player error event: ${error.message}`);
      console.log(error);
    });
  }

  public search(query: any, options?: SearchOptions) {
    return this.player.search(query, options);
  }

  public getPlayer() {
    return this.player;
  }

  public async loadExtractor() {
    // await this.player.extractors.loadDefault(
    //   (ext) => ext !== "YouTubeExtractor"
    // );
    await this.player.extractors.loadDefault();
    this.player.extractors.register(YoutubeiExtractor, {});
    console.log("Extractors loaded", this.player.extractors);
  }
}

export default MusicPlayer;
