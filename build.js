const { PerformanceObserver, performance } = require('node:perf_hooks');
const fs = require("fs");
const { version } = require("process");
const beautify = require('beautify');

const red = '\x1b[0;31m';
const green = '\x1b[0;32m';
const clear = '\x1b[0m';

const enter = () => {
  if (process.argv.length <= 2) {
    console.log(red + "Parameters undefined!" + clear);
    return;
  }
  for (let i = 2; i < process.argv.length; i++) {
    switch (process.argv[i]) {
      case "-release":
        buildRelease("release");
        break;
      case "-pre-release":
        preRelease("pre-release");
        break;
      case "-dev":
        buildDev("dev");
        break;
    }
  }
  return;
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
  console.log(green + version + clear);

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
        manifest.version = build.version;
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

const buildRelease = async (version = "release") => {
  const timeStart = performance.now();
  console.log(green + "Build release." + clear);

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
    manifest = result.manifest; ignore = result.ignore;
    ignore.push("extension/manifest.json")
  });
  let zip = new JSZip();
  readFiles("extension/").forEach((file) => {
    for (let i = 0; i < ignore.length; i++) {
      if (file == ignore[i]) {
        console.log("ignore", ignore[i]);
        return false;
      }
    }
    const fileData = fs.readFileSync(file);
    file = file.replace("extension/", "");
    zip.file(file, fileData);
  });
  zip.file("manifest.json", beautify(JSON.stringify(manifest), { format: 'json' }));
  zip.file('Readme.txt', fs.readFileSync("Readme.txt"))
  const zipName = 'Yandex Music Control ' + manifest.version + ".zip";
  zip.generateNodeStream({
    type: 'nodebuffer', compression: "DEFLATE",
    compressionOptions: {
      level: 6
    },
    streamFiles: true
  }).pipe(fs.createWriteStream(zipName))
    .on('finish', function () {
      console.log(zipName + " written.");
      console.log(green + version + " built in " + (performance.now() - timeStart).toFixed(3) + clear);

    });
}

const buildDev = () => {
  console.log(green + "Start build -dev." + clear)
}

enter();