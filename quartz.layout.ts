import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// Components shared across the whole site
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [], // Vous pouvez remettre les commentaires ici si vous voulez
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/losth230/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// Components on your main content pages
export const defaultPage: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    // L'explorateur (vos dossiers) est remonté ici
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [
    // La table des matières (Plan) est tout en haut
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
    // Le graphique est tout en bas
    Component.Graph(),
  ],
}

// Components for lists of pages (like tags or folders)
export const listPage: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [],
}