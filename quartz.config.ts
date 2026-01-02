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
    // quartz.config.ts (extrait)
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: { name: "Cinzel", weights: [400, 600, 700] },
        body: { name: "IM Fell English", weights: [400], includeItalic: true },
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#f3e7c6",        // base “papier”
          lightgray: "#d7c59a",
          gray: "#a88b5a",
          darkgray: "#3b2a1a",     // “encre”
          dark: "#23160c",
          secondary: "#7a2e19",    // liens (rouge/brun)
          tertiary: "#b14b2a",
          highlight: "rgba(122, 46, 25, 0.10)",
          textHighlight: "#fff1a888",
        },
        darkMode: {
          // “parchemin de nuit” (lisible mais chaleureux)
          light: "#1a120c",
          lightgray: "#2a1d12",
          gray: "#7a6a55",
          darkgray: "#f0e3c7",
          dark: "#fff6df",
          secondary: "#d9b26f",
          tertiary: "#c98b6b",
          highlight: "rgba(217, 178, 111, 0.14)",
          textHighlight: "#d9b26f55",
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
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
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
