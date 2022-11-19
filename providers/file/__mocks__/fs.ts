import { createFsFromVolume, Volume } from "memfs"

// helpful stackoverflow: https://stackoverflow.com/questions/72860426/exporting-object-keys-individually

const cacheFolder = "/cacheFolder";
const files = {
  '/otherFolder/test.txt': 'test',
  '/cacheFolder/test.txt': 'test', // created so teh folder exists
};

const volume = Volume.fromJSON(files, cacheFolder);

const fs = createFsFromVolume(volume);

export default fs;
