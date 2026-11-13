// CHANGELOG.md of this repository, split into its intro and the version entries, for /docs/changelog/.
import { readRepo } from "../../lib/repo.js";

const text = readRepo("CHANGELOG.md").toString().replace(/^# Changelog\s*\n/, "");
const first = text.indexOf("\n## ");

export default {
  intro: text.slice(0, first).trim(),
  body: text.slice(first + 1).trim(),
};
