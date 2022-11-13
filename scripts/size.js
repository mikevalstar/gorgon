// In the ../library folder run the command pnpm build
// The build will be generated in the dist folder
// then read the dist folder and create a string with a sheilds.io badge for size
// the size shoudl be based on only the .js files in the dist folder and sub folders
// and add it to the README.md file in the ../library folder

const fs = require('fs');
const path = require('path');

const distFolder = path.join(__dirname, '../library', 'dist');
const distProviderFolder = path.join(__dirname, '../library', 'dist', 'provider');

const sizeBadge = (size) => {
  let sizeColor = 'red';
  if (size < 100000) {
    sizeColor = 'orange';
  }
  if (size < 50000) {
    sizeColor = 'yellow';
  }
  if (size < 25000) {
    sizeColor = 'green';
  }
  if (size < 15000) {
    sizeColor = 'brightgreen';
  }

  //size in kb to 2 decimals
  const sizeKB = (size / 1000).toFixed(2);

  return `![size](https://img.shields.io/badge/size-${sizeKB}KB-${sizeColor})`;
}

const size = () => {
  if (fs.existsSync(distFolder)) {
    const files = fs.readdirSync(distFolder, { withFileTypes: true });
    let size = 0;
    files.forEach(file => {
      if (file.isFile() && file.name.endsWith('.js')) {
        size += fs.statSync(path.join(distFolder, file.name)).size;
      }
    });
    const filesProvider = fs.readdirSync(distProviderFolder, { withFileTypes: true });
    filesProvider.forEach(file => {
      if (file.isFile() && file.name.endsWith('.js')) {
        size += fs.statSync(path.join(distProviderFolder, file.name)).size;
      }
    });
    return sizeBadge(size);
  }
  return sizeBadge(0);
}

const readme = path.join(__dirname, '../library', 'README.md');
const readmeData = fs.readFileSync(readme, 'utf8');
const readmeDataNew = readmeData.replace(/!\[size\]\([^\)]*\)/, size());
fs.writeFileSync(readme, readmeDataNew, 'utf8');
