const CORE_URL = "https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd/ffmpeg-core.js";
const FFMessageType = {
  LOAD: "LOAD",
  EXEC: "EXEC",
  FFPROBE: "FFPROBE",
  WRITE_FILE: "WRITE_FILE",
  READ_FILE: "READ_FILE",
  DELETE_FILE: "DELETE_FILE",
  RENAME: "RENAME",
  CREATE_DIR: "CREATE_DIR",
  LIST_DIR: "LIST_DIR",
  DELETE_DIR: "DELETE_DIR",
  ERROR: "ERROR",
  DOWNLOAD: "DOWNLOAD",
  PROGRESS: "PROGRESS",
  LOG: "LOG",
  MOUNT: "MOUNT",
  UNMOUNT: "UNMOUNT",
};

const ERROR_UNKNOWN_MESSAGE_TYPE = new Error("unknown message type");
const ERROR_NOT_LOADED = new Error("ffmpeg is not loaded, call `await ffmpeg.load()` first");
const ERROR_IMPORT_FAILURE = new Error("failed to import ffmpeg-core.js");

let ffmpeg;

const load = async ({ coreURL: requestedCoreURL, wasmURL: requestedWasmURL, workerURL: requestedWorkerURL }) => {
  const first = !ffmpeg;
  let coreURL = requestedCoreURL;

  try {
    if (!coreURL) {
      coreURL = CORE_URL;
    }
    importScripts(coreURL);
  } catch {
    if (!coreURL || coreURL === CORE_URL) {
      coreURL = CORE_URL.replace("/umd/", "/esm/");
    }

    self.createFFmpegCore = (await import(coreURL)).default;
    if (!self.createFFmpegCore) {
      throw ERROR_IMPORT_FAILURE;
    }
  }

  const wasmURL = requestedWasmURL ?? coreURL.replace(/\.js$/g, ".wasm");
  const workerURL = requestedWorkerURL ?? coreURL.replace(/\.js$/g, ".worker.js");

  ffmpeg = await self.createFFmpegCore({
    mainScriptUrlOrBlob: `${coreURL}#${btoa(JSON.stringify({ wasmURL, workerURL }))}`,
  });

  ffmpeg.setLogger((data) => self.postMessage({ type: FFMessageType.LOG, data }));
  ffmpeg.setProgress((data) => self.postMessage({ type: FFMessageType.PROGRESS, data }));

  return first;
};

const exec = ({ args, timeout = -1 }) => {
  ffmpeg.setTimeout(timeout);
  ffmpeg.exec(...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
};

const ffprobe = ({ args, timeout = -1 }) => {
  ffmpeg.setTimeout(timeout);
  ffmpeg.ffprobe(...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
};

const writeFile = ({ path, data }) => {
  ffmpeg.FS.writeFile(path, data);
  return true;
};

const readFile = ({ path, encoding }) => ffmpeg.FS.readFile(path, { encoding });

const deleteFile = ({ path }) => {
  ffmpeg.FS.unlink(path);
  return true;
};

const rename = ({ oldPath, newPath }) => {
  ffmpeg.FS.rename(oldPath, newPath);
  return true;
};

const createDir = ({ path }) => {
  ffmpeg.FS.mkdir(path);
  return true;
};

const listDir = ({ path }) => {
  const names = ffmpeg.FS.readdir(path);
  const nodes = [];

  for (const name of names) {
    const stat = ffmpeg.FS.stat(`${path}/${name}`);
    nodes.push({ name, isDir: ffmpeg.FS.isDir(stat.mode) });
  }

  return nodes;
};

const deleteDir = ({ path }) => {
  ffmpeg.FS.rmdir(path);
  return true;
};

const mount = ({ fsType, options, mountPoint }) => {
  const fs = ffmpeg.FS.filesystems[fsType];
  if (!fs) return false;

  ffmpeg.FS.mount(fs, options, mountPoint);
  return true;
};

const unmount = ({ mountPoint }) => {
  ffmpeg.FS.unmount(mountPoint);
  return true;
};

self.onmessage = async ({ data: { id, type, data } }) => {
  const transfers = [];
  let responseData;

  try {
    if (type !== FFMessageType.LOAD && !ffmpeg) {
      throw ERROR_NOT_LOADED;
    }

    switch (type) {
      case FFMessageType.LOAD:
        responseData = await load(data);
        break;
      case FFMessageType.EXEC:
        responseData = exec(data);
        break;
      case FFMessageType.FFPROBE:
        responseData = ffprobe(data);
        break;
      case FFMessageType.WRITE_FILE:
        responseData = writeFile(data);
        break;
      case FFMessageType.READ_FILE:
        responseData = readFile(data);
        break;
      case FFMessageType.DELETE_FILE:
        responseData = deleteFile(data);
        break;
      case FFMessageType.RENAME:
        responseData = rename(data);
        break;
      case FFMessageType.CREATE_DIR:
        responseData = createDir(data);
        break;
      case FFMessageType.LIST_DIR:
        responseData = listDir(data);
        break;
      case FFMessageType.DELETE_DIR:
        responseData = deleteDir(data);
        break;
      case FFMessageType.MOUNT:
        responseData = mount(data);
        break;
      case FFMessageType.UNMOUNT:
        responseData = unmount(data);
        break;
      default:
        throw ERROR_UNKNOWN_MESSAGE_TYPE;
    }
  } catch (error) {
    self.postMessage({
      id,
      type: FFMessageType.ERROR,
      data: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  if (responseData instanceof Uint8Array) {
    transfers.push(responseData.buffer);
  }

  self.postMessage({ id, type, data: responseData }, transfers);
};
