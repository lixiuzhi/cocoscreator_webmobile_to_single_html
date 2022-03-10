function getAsset(url) {
  //console.log(url)
  var data = window.res[url].split('---');
  var mine = data[0]
  var base64 = data[1];
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }

  var blob = new Blob([bytes], {
    type: mine
  });
  return {
    url: URL.createObjectURL(blob),
    mine
  };
}

function overrideLoader() {

  var baseName = function (e) {
    var n = e.indexOf("?");
    n > 0 && (e = e.substring(0, n));
    var i = /(\/|\\)([^\/\\]+)$/g.exec(e.replace(/(\/|\\)$/, ""));
    if (!i) return e;
    var r = i[2];
    return t && e.substring(e.length - t.length).toLowerCase() === t.toLowerCase() ? r.substring(0, r.length - t.length) : r
  }

  var downloadFile = cc.assetManager.downloader.downloadFile;
  cc.assetManager.downloader.downloadFile = function (url, options, onProgress, onComplete) {
    var asset = getAsset(url);
    options.xhrMimeType = asset.mine;
    downloadFile(asset.url, options, onProgress, onComplete)
  }

  var downloadDomImage = cc.assetManager.downloader.downloadDomImage;
  cc.assetManager.downloader.downloadDomImage = function (url, options, onComplete) {
    var asset = getAsset(url);
    options.xhrMimeType = asset.mine;
    downloadDomImage(asset.url, options, onComplete)
  }

  var downloadScript = cc.assetManager.downloader.downloadScript;
  cc.assetManager.downloader.downloadScript = function (url, options, onComplete) {
    var asset = getAsset(url);
    options.xhrMimeType = asset.mine;
    downloadScript(asset.url, options, onComplete)
  }

  var downloadImageWrapper = function (url, options, onComplete) {
    if (cc.sys.hasFeature(cc.sys.Feature.IMAGE_BITMAP) && cc.assetManager.allowImageBitmap) {
      options.xhrResponseType = 'blob';
      cc.assetManager.downloader.downloadFile(url, options, options.onFileProgress, onComplete);
    } else {
      cc.assetManager.downloader.downloadDomImage(url, options, onComplete);
    }
  }

  var downloadArrayBufferWrapper = function (url, options, onComplete) {
    options.xhrResponseType = 'arraybuffer';
    cc.assetManager.downloader.downloadFile(url, options, options.onFileProgress, onComplete);
  }

  var downloadTextWrapper = function (url, options, onComplete) {
    options.xhrResponseType = 'text';
    cc.assetManager.downloader.downloadFile(url, options, options.onFileProgress, onComplete);
  }

  var downloadCCONBWrapper = function (url, options, onComplete) {
    downloadArrayBufferWrapper(url, options, (err, arrayBuffer) => {
      if (err) {
        onComplete(err);
        return;
      }
      try {
        const ccon = cc.internal.decodeCCONBinary(new Uint8Array(arrayBuffer));
        onComplete(null, ccon);
      } catch (err) {
        onComplete(err);
      }
    });
  }

  var downloadJsonWrapper = function (url, options, onComplete) {

    options.xhrResponseType = 'json';
    cc.assetManager.downloader.downloadFile(url, options, options.onFileProgress, onComplete)
  }

  var downloadBundleWrapper = function (url, options, onComplete) {
    var bn = baseName(url)
    url = `assets/${bn}`;
    var config = `${url}/config.json`;
    //console.log("bundle........." + config)
    var count = 0;
    var out = ""
    downloadJsonWrapper(config, options, (err, response) => {
      //var error = err;  
      out = response;
      out.base = `${url}/`;
      if (++count === 2) {
        onComplete(err, out);
      }
    })
    var jspath = `${url}/index.js`;
    cc.assetManager.downloader.downloadScript(jspath, options, (err) => {

      if (++count === 2) {
        onComplete(err, out);
      }
    });
  }

  cc.assetManager.downloader.register({
    '.png': downloadImageWrapper,
    '.jpg': downloadImageWrapper,
    '.bmp': downloadImageWrapper,
    '.jpeg': downloadImageWrapper,
    '.gif': downloadImageWrapper,
    '.ico': downloadImageWrapper,
    '.tiff': downloadImageWrapper,
    '.webp': downloadImageWrapper,
    '.image': downloadImageWrapper, 
    '.binary': downloadArrayBufferWrapper,
    '.bin': downloadArrayBufferWrapper,
    '.dbbin': downloadArrayBufferWrapper,
    '.skel': downloadArrayBufferWrapper,
    '.zip': downloadTextWrapper,
    '.cconb': downloadCCONBWrapper,
    '.json':downloadJsonWrapper,
    'bundle': downloadBundleWrapper
  });
}

function externDownloadArrayBuffer(url, onComplete) {
  //console.log("externDownloadArrayBuffer:"+url);
  var data = window.res[url].split('---');
  var base64 = data[1];
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  onComplete(bytes.buffer)
}