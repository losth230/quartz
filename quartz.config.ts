import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "C&P - JdR",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "fr-FR",
    baseUrl: "losth230.github.io/quartz",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Cinzel Decorative",
        body: "Crimson Text",
        code: "Fira Code",
      },
      colors: {
        lightMode: {
          light: "#f0e6d2",
          lightgray: "#e0d0b0",
          gray: "#a89f91",
          darkgray: "#4a403a",
          dark: "#2b2118",
          secondary: "#8b4513",
          tertiary: "#5c4033",
          highlight: "rgba(139, 69, 19, 0.15)",
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#2b2118",
          lightgray: "#3d3126",
          gray: "#6d5e50",
          darkgray: "#dccfb8",
          dark: "#f0e6d2",
          secondary: "#d4a373",
          tertiary: "#e9c46a",
          highlight: "rgba(212, 163, 115, 0.15)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
