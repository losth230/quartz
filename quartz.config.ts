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
    light: "#f5e6d3",        // Fond couleur parchemin
    lightgray: "#d8c8b0",    // Bordures douces (couleur papier vieilli)
    gray: "#8b7e66",         // Texte méta (dates, etc.)
    darkgray: "#3e3226",     // Texte principal (brun très foncé, comme de l'encre)
    dark: "#2a1f1b",         // Titres (presque noir)
    secondary: "#800020",    // Liens : Rouge bordeaux (comme un sceau de cire)
    tertiary: "#a05a2c",     // Survol des liens : Rouille
    highlight: "rgba(143, 159, 169, 0.15)",
    textHighlight: "#fff23688",
  },
  darkMode: {
    light: "#1a1614",        // Fond très sombre (brun/noir pierre)
    lightgray: "#2c2520",    // Bordures gris pierre
    gray: "#7a7267",         // Méta
    darkgray: "#c0b3a0",     // Texte principal (beige clair sur fond sombre)
    dark: "#e8dcca",         // Titres (blanc cassé)
    secondary: "#d4af37",    // Liens : Or / Laiton (pour ressortir sur le sombre)
    tertiary: "#c5a028",     // Survol : Or un peu plus foncé
    highlight: "rgba(143, 159, 169, 0.15)",
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
