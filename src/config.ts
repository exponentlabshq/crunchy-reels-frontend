export const config: Config = {
  socials: {
    twitter: "https://twitter.com/crunchyreels",
    discord: "https://discord.com",
    homepage: "https://crunchyreels.io",
  },

  defaultAsset: {
    name: "Anime Token",
    image: "/placeholders/asset.png",
  },

  ourStory: {
    title: "The Future of Anime Content",
    description: `CrunchyReels revolutionizes anime short-form content investment by enabling fractional ownership of tokenized creator projects. Support your favorite anime creators and own a piece of the content you love through blockchain technology on Bitcoin's most secure Layer 2 - Stacks. Our mission is to connect anime fans with creators, making content investment accessible, transparent, and rewarding for the entire community.`,
    discordLink: "https://discord.com",
  },
}

export interface Config {
  socials?: {
    twitter?: string
    discord?: string
    homepage?: string
  }

  defaultAsset?: {
    name: string
    image: string
  }

  ourStory?: {
    title: string
    subTitle?: string
    description: string
    discordLink: string
  }
}
