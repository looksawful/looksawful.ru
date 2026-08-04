# Media Item

Один независимый image/video asset.

Public API:

```js
createMediaItem({ root, manifest })
createMediaItems({ root, manifest })
```

Canonical root:

```html
<figure data-media-item data-media-id="sensetique-01-03">
  <div data-media-surface>
    <img data-media-asset ... />
  </div>
  <figcaption data-media-caption hidden></figcaption>
</figure>
```

Компонент не знает project layout, container order, slider index или Accordion.
