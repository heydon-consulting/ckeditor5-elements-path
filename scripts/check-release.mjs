/**
 * @file
 * Checks that what's about to be published is the tagged, committed release.
 *
 * Run by `prepublishOnly`, after a fresh build: the committed build/ must be
 * what the source builds to (GitHub's release downloads come from the tag,
 * not npm), nothing may be uncommitted, and the commit must be tagged
 * v<version>.
 */

import { execFileSync } from 'node:child_process';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const fail = (message) => {
  console.error(`\nNot publishing: ${message}\n`);
  process.exit(1);
};

const changed = git('status', '--porcelain');
if (changed) {
  fail(`the working tree isn't clean after building. Commit the build (npm version does this) and any other changes:\n${changed}`);
}

const version = process.env.npm_package_version;
const tag = `v${version}`;
let tagged;
try {
  tagged = git('rev-parse', `${tag}^{commit}`);
}
catch {
  fail(`there's no ${tag} tag. Make releases with \`npm version <patch|minor|major>\`.`);
}
if (tagged !== git('rev-parse', 'HEAD')) {
  fail(`${tag} isn't the checked-out commit.`);
}

console.log(`${tag}: the committed build matches the source.`);
