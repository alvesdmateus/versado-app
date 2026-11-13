/** Canonical URLs of the course → chapter → lesson hierarchy. */
export const trackPath = (trackId: string) => `/tracks/${encodeURIComponent(trackId)}`;

export const chapterPath = (trackId: string, chapterId: string) =>
  `${trackPath(trackId)}/chapters/${encodeURIComponent(chapterId)}`;

export const lessonPath = (m: { id: string; trackId: string; chapterId: string }) =>
  `${chapterPath(m.trackId, m.chapterId)}/lessons/${encodeURIComponent(m.id)}`;
