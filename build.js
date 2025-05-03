const { performance } = require('node:perf_hooks');
const fs = require("fs");
const beautify = require('beautify');

const red = '\x1b[0;31m';
const green = '\x1b[0;32m';
const clear = '\x1b[0m';

const enter = async () => {
  if (process.argv.length <= 2) {
    enterVersion();    
    return;
  }
  selectVersion(process.argv[2].slice(1));
  return;
}

const enterVersion = function () {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Enter one of the build versions: "dev", "pre-release", "release".\nversion:', version => {
    selectVersion(version)
    readline.close();
  });
}

const selectVersion = async function (version) {
  switch (version) {
    case "release":
      await buildRelease("release");
      await buildRelease('release', "edge");
      break;
    case "pre-release":
      preRelease("pre-release");
      break;
    case "dev":
      buildDev("dev");
      break;
    default:
      console.log(red + "Incorrect build version!" + clear);
      break;
  }
}

const readJson = async (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, jsonString) => {
      if (err) {
        console.log("File read failed:", err);
        reject(err);
      }
      resolve(JSON.parse(jsonString));
    });
  });
}

const createManifest = async (version = "release") => {
  const merge = (target, source) => {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object) {
        Object.defineProperties(source[key],
          Object.getOwnPropertyDescriptors(merge(target[key], source[key])));
      }
    }
    Object.defineProperties(target || {}, Object.getOwnPropertyDescriptors(source))
    return target;
  }

  return new Promise((resolve, reject) => {
    readJson("./extension/manifest.json").then((manifest) => {
      readJson("./build.json").then(build => {
        const ignore = build.ignore;
        delete build.ignore;
        resolve({ manifest: merge(manifest, build[version]), ignore });
      });
    });
  });
}

const preRelease = async (version = "pre-release") => {
  const timeStart = performance.now();
  console.log(green + "Build pre-relase." + clear);
  const cpPath = "/home/User/Documents/YandexMusic";

  const copy = (ignore = []) => {
    fs.cp('./extension', cpPath, {
      recursive: true,
      filter(src, dest) {
        for (let i = 0; i < ignore.length; i++) {
          if (src == ignore[i]) {
            console.log("ignore", src);
            return false;
          }
        }
        return true;
      },
    }, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  createManifest(version).then(result => {
    let { manifest, ignore } = result;
    ignore = ignore.filter(value => {
      return value != "extension/img/icon-pre-release.png";
    });
    ignore.push('extension/manifest.json');
    copy(ignore);
    fs.writeFile(cpPath + "/manifest.json", beautify(JSON.stringify(manifest), { format: "json" }), err => {
      if (err) {
        console.error(err);
      }
      console.log("copied successfully");
      console.log(green + version + " built in " + (performance.now() - timeStart).toFixed(3) + clear);
    });
  });
}

const buildRelease = async (version = "release", browserName = "chrome") => {
  const timeStart = performance.now();
  console.log(green + `Build ${browserName} release.` + clear);

  const JSZip = require("jszip");
  const fs = require('fs');
  const path = require('path');

  const readFiles = (dir) => {
    const files = fs.readdirSync(dir);
    let fileList = [];

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        fileList = fileList.concat(readFiles(filePath));
      } else {
        fileList.push(filePath);
      }
    });
    return fileList;
  }

  let manifest, ignore;

  await createManifest(version).then(result => {
    manifest = result.manifest;
    ignore = result.ignore;
    ignore.push("extension/manifest.json")
  });
  let whatNewJson;
  if (browserName != 'chrome') {
    browserName = browserName.toLowerCase();
    whatNewJson = await createWhatNew(browserName);
    ignore.push("extension/data/what-new.json");
  }
  let zip = new JSZip();
  readFiles("extension/").forEach((file) => {
    for (let i = 0; i < ignore.length; i++) {
      if (file == ignore[i] || file.startsWith(ignore[i])) {
        console.log("ignore", ignore[i]);
        return false;
      }
    }
    const fileData = fs.readFileSync(file);
    file = file.replace("extension/", "");
    zip.file(file, fileData);
  });
  if (whatNewJson) {
    zip.file("data/what-new.json", beautify(JSON.stringify(whatNewJson), { format: 'json' }));
  }
  zip.file("manifest.json", beautify(JSON.stringify(manifest), { format: 'json' }));
  zip.file('Readme.txt', fs.readFileSync("Readme.txt"));

  if (browserName != 'chrome') {
    browserName = browserName.replace(browserName[0], " " + browserName[0].toUpperCase());
  } else {
    browserName = "";
  }
  const zipName = `Yandex Music Control ${manifest.version}${browserName}.zip`;

  await new Promise((resolve, reject) => {
    zip.generateNodeStream({
      type: 'nodebuffer', compression: "DEFLATE",
      compressionOptions: {
        level: 6
      },
      streamFiles: true
    }).pipe(fs.createWriteStream(zipName))
      .on('finish', function () {resolve('zip created') });
  });
  console.log(zipName + " created.");
  console.log(green + version  + " built in " + (performance.now() - timeStart).toFixed(3) + clear);

}

const buildDev = () => {
  console.log(green + "Start build -dev." + clear)
}

const createWhatNew = async function (browserName) {
  let path;
  switch (browserName) {
    case 'edge':
      path = "./extension/data/what-new Edge.json";
      break;
  }

  let newWhatNew = await readJson(path);
  const whatNew = await readJson("./extension/data/what-new.json");
  newWhatNew = newWhatNew.versions;
  const whatNewVer = whatNew.versions;

  const math = [];
  for (ver of newWhatNew) {
    for (let i = 0; i < whatNewVer.length; i++) {
      if (ver[0] == whatNewVer[i][0]) {
        math.push(i);
      }
    }
  }

  math.forEach((version, index) => {
    whatNew.versions[version] = newWhatNew[index];
  });
  return whatNew;
}

enter();
