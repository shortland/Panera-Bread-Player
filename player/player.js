/*!
 *  Howler.js Audio Player Demo
 *  howlerjs.com
 *
 *  (c) 2013-2018, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

// Cache references to DOM elements.
var elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'volumeBtn', 'progress', 'bar', 'wave', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function(playlist) {
  this.playlist = playlist;
  this.index = 0;
  this.counts = playlist.length;

  // Display the title of the first track.
  track.innerHTML = (playlist[0].title).substring(0, (playlist[0].title).length - 4);

  // Setup the playlist display.
  playlist.forEach(function(song) {
    console.log(song);
    var div = document.createElement('div');
    div.className = 'list-song';
    div.innerHTML = (song.title).substring(0, (song.title).length - 4);
    div.onclick = function() {
      player.skipTo(playlist.indexOf(song));
    };
    list.appendChild(div);
  });
};

Player.prototype = {

  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    var self = this;
    var sound;
    //counts = self.counts;
    index = typeof index === 'number' ? index : self.index;
    var data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: ['./audio/' + data.file, './audio/' + data.file],
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function() {
          // Display the duration.
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Start upating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          // Start the wave animation if we have already loaded
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          pauseBtn.style.display = 'block';
        },
        onload: function() {
          // Start the wave animation.
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          loading.style.display = 'none';
        },
        onend: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
          //self.skipTo('next');
          self.skipTo(randSong(player.counts));
        },
        onpause: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
        },
        onstop: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
        },
        onseek: function() {
          // Start upating the progress of the track.
          requestAnimationFrame(self.step.bind(self));
        }
      });
    }

    // Begin playing the sound.
    sound.play();

    // Update the track display.
    track.innerHTML = (data.title).substring(0, (data.title).length - 4);

    // Show the pause button.
    if (sound.state() === 'loaded') {
      fitty(pauseBtn);
      fitty(playBtn);
      playBtnHolder.style.display = 'none';
      pauseBtnHolder.style.display = 'block';
    } else {
      fitty(pauseBtn);
      fitty(playBtn);
      loading.style.display = 'block';
      playBtnHolder.style.display = 'none';
      pauseBtnHolder.style.display = 'block';
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Puase the sound.
    sound.pause();

    // Show the play button.
    playBtnHolder.style.display = 'block';
    pauseBtnHolder.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    var self = this;

    // Get the next track based on the direction of the track.
    var index = 0;
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    var self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    progress.style.width = '0%';

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    var barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%';

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function() {
    var self = this;
    var display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      playlist.style.display = display;
    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function() {
    var self = this;
    var display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

// Setup our new audio player class and pass it the playlist.
var player = new Player([
    {
      "title": "Let Me Know - By - Witt Lowry (Feat. Tori Solkowski) (Lyrics).mp3",
      "file": "../../songs/Let Me Know - By - Witt Lowry (Feat. Tori Solkowski) (Lyrics).mp3",
      "howl": null
    },
    {
      "title": "KnowMads - Better World.mp3",
      "file": "../../songs/KnowMads - Better World.mp3",
      "howl": null
    },
    {
      "title": "Searchlight (feat. Yeo) (Reprise).mp3",
      "file": "../../songs/Searchlight (feat. Yeo) (Reprise).mp3",
      "howl": null
    },
    {
      "title": "Vanic - Samurai (Audio) ft. Katy Tiz.mp3",
      "file": "../../songs/Vanic - Samurai (Audio) ft. Katy Tiz.mp3",
      "howl": null
    },
    {
      "title": "Westpark - Coffee & Weed.mp3",
      "file": "../../songs/Westpark - Coffee & Weed.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Simple and Sweet.mp3",
      "file": "../../songs/Jon Bellion - Simple and Sweet.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Couple's Retreat (Official Audio).mp3",
      "file": "../../songs/Jon Bellion - Couple's Retreat (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Carry Your Throne.mp3",
      "file": "../../songs/Jon Bellion - Carry Your Throne.mp3",
      "howl": null
    },
    {
      "title": "Remember The Name (Official Video) - Fort Minor.mp3",
      "file": "../../songs/Remember The Name (Official Video) - Fort Minor.mp3",
      "howl": null
    },
    {
      "title": "Small Leaks Sink Ships - Psychotic Opera.mp3",
      "file": "../../songs/Small Leaks Sink Ships - Psychotic Opera.mp3",
      "howl": null
    },
    {
      "title": "Major Lazer - Light It Up (feat. Nyla & Fuse ODG) (Remix) (Official Lyric Video).mp3",
      "file": "../../songs/Major Lazer - Light It Up (feat. Nyla & Fuse ODG) (Remix) (Official Lyric Video).mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - He is the Same.mp3",
      "file": "../../songs/Jon Bellion - He is the Same.mp3",
      "howl": null
    },
    {
      "title": "Lemaitre - Playing To Lose ft. Stanaj.mp3",
      "file": "../../songs/Lemaitre - Playing To Lose ft. Stanaj.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - All Time Low (Official Music Video).mp3",
      "file": "../../songs/Jon Bellion - All Time Low (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "twenty one pilots - My Blood (Official Video).mp3",
      "file": "../../songs/twenty one pilots - My Blood (Official Video).mp3",
      "howl": null
    },
    {
      "title": "Never Be Like You (feat. Kai) (Martin Solveig Remix).mp3",
      "file": "../../songs/Never Be Like You (feat. Kai) (Martin Solveig Remix).mp3",
      "howl": null
    },
    {
      "title": "Watsky- Bet Against Me [All You Can Do].mp3",
      "file": "../../songs/Watsky- Bet Against Me [All You Can Do].mp3",
      "howl": null
    },
    {
      "title": "twenty one pilots - Stressed Out [OFFICIAL VIDEO].mp3",
      "file": "../../songs/twenty one pilots - Stressed Out [OFFICIAL VIDEO].mp3",
      "howl": null
    },
    {
      "title": "AJR - DRAMA (Lyric Video).mp3",
      "file": "../../songs/AJR - DRAMA (Lyric Video).mp3",
      "howl": null
    },
    {
      "title": "Bass Bros.mp3",
      "file": "../../songs/Bass Bros.mp3",
      "howl": null
    },
    {
      "title": "Vice Ft. Jon Bellion - Obsession [Official Audio].mp3",
      "file": "../../songs/Vice Ft. Jon Bellion - Obsession [Official Audio].mp3",
      "howl": null
    },
    {
      "title": "Watsky - Welcome to the Family [official video].mp3",
      "file": "../../songs/Watsky - Welcome to the Family [official video].mp3",
      "howl": null
    },
    {
      "title": "Bryce Vine - Bella (feat. Emma Zander) [Official Lyric Video].mp3",
      "file": "../../songs/Bryce Vine - Bella (feat. Emma Zander) [Official Lyric Video].mp3",
      "howl": null
    },
    {
      "title": "Tessa Violet - Not Over You.mp3",
      "file": "../../songs/Tessa Violet - Not Over You.mp3",
      "howl": null
    },
    {
      "title": "Prise De Sens.mp3",
      "file": "../../songs/Prise De Sens.mp3",
      "howl": null
    },
    {
      "title": "shelter - rhÃªtorÃ­k (Official Audio).mp3",
      "file": "../../songs/shelter - rhÃªtorÃ­k (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "Waves Of Loneliness.mp3",
      "file": "../../songs/Waves Of Loneliness.mp3",
      "howl": null
    },
    {
      "title": "Witt Lowry - Wonder If You Wonder (Official Music Video).mp3",
      "file": "../../songs/Witt Lowry - Wonder If You Wonder (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "Liam Tracy - 'Fake Smile' [Official Audio].mp3",
      "file": "../../songs/Liam Tracy - 'Fake Smile' [Official Audio].mp3",
      "howl": null
    },
    {
      "title": "Life Of Dillon - Overload (The Chainsmokers Remix).mp3",
      "file": "../../songs/Life Of Dillon - Overload (The Chainsmokers Remix).mp3",
      "howl": null
    },
    {
      "title": "Kaiydo - Fruit Punch (Prod. Josh December).mp3",
      "file": "../../songs/Kaiydo - Fruit Punch (Prod. Josh December).mp3",
      "howl": null
    },
    {
      "title": "Katy Perry - Chained To The Rhythm (Official) ft. Skip Marley.mp3",
      "file": "../../songs/Katy Perry - Chained To The Rhythm (Official) ft. Skip Marley.mp3",
      "howl": null
    },
    {
      "title": "gnash - get well soon ft. liphemra [official audio].mp3",
      "file": "../../songs/gnash - get well soon ft. liphemra [official audio].mp3",
      "howl": null
    },
    {
      "title": "Sir Sly - Astronaut.mp3",
      "file": "../../songs/Sir Sly - Astronaut.mp3",
      "howl": null
    },
    {
      "title": "The Kooks - Junk Of The Heart (Happy).mp3",
      "file": "../../songs/The Kooks - Junk Of The Heart (Happy).mp3",
      "howl": null
    },
    {
      "title": "Sarah McLachlan - Building a Mystery (Live from Mirrorball).mp3",
      "file": "../../songs/Sarah McLachlan - Building a Mystery (Live from Mirrorball).mp3",
      "howl": null
    },
    {
      "title": "Ansel Elgort - You Can Count On Me (Audio) ft. Logic.mp3",
      "file": "../../songs/Ansel Elgort - You Can Count On Me (Audio) ft. Logic.mp3",
      "howl": null
    },
    {
      "title": "Mesita - Vigilant.mp3",
      "file": "../../songs/Mesita - Vigilant.mp3",
      "howl": null
    },
    {
      "title": "Machine Gun Kelly, Camila Cabello - Bad Things.mp3",
      "file": "../../songs/Machine Gun Kelly, Camila Cabello - Bad Things.mp3",
      "howl": null
    },
    {
      "title": "Chapter Three - The Great American Game.mp3",
      "file": "../../songs/Chapter Three - The Great American Game.mp3",
      "howl": null
    },
    {
      "title": "Tessa Violet - Crush (Official Music Video).mp3",
      "file": "../../songs/Tessa Violet - Crush (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "BeauDamian X PHI NIX - New Highs.mp3",
      "file": "../../songs/BeauDamian X PHI NIX - New Highs.mp3",
      "howl": null
    },
    {
      "title": "Surgical Rewind.mp3",
      "file": "../../songs/Surgical Rewind.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Blu (Official Audio).mp3",
      "file": "../../songs/Jon Bellion - Blu (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "AJR - Burn The House Down [Official Video].mp3",
      "file": "../../songs/AJR - Burn The House Down [Official Video].mp3",
      "howl": null
    },
    {
      "title": "Tigerlily - La Roux.mp3",
      "file": "../../songs/Tigerlily - La Roux.mp3",
      "howl": null
    },
    {
      "title": "Witt Lowry - Dreaming With Our Eyes Open (Official Music Video).mp3",
      "file": "../../songs/Witt Lowry - Dreaming With Our Eyes Open (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "Kaiydo - Reflections.mp3",
      "file": "../../songs/Kaiydo - Reflections.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Overwhelming.mp3",
      "file": "../../songs/Jon Bellion - Overwhelming.mp3",
      "howl": null
    },
    {
      "title": "George Watsky - Whoa Whoa Whoa lyrics.mp3",
      "file": "../../songs/George Watsky - Whoa Whoa Whoa lyrics.mp3",
      "howl": null
    },
    {
      "title": "Tessa Violet - Bad Ideas (Official Music Video).mp3",
      "file": "../../songs/Tessa Violet - Bad Ideas (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "Tessa Violet - On My Own (lofi).mp3",
      "file": "../../songs/Tessa Violet - On My Own (lofi).mp3",
      "howl": null
    },
    {
      "title": "Matstubs - Kings And Queens Of Summer.mp3",
      "file": "../../songs/Matstubs - Kings And Queens Of Summer.mp3",
      "howl": null
    },
    {
      "title": "Foreign Air - Caffeine (Official Audio).mp3",
      "file": "../../songs/Foreign Air - Caffeine (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "Lorde - Homemade Dynamite (Feat. Khalid, Post Malone & SZA) [REMIX].mp3",
      "file": "../../songs/Lorde - Homemade Dynamite (Feat. Khalid, Post Malone & SZA) [REMIX].mp3",
      "howl": null
    },
    {
      "title": "Timeflies - Gravity (Official Audio).mp3",
      "file": "../../songs/Timeflies - Gravity (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "MisterWives - Our Own House.mp3",
      "file": "../../songs/MisterWives - Our Own House.mp3",
      "howl": null
    },
    {
      "title": "Ed Sheeran - Shape of You [Official Video].mp3",
      "file": "../../songs/Ed Sheeran - Shape of You [Official Video].mp3",
      "howl": null
    },
    {
      "title": "Truce - Nathan  Nzanga.mp3",
      "file": "../../songs/Truce - Nathan  Nzanga.mp3",
      "howl": null
    },
    {
      "title": "Abstract - I Do This (feat. Roze) (Prod. Drumma Battalion).mp3",
      "file": "../../songs/Abstract - I Do This (feat. Roze) (Prod. Drumma Battalion).mp3",
      "howl": null
    },
    {
      "title": "Andrew McMahon in the Wilderness - So Close (Official Music Video).mp3",
      "file": "../../songs/Andrew McMahon in the Wilderness - So Close (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": " NIGHT RIOTS _ - Contagious (Official Music Video).mp3",
      "file": "../../songs/ NIGHT RIOTS _ - Contagious (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "AJR - Weak (OFFICIAL MUSIC VIDEO).mp3",
      "file": "../../songs/AJR - Weak (OFFICIAL MUSIC VIDEO).mp3",
      "howl": null
    },
    {
      "title": "Chiddy Bang Talking to Myself (High Quality).mp3",
      "file": "../../songs/Chiddy Bang Talking to Myself (High Quality).mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Halloween (Official Audio).mp3",
      "file": "../../songs/Jon Bellion - Halloween (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "The Strokes - Reptilia (Official Music Video).mp3",
      "file": "../../songs/The Strokes - Reptilia (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "The Kooks - Bad Habit.mp3",
      "file": "../../songs/The Kooks - Bad Habit.mp3",
      "howl": null
    },
    {
      "title": "Shortstraw - Ignorance is Bliss (Official Video).mp3",
      "file": "../../songs/Shortstraw - Ignorance is Bliss (Official Video).mp3",
      "howl": null
    },
    {
      "title": "Witt Lowry - Numb (Official Music Video).mp3",
      "file": "../../songs/Witt Lowry - Numb (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "Dustin Hatzenbuhler - Original Things (OFFICIAL LYRIC VIDEO).mp3",
      "file": "../../songs/Dustin Hatzenbuhler - Original Things (OFFICIAL LYRIC VIDEO).mp3",
      "howl": null
    },
    {
      "title": "Hoodie Allen - Surprise Party (feat. Blackbear).mp3",
      "file": "../../songs/Hoodie Allen - Surprise Party (feat. Blackbear).mp3",
      "howl": null
    },
    {
      "title": "Watsky- All Like Whatever [MUSIC VIDEO].mp3",
      "file": "../../songs/Watsky- All Like Whatever [MUSIC VIDEO].mp3",
      "howl": null
    },
    {
      "title": "AJR - 'My Calling' [Official Audio].mp3",
      "file": "../../songs/AJR - 'My Calling' [Official Audio].mp3",
      "howl": null
    },
    {
      "title": "Kiesza - Hideaway.mp3",
      "file": "../../songs/Kiesza - Hideaway.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Conversations with my Wife (Acoustic).mp3",
      "file": "../../songs/Jon Bellion - Conversations with my Wife (Acoustic).mp3",
      "howl": null
    },
    {
      "title": "Max Frost â€“ A$$hole (No Apologies) [Official Audio].mp3",
      "file": "../../songs/Max Frost â€“ A$$hole (No Apologies) [Official Audio].mp3",
      "howl": null
    },
    {
      "title": "High Hopes.mp3",
      "file": "../../songs/High Hopes.mp3",
      "howl": null
    },
    {
      "title": "The Young Wild - Not a One (Official Video).mp3",
      "file": "../../songs/The Young Wild - Not a One (Official Video).mp3",
      "howl": null
    },
    {
      "title": "La Roux - In For The Kill.mp3",
      "file": "../../songs/La Roux - In For The Kill.mp3",
      "howl": null
    },
    {
      "title": "Tessa Violet - Haze.mp3",
      "file": "../../songs/Tessa Violet - Haze.mp3",
      "howl": null
    },
    {
      "title": "One Step (feat. Wax & Watsky).mp3",
      "file": "../../songs/One Step (feat. Wax & Watsky).mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - New York Soul (Official Music Video).mp3",
      "file": "../../songs/Jon Bellion - New York Soul (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "AJR - Growing Old On Bleecker Street [Official Audio].mp3",
      "file": "../../songs/AJR - Growing Old On Bleecker Street [Official Audio].mp3",
      "howl": null
    },
    {
      "title": "Watsky 02 - Amplified (feat. Rafael Casal).mp3",
      "file": "../../songs/Watsky 02 - Amplified (feat. Rafael Casal).mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Wutup Snow (ft. Blaque Keyz) [Translations Through Speakers].mp3",
      "file": "../../songs/Jon Bellion - Wutup Snow (ft. Blaque Keyz) [Translations Through Speakers].mp3",
      "howl": null
    },
    {
      "title": "Foster The People - Worst Nites (Official Audio).mp3",
      "file": "../../songs/Foster The People - Worst Nites (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "Jared Evan - Role Model.mp3",
      "file": "../../songs/Jared Evan - Role Model.mp3",
      "howl": null
    },
    {
      "title": "Huey Mack - Adderall Thoughts Pt. 2.mp3",
      "file": "../../songs/Huey Mack - Adderall Thoughts Pt. 2.mp3",
      "howl": null
    },
    {
      "title": "Red to Black - Fort Minor (feat. Kenna, Jonah Matranga and Styles of Beyond).mp3",
      "file": "../../songs/Red to Black - Fort Minor (feat. Kenna, Jonah Matranga and Styles of Beyond).mp3",
      "howl": null
    },
    {
      "title": "Sir Sly - High.mp3",
      "file": "../../songs/Sir Sly - High.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Run Wild.mp3",
      "file": "../../songs/Jon Bellion - Run Wild.mp3",
      "howl": null
    },
    {
      "title": "Fitz and the Tantrums - Fool [Official Video].mp3",
      "file": "../../songs/Fitz and the Tantrums - Fool [Official Video].mp3",
      "howl": null
    },
    {
      "title": "Fytch - Echoes.mp3",
      "file": "../../songs/Fytch - Echoes.mp3",
      "howl": null
    },
    {
      "title": "Abstract - Don't Change (Prod. Craig McAllister).mp3",
      "file": "../../songs/Abstract - Don't Change (Prod. Craig McAllister).mp3",
      "howl": null
    },
    {
      "title": "Whethan - Good Nights (feat. Mascolo).mp3",
      "file": "../../songs/Whethan - Good Nights (feat. Mascolo).mp3",
      "howl": null
    },
    {
      "title": "The Lumineers - Ophelia (Official Video).mp3",
      "file": "../../songs/The Lumineers - Ophelia (Official Video).mp3",
      "howl": null
    },
    {
      "title": "Queensway.mp3",
      "file": "../../songs/Queensway.mp3",
      "howl": null
    },
    {
      "title": "Electric Guest - Oh Devil (feat. Devin Di Dakta) [Radio Version].mp3",
      "file": "../../songs/Electric Guest - Oh Devil (feat. Devin Di Dakta) [Radio Version].mp3",
      "howl": null
    },
    {
      "title": "Fake You Out.mp3",
      "file": "../../songs/Fake You Out.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Mah's Joint feat. Quincy Jones (Official Audio).mp3",
      "file": "../../songs/Jon Bellion - Mah's Joint feat. Quincy Jones (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "AJR - TURNING OUT (Animated Short Film).mp3",
      "file": "../../songs/AJR - TURNING OUT (Animated Short Film).mp3",
      "howl": null
    },
    {
      "title": "AJR - I'm Not Famous (OFFICIAL MUSIC VIDEO).mp3",
      "file": "../../songs/AJR - I'm Not Famous (OFFICIAL MUSIC VIDEO).mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - JT (Official Audio).mp3",
      "file": "../../songs/Jon Bellion - JT (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "Frenship - 1000 Nights (Audio).mp3",
      "file": "../../songs/Frenship - 1000 Nights (Audio).mp3",
      "howl": null
    },
    {
      "title": "Skizzy Mars - Crash ft. Pell [Audio].mp3",
      "file": "../../songs/Skizzy Mars - Crash ft. Pell [Audio].mp3",
      "howl": null
    },
    {
      "title": "Major Lazer - Powerful (feat. Ellie Goulding & Tarrus Riley) (Official Music Video).mp3",
      "file": "../../songs/Major Lazer - Powerful (feat. Ellie Goulding & Tarrus Riley) (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "QuESt - Jon Bellion's One Way To San Diego.mp3",
      "file": "../../songs/QuESt - Jon Bellion's One Way To San Diego.mp3",
      "howl": null
    },
    {
      "title": "Jez Dior - Long Sun.mp3",
      "file": "../../songs/Jez Dior - Long Sun.mp3",
      "howl": null
    },
    {
      "title": "Fall Out Boy - Young and Menace (Lyrics).mp3",
      "file": "../../songs/Fall Out Boy - Young and Menace (Lyrics).mp3",
      "howl": null
    },
    {
      "title": "Unkle Adams - Original (Official Music Video).mp3",
      "file": "../../songs/Unkle Adams - Original (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "Sweater Beats - Altar (feat. R.LUM.R).mp3",
      "file": "../../songs/Sweater Beats - Altar (feat. R.LUM.R).mp3",
      "howl": null
    },
    {
      "title": "Tessa Violet - Dream.mp3",
      "file": "../../songs/Tessa Violet - Dream.mp3",
      "howl": null
    },
    {
      "title": "Watsky- Tiny Glowing Screens Part 3 ft. Camila Recchio & Danny McClain (x INFINITY).mp3",
      "file": "../../songs/Watsky- Tiny Glowing Screens Part 3 ft. Camila Recchio & Danny McClain (x INFINITY).mp3",
      "howl": null
    },
    {
      "title": "Old School (With Lyrics) - B. Reith.mp3",
      "file": "../../songs/Old School (With Lyrics) - B. Reith.mp3",
      "howl": null
    },
    {
      "title": "Watsky- Yes Britannia [x Infinity].mp3",
      "file": "../../songs/Watsky- Yes Britannia [x Infinity].mp3",
      "howl": null
    },
    {
      "title": "AJ Super - Nightmares [Royalty Free Music].mp3",
      "file": "../../songs/AJ Super - Nightmares [Royalty Free Music].mp3",
      "howl": null
    },
    {
      "title": "SAJFLEO - Nuage toxique.mp3",
      "file": "../../songs/SAJFLEO - Nuage toxique.mp3",
      "howl": null
    },
    {
      "title": "Luke Christopher - Need That Love (Audio).mp3",
      "file": "../../songs/Luke Christopher - Need That Love (Audio).mp3",
      "howl": null
    },
    {
      "title": "AJR - I'm Ready [Official Music Video].mp3",
      "file": "../../songs/AJR - I'm Ready [Official Music Video].mp3",
      "howl": null
    },
    {
      "title": "LO.mp3",
      "file": "../../songs/LO.mp3",
      "howl": null
    },
    {
      "title": "Max Frost - High All Day [Music Video].mp3",
      "file": "../../songs/Max Frost - High All Day [Music Video].mp3",
      "howl": null
    },
    {
      "title": "Skizzy Mars - Comb [Audio].mp3",
      "file": "../../songs/Skizzy Mars - Comb [Audio].mp3",
      "howl": null
    },
    {
      "title": "Along For The Ride Original Song.mp3",
      "file": "../../songs/Along For The Ride Original Song.mp3",
      "howl": null
    },
    {
      "title": "MisterWives - Not Your Way (Audio).mp3",
      "file": "../../songs/MisterWives - Not Your Way (Audio).mp3",
      "howl": null
    },
    {
      "title": "JP Cooper - September Song.mp3",
      "file": "../../songs/JP Cooper - September Song.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Adult Swim feat. Tuamie (Official Audio).mp3",
      "file": "../../songs/Jon Bellion - Adult Swim feat. Tuamie (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "D-WHY - 'New York Times' (Official Music Video).mp3",
      "file": "../../songs/D-WHY - 'New York Times' (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - The Internet (Official Audio).mp3",
      "file": "../../songs/Jon Bellion - The Internet (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "Welcome [Standard Version] - Fort Minor (Official Video).mp3",
      "file": "../../songs/Welcome [Standard Version] - Fort Minor (Official Video).mp3",
      "howl": null
    },
    {
      "title": "twenty one pilots - Nico And The Niners (Official Video).mp3",
      "file": "../../songs/twenty one pilots - Nico And The Niners (Official Video).mp3",
      "howl": null
    },
    {
      "title": "Witt Lowry - Kindest Regards (Prod. Dan Haynes) (Lyrics).mp3",
      "file": "../../songs/Witt Lowry - Kindest Regards (Prod. Dan Haynes) (Lyrics).mp3",
      "howl": null
    },
    {
      "title": "Rock Ring Park (feat. Watsky & Herbal T).mp3",
      "file": "../../songs/Rock Ring Park (feat. Watsky & Herbal T).mp3",
      "howl": null
    },
    {
      "title": "Talking To Myself Watsky Lyrics.mp3",
      "file": "../../songs/Talking To Myself Watsky Lyrics.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Let's Begin feat. Roc Marciano, RZA, B.Keyz & Travis Mendes (Official Audio).mp3",
      "file": "../../songs/Jon Bellion - Let's Begin feat. Roc Marciano, RZA, B.Keyz & Travis Mendes (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "Elohim - Hallucinating.mp3",
      "file": "../../songs/Elohim - Hallucinating.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion  - Stupid Deep (Official Audio).mp3",
      "file": "../../songs/Jon Bellion  - Stupid Deep (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "AJR - 'Big Idea' [Official Audio].mp3",
      "file": "../../songs/AJR - 'Big Idea' [Official Audio].mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Eyes To The Sky (Official Audio).mp3",
      "file": "../../songs/Jon Bellion - Eyes To The Sky (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "samsa  - burfi ft.  THIAGO.mp3",
      "file": "../../songs/samsa  - burfi ft.  THIAGO.mp3",
      "howl": null
    },
    {
      "title": "Watsky - MEAN ASS DRUNK [Official Music Video].mp3",
      "file": "../../songs/Watsky - MEAN ASS DRUNK [Official Music Video].mp3",
      "howl": null
    },
    {
      "title": "Petrified - Fort Minor.mp3",
      "file": "../../songs/Petrified - Fort Minor.mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Cautionary Tales (Official Audio).mp3",
      "file": "../../songs/Jon Bellion - Cautionary Tales (Official Audio).mp3",
      "howl": null
    },
    {
      "title": "Life Of Dillon - Focus ft. L Marshall.mp3",
      "file": "../../songs/Life Of Dillon - Focus ft. L Marshall.mp3",
      "howl": null
    },
    {
      "title": "Bryce Vine - Drew Barrymore [Official Music Video].mp3",
      "file": "../../songs/Bryce Vine - Drew Barrymore [Official Music Video].mp3",
      "howl": null
    },
    {
      "title": "Science Fiction.mp3",
      "file": "../../songs/Science Fiction.mp3",
      "howl": null
    },
    {
      "title": "AJR - OVERTURE (Official Video).mp3",
      "file": "../../songs/AJR - OVERTURE (Official Video).mp3",
      "howl": null
    },
    {
      "title": "Flume - Never Be Like You feat. Kai.mp3",
      "file": "../../songs/Flume - Never Be Like You feat. Kai.mp3",
      "howl": null
    },
    {
      "title": "Hoodie Allen - 'No Interruption' (Official Video).mp3",
      "file": "../../songs/Hoodie Allen - 'No Interruption' (Official Video).mp3",
      "howl": null
    },
    {
      "title": "AJR - Role Models (Official Music Video).mp3",
      "file": "../../songs/AJR - Role Models (Official Music Video).mp3",
      "howl": null
    },
    {
      "title": "MISSIO - Bottom Of The Deep Blue Sea [Lyrics].mp3",
      "file": "../../songs/MISSIO - Bottom Of The Deep Blue Sea [Lyrics].mp3",
      "howl": null
    },
    {
      "title": "Jon Bellion - Timeless [Translations Through Speakers].mp3",
      "file": "../../songs/Jon Bellion - Timeless [Translations Through Speakers].mp3",
      "howl": null
    },
    {
      "title": "AJR's New Single 'It's On Us'.mp3",
      "file": "../../songs/AJR's New Single 'It's On Us'.mp3",
      "howl": null
    },
    {
      "title": "MISSIO - Bottom Of The Deep Blue Sea [Lyrics].mp3",
      "file": "../../songs/MISSIO - Bottom Of The Deep Blue Sea [Lyrics].mp3",
      "howl": null
    }
]);

// Bind our player controls.
playBtn.addEventListener('click', function() {
  player.volume(0.3);
  player.play();
});
pauseBtn.addEventListener('click', function() {
  player.pause();
});
prevBtn.addEventListener('click', function() {
  player.skip('prev');
});
nextBtn.addEventListener('click', function() {
  player.skip('next');
});
nextRandBtn.addEventListener('click', function() {
  player.skipTo(randSong(player.counts));
});
waveform.addEventListener('click', function(event) {
  player.seek(event.clientX / window.innerWidth);
});
playlistBtn.addEventListener('click', function() {
  player.togglePlaylist();
});
playlist.addEventListener('click', function() {
  player.togglePlaylist();
});
volumeBtn.addEventListener('click', function() {
  player.toggleVolume();
});
volume.addEventListener('click', function() {
  player.toggleVolume();
});

// Setup the event listeners to enable dragging of volume slider.
barEmpty.addEventListener('click', function(event) {
  var per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener('mousedown', function() {
  window.sliderDown = true;
});
sliderBtn.addEventListener('touchstart', function() {
  window.sliderDown = true;
});
volume.addEventListener('mouseup', function() {
  window.sliderDown = false;
});
volume.addEventListener('touchend', function() {
  window.sliderDown = false;
});

var randSong = function(max) {
  return Math.floor(Math.random()*(max));
}

var move = function(event) {
  if (window.sliderDown) {
    var x = event.clientX || event.touches[0].clientX;
    var startX = window.innerWidth * 0.05;
    var layerX = x - startX;
    var per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
    player.volume(per);
  }
};

volume.addEventListener('mousemove', move);
volume.addEventListener('touchmove', move);

// Setup the "waveform" animation.
var wave = new SiriWave({
  container: waveform,
  width: window.innerWidth,
  height: window.innerHeight * 0.3,
  cover: true,
  speed: 0.03,
  amplitude: 0.7,
  frequency: 2
});
wave.start();

// Update the height of the wave animation.
// These are basically some hacks to get SiriWave.js to do what we want.
var resize = function() {
  var height = window.innerHeight * 0.3;
  var width = window.innerWidth;
  wave.height = height;
  wave.height_2 = height / 2;
  wave.MAX = wave.height_2 - 4;
  wave.width = width;
  wave.width_2 = width / 2;
  wave.width_4 = width / 4;
  wave.canvas.height = height;
  wave.canvas.width = width;
  wave.container.style.margin = -(height / 2) + 'px auto';

  // Update the position of the slider.
  var sound = player.playlist[player.index].howl;
  if (sound) {
    var vol = sound.volume();
    var barWidth = (vol * 0.9);
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  }
};
window.addEventListener('resize', resize);
resize();
