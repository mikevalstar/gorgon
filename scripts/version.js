// in the ../library folder there is a README.md file
// read the package.json file in the ../library folder
// and from the results create a string with a sheilds.io badge for version
// and add it to the README.md file in the ../library folder
// also update the version in the ../gorgonjs.dev/src/pages/index.astro file

const fs = require('fs');
const path = require('path');
const packageJson = require('../library/package.json');

const versionBadge = (version) => {
  return `![version](https://img.shields.io/badge/version-${version}-blue)`;
}

const version = () => {
  return versionBadge(packageJson.version);
}

const readme = path.join(__dirname, '../library', 'README.md');
const readmeData = fs.readFileSync(readme, 'utf8');
const readmeDataNew = readmeData.replace(/!\[version\]\([^\)]*\)/, version());
fs.writeFileSync(readme, readmeDataNew, 'utf8');

const index = path.join(__dirname, '../gorgonjs.dev/src/pages', 'index.astro');
const indexData = fs.readFileSync(index, 'utf8');
const indexDataNew = indexData.replace(/Version [^<]*/, `Version ${packageJson.version}`);
fs.writeFileSync(index, indexDataNew, 'utf8');

