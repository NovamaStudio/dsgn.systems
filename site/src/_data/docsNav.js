// Documentation sidebar, in reading order. Prev / next links on each page follow this order too.
// Component groups come from src/docs/examples.mjs, so a new component appears here by itself.
import { byGroup } from "../../lib/components.js";

export default [
  {
    title: "Start",
    items: [
      { label: "Getting started", href: "/docs/" },
      { label: "Theme customizer", href: "/theme/" },
      { label: "Changelog", href: "/docs/changelog/" },
    ],
  },
  {
    title: "Foundations",
    items: [
      { label: "Colour", href: "/docs/foundations/colour/" },
      { label: "Typography", href: "/docs/foundations/typography/" },
      { label: "Spacing and size", href: "/docs/foundations/spacing/" },
      { label: "Modes", href: "/docs/foundations/modes/" },
    ],
  },
  { title: "Components", items: [{ label: "All components", href: "/docs/components/" }] },
  ...byGroup.map((g) => ({ title: g.title, items: g.items.map((c) => ({ label: c.name, href: c.href })) })),
];
