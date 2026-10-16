# YouTube Classic

A Chrome extension that puts the watch page back to a classic layout: the video and comments on the left, related videos in a sidebar on the right.

## What it does

On a video page:

- Moves comments back under the player.
- Moves related videos into the right sidebar.
- Gives that sidebar its own scrollbar, so you can scroll videos without scrolling the rest of the page.
- Keeps the sidebar at the right edge, 400px wide. The player and comments fill the space to the left of it.
- Hides the Description and Comments buttons on the far right edge.

On the home page:

- Can hide the Shorts rows.
- Can hide the games row (YouTube Playables).

## Options

Open the extension popup to change these. All three start turned on.

| Option | What it does |
| --- | --- |
| Disable commenting | Removes the comment box and reply buttons. The same checkbox also appears under the video. |
| Remove Shorts | Hides Shorts rows on the home page. |
| Remove Games | Hides the games row on the home page. |

## Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose this folder.
4. Refresh YouTube.

After an update, click the reload button on the extension card, then refresh the YouTube tab.

## License

[MIT](LICENSE)
