# fs-youtube-player

> FirstSpirit's Shoppable (YouTube) Video Player - Demo WebComponent

As seen on [e-Spirit's](https://e-spirit.com) [Horizon DX 2020](https://www.e-spirit.com/de/sonderseiten/events/horizon-dx-online-de.html) (DE).

## Demo

Just open the [/demo](https://e-spirit.github.io/fs-youtube-player/demo/) to see the WebComponent in action.

## Usage

In order to use the FirstSpirit Shoppable YouTube Video Player within your project use the following markup.

```html
<fs-youtube-player video-id="youtube-video-id" nocookie muted>
  <!--
    optional attributes:
      nocookie - load the player via https://youtube-nocookie.com/ to force GDPR
      muted    - initialize video player muted
  -->
  <div data-time="0">
    <p>This will be displayed at second "0", so it is visible even if the player has not been started.</p>
  </div>

  <div data-time="92.365">
    <p>This will be displayed at minute "1:32.365".</p>
  </div>
</fs-youtube-player>
```

Furthermore you need the script from this repository. Just use the CDN version, like:

```html
<script type="module" src="https://unpkg.com/fs-youtube-player?module"></script>
<!-- or -->
<script defer src="https://unpkg.com/fs-youtube-player"></script>
```

## autoplay

You can use the autoplay attribute to force the video to start playing after it was loaded. But keep in mind, the autoplay videos don't count as views in youtube.

```html
<fs-youtube-player video-id="youtube-video-id" autoplay
```

## run locally

Finally start the demo with the following command:

```sh
npm run demo
```

It shows up the running demo on port 3000.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](./LICENSE) file for details.
