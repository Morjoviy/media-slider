# Media Slider

Mixed-media Swiper component for Webflow.

Supports:

- Bunny Stream links
- Bunny Storage videos (`.mp4`, `.webm`, `.mov`, `.m4v`)
- Images from Bunny Storage or any public CDN
- Automatic portrait/landscape detection
- Click-to-switch slides
- One swipe per slide
- Responsive mobile/tablet layout
- One active video on mobile
- Visible videos on desktop

## Webflow structure

```text
.media-slider
├── .media-slider-data
└── .swiper
    └── .swiper-wrapper
```

Bind `.media-slider-data` to a multiline Component Property and put one URL on each line.

Example:

```text
https://player.mediadelivery.net/play/705270/VIDEO_ID
https://twy-com.b-cdn.net/Arkis/image_4x5.webp
https://twy-com.b-cdn.net/Arkis/video_16x9.mp4
```

## Add to `<head>`

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Morjoviy/media-slider@main/media-slider.css">
```

## Add before `</body>`

```html
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/Morjoviy/media-slider@main/media-slider.js"></script>
```

## Bunny Stream library

The current Stream CDN hostname is configured near the top of `media-slider.js`:

```js
bunnyStreamHostname: "vz-f88e5e4c-151.b-cdn.net"
```

Change it only if the Bunny Stream library changes.

## Responsive behavior

Desktop:

- Portrait slide: `33.333vw`
- Landscape slide: `66.666vw`
- Gap: `10px`
- Visible videos play

Tablet/mobile:

- Every slide: `87vw`
- Left/right offset: `10px`
- Gap: `10px`
- Only the active video plays
- A single slide uses the full container width minus `20px`
