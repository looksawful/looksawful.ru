# Media Gallery

CSS-only, mobile-first component for arranging image and video media.

## Responsibility

Media Gallery owns:

- item aspect ratios;
- `cover` / `contain` fit;
- gaps;
- columns;
- stacks;
- nested groups;
- pairs;
- masonry.

It does not own:

- Accordion disclosure or scroll behavior;
- outer section padding;
- project-specific colors or text;
- Slider state and timing;
- Compare, Canvas, WebGL or Filter behavior.

The parent supplies available width, external placement and optional public custom properties.

## Root

```html
<div
  class="media-gallery"
  data-media-gallery
  data-media-gallery-layout="landscape-four"
>
  <figure
    class="media-gallery__item"
    data-media-gallery-item
    data-media-ratio="landscape"
  >
    <img src="..." alt="" />
  </figure>
</div>
```

A single media item or Media Slider can be both the gallery root and item:

```html
<figure
  class="media-gallery media-gallery__item"
  data-media-gallery
  data-media-gallery-item
  data-media-gallery-layout="single"
  data-media-fit="contain"
  data-media-slider
>
  ...
</figure>
```

## Media

Direct `img` and `video` children are supported.

`data-media-fit`:

- `cover` — default;
- `contain`.

`data-media-position`:

- `top`;
- `bottom`;
- `left`;
- `right`.

`data-media-ratio`:

- `single`;
- `landscape`;
- `wide`;
- `banner`;
- `vertical`;
- `vertical-slider`;
- `tall`;
- `portrait`;
- `square`;
- `video`;
- `video-wide`.

## Layouts used on the site

- `single`;
- `feature-four`;
- `landscape-four`;
- `portrait-six`;
- `landscape-nine-landscape`.

The Jestei Pool filter is not a gallery and remains an isolated component.

## Available layout variants

- `quad`;
- `eight-two-rows`;
- `vertical-four`;
- `horizontal-stack`;
- `photo-group`;
- `masonry`;
- `two-squares-horizontal`;
- `trio`;
- `balanced-eight`;
- `mixed-quad`;
- `square-eight`;
- all layouts listed as currently used.

## Nested structures

For `landscape-nine-landscape`:

```html
<div data-media-gallery-group data-media-gallery-group-layout="square-nine">
  ...
</div>
```

For `balanced-eight`:

```html
<div data-media-gallery-pair="wide-left">
  ...
</div>
```

Supported pair values:

- `wide-left`;
- `wide-right`;
- `squares`.

## Public custom properties

- `--media-gallery-context-gap`;
- `--media-gallery-grid-max`;
- `--media-gallery-item-background`;
- `--media-gallery-object-fit`;
- `--media-gallery-object-position`;
- `--media-gallery-feature-ratio`.

The component has working defaults outside CV Accordion.

## `portrait-six` responsive behavior

- two columns by default;
- three columns above `40rem`;
- six columns in one row above `64rem`.
