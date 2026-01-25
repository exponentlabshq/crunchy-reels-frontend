export const config: Config = {
  socials: {
    twitter: "https://twitter.com/shortstarter",
    discord: "https://discord.com",
    homepage: "https://shortstarter.io",
  },

  defaultAsset: {
    name: "Film Token",
    image: "/placeholders/asset.png",
  },

  ourStory: {
    title: "The Future of Film Investment",
    description: `ShortStarter democratizes film investment by enabling fractional ownership of tokenized film projects. Own a piece of cinema history through blockchain technology on Bitcoin's most secure Layer 2 - Stacks. Our mission is to make film investment accessible, transparent, and rewarding for everyone.`,
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
