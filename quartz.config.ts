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
        // "Cinzel Decorative" ou "MedievalSharp" pour un look très titre fantaisie
        header: "Cinzel Decorative",
        // "Crimson Text" ou "EB Garamond" pour un aspect livre ancien très lisible
        body: "Crimson Text",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#f0e6d2", // Beige chaud (couleur parchemin de base)
          lightgray: "#d6cbb1", // Éléments d'interface discrets
          gray: "#8f8576", // Dates et métadonnées
          darkgray: "#3a2f26", // Texte principal (brun sépia très foncé)
          dark: "#241812", // Titres (presque noir, teinte brou de noix)
          secondary: "#702318", // Liens : Rouge sang séché (plus médiéval que le bleu)
          tertiary: "#a33e2e", // Survol des liens
          highlight: "rgba(112, 35, 24, 0.15)", // Surlignage rougeâtre
          textHighlight: "#fff23688",
        },
        darkMode: {
          // Mode sombre "Donjon"
          light: "#1c1816",
          lightgray: "#36302c",
          gray: "#8f8576",
          darkgray: "#dcd2c4",
          dark: "#ebe3d8",
          secondary: "#bf8b4d", // Or terni pour les liens en mode sombre
          tertiary: "#e6b677",
          highlight: "rgba(191, 139, 77, 0.15)",
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
