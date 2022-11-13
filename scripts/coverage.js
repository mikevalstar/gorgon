// In the ../library folder run the command pnpm run coverage to generate the coverage report
// The report will be generated in the ../coverage folder
// then read the clover.xml file in the ../coverage folder
// and from the results create a string with a sheilds.io badge for coverage
// and add it to the README.md file in the ../library folder
// Github copilot wrote this file - scary!

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const coverageFolder = path.join(__dirname, '../library', 'coverage');
const coverageFile = path.join(coverageFolder, 'clover.xml');

const coverageBadge = (coverage) => {
  let coverageColor = 'red';
  if (coverage > 50) {
    coverageColor = 'orange';
  }
  if (coverage > 65) {
    coverageColor = 'yellow';
  }
  if (coverage > 85) {
    coverageColor = 'green';
  }
  if (coverage > 95) {
    coverageColor = 'brightgreen';
  }

  return `![coverage](https://img.shields.io/badge/coverage-${coverage}%25-${coverageColor})`;
}

const coverage = () => {
  if (fs.existsSync(coverageFolder)) {
    execSync('pnpm run coverage', { cwd: path.join(__dirname, '../library') });
  }
  if (fs.existsSync(coverageFile)) {
    const data = fs.readFileSync(coverageFile, 'utf8');
    const coverage = data.match(/<metrics.*?elements="(\d+)".*?coveredelements="(\d+)".*?>/)[2];
    const total = data.match(/<metrics.*?elements="(\d+)".*?coveredelements="(\d+)".*?>/)[1];
    const percent = Math.round(coverage / total * 100);
    return coverageBadge(percent);
  }
  return coverageBadge(0);
}

const readme = path.join(__dirname, '../library', 'README.md');
const readmeData = fs.readFileSync(readme, 'utf8');
const readmeDataNew = readmeData.replace(/!\[coverage\]\([^\)]*\)/, coverage());
fs.writeFileSync(readme, readmeDataNew, 'utf8');

