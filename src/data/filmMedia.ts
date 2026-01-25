/**
 * Hardcoded film media data
 * Maps smart contract film IDs to local media assets
 */

export interface Short {
  id: number
  title: string
  duration: string // e.g., "2:45"
  videoUrl: string
}

export interface FilmMedia {
  filmId: number
  thumbnail: string
  shorts: Short[]
}

/**
 * Hardcoded film media mapped by smart contract film ID
 */
export const FILM_MEDIA: FilmMedia[] = [
  {
    filmId: 1,
    thumbnail: "/media/1/thumb.png",
    shorts: [
      {
        id: 1,
        title: "Opening Scene",
        duration: "0:10",
        videoUrl: "https://res.cloudinary.com/djiemoxze/video/upload/v1769307225/jsfs1_ob8ck5.mp4",
      },
      {
        id: 2,
        title: "Scene 1",
        duration: "0:10",
        videoUrl: "https://res.cloudinary.com/djiemoxze/video/upload/v1769307309/jsfs2_jacts7.mp4",
      },
      {
        id: 3,
        title: "Scene 2",
        duration: "0:09",
        videoUrl: "https://res.cloudinary.com/djiemoxze/video/upload/v1769307336/jsfs3_sqzvki.mp4",
      },
      {
        id: 4,
        title: "Scene 3",
        duration: "0:09",
        videoUrl: "https://res.cloudinary.com/djiemoxze/video/upload/v1769307354/jsfs4_zlp6yh.mp4",
      },
      {
        id: 5,
        title: "Scene 4",
        duration: "0:09",
        videoUrl: "https://res.cloudinary.com/djiemoxze/video/upload/v1769307362/jsfs5_na2bfo.mp4",
      },
    ],
  },
  {
    filmId: 2,
    thumbnail: "/media/2/thumb.png",
    shorts: [
      {
        id: 1,
        title: "Teaser",
        duration: "0:10",
        videoUrl: "https://res.cloudinary.com/djiemoxze/video/upload/v1769308269/ulso1_wzwn5c.mp4",
      },
      {
        id: 2,
        title: "Scene 1",
        duration: "0:10",
        videoUrl: "https://res.cloudinary.com/djiemoxze/video/upload/v1769308218/ulso2_bx87ol.mp4",
      },
      {
        id: 3,
        title: "Scene 2",
        duration: "0:10",
        videoUrl: "https://res.cloudinary.com/djiemoxze/video/upload/v1769308294/ulso3_ggjd2y.mp4",
      },
    ],
  },
]

/**
 * Get film media by smart contract film ID
 */
export function getFilmMedia(filmId: number): FilmMedia | undefined {
  return FILM_MEDIA.find((media) => media.filmId === filmId)
}

/**
 * Get thumbnail URL for a film, with fallback
 */
export function getFilmThumbnail(filmId: number): string | null {
  const media = getFilmMedia(filmId)
  return media?.thumbnail ?? null
}

/**
 * Get shorts for a film
 */
export function getFilmShorts(filmId: number): Short[] {
  const media = getFilmMedia(filmId)
  return media?.shorts ?? []
}

/**
 * Check if a film has media configured
 */
export function hasFilmMedia(filmId: number): boolean {
  return FILM_MEDIA.some((media) => media.filmId === filmId)
}
