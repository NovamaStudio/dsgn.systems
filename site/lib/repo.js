// Paths into the dsgn.systems repository this site lives in. The site documents the code next to it
// (src/, dist/ after `npm run build`, CHANGELOG.md), never a published npm copy, so docs and code
// change in the same commit.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const repo = (path = "") => fileURLToPath(new URL(`../../${path}`, import.meta.url));
export const readRepo = (path) => readFileSync(repo(path));
