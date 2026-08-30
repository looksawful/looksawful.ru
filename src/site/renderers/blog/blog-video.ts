import type { BlogCover, BlogVideo } from "../../blog/types.ts";
import { escapeHtml } from "../../../utils/html.ts";

function renderVideoPoster(poster?: BlogCover): string {
  if (!poster) return "";
  return `<img class="blog-video__poster" src="${escapeHtml(poster.src)}" alt="" width="${poster.width}" height="${poster.height}" decoding="async">`;
}

export function renderBlogVideo(video: BlogVideo, poster?: BlogCover): string {
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;
  return `<figure class="blog-video" data-blog-video data-blog-video-id="${video.id}" data-blog-video-title="${escapeHtml(video.title)}">
  <div class="blog-video__media" data-blog-video-media>
    <button class="blog-video__trigger" type="button" data-blog-video-trigger aria-label="Воспроизвести: ${escapeHtml(video.title)}">${renderVideoPoster(poster)}<span class="blog-video__trigger-label">смотреть видео</span></button>
  </div>
  <figcaption class="blog-video__label">${escapeHtml(video.title)} · <a href="${watchUrl}" target="_blank" rel="noopener noreferrer">открыть на YouTube ↗</a></figcaption>
</figure>`;
}
