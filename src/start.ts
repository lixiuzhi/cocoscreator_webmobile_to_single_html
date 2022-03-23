import * as fs from "fs";
import * as path from "path";
import * as uglify from "uglify-js";
import CleanCSS = require("clean-css");
import { log } from "console";

export namespace Tool {
  const C = {
    BASE_PATH: "src/web-mobile", // web-mobile包基础路径
    RES_PATH: "src/web-mobile/assets", // web-mobile包下的res路径
    CC_JS_PATH: "src/web-mobile/cocos-js/cc.js",
    OUTPUT_JS_PATH: "src/dist/cc.js",
    SETTINGJSON_PATH: "src/web-mobile/src/settings.json",
    OUTPUT_LOADSETTINGJSON_JS: "src/dist/load-setting-override.js",
    OUTPUT_RES_JS: "src/dist/res.js", // 输出文件res.js
    OUTPUT_INDEX_HTML: "src/dist/index.html", // 输出文件index.html的路径
    INPUT_HTML_FILE: "src/web-mobile/index.html",
    INPUT_CSS_FILES: ["src/web-mobile/style.css"],
    INPUT_JS_FILES: [
      "src/web-mobile/vconsole.min.js",
      "src/web-mobile/src/polyfills.bundle.js",
      "src/web-mobile/src/assets/script/libs/lz-string.min.js",
      "src/web-mobile/src/system.bundle.js",
      "src/dist/res.js",
      "src/dist/cc.js",
      "src/web-mobile/src/chunks/bundle.js",
      "src/add-or-replace-js/override-loader.js",
      "src/dist/load-setting-override.js",
      "src/add-or-replace-js/application.js",
      "src/add-or-replace-js/index.js",
    ],
  };

  function get_base64_file_content(filepath: string): string {
    let file = fs.readFileSync(filepath);
    return "application/octet-stream---" + file.toString("base64");
  }

  function get_file_content(filepath: string): string {
    if (fs.existsSync(filepath)) {
      let file = fs.readFileSync(filepath);
      return file.toString();
    }
    return "";
  }

  function get_all_child_file(filepath: string): string[] {
    let children = [filepath];
    for (;;) {
      // 如果都是file类型的,则跳出循环
      if (children.every((v) => fs.statSync(v).isFile())) {
        break;
      }
      // 如果至少有1个directroy类型,则删除这一项,并加入其子项
      children.forEach((child, i) => {
        if (fs.statSync(child).isDirectory()) {
          delete children[i];
          let child_children = fs
            .readdirSync(child)
            .map((v) => `${child}/${v}`);
          children.push(...child_children);
        }
      });
    }
    return children;
  }

  function write_loadsettingjs() {
    // 读取并写入到一个对象中
    var data = get_file_content(C.SETTINGJSON_PATH);
    // 写入文件
    fs.writeFileSync(
      C.OUTPUT_LOADSETTINGJSON_JS,
      `  
            function overrideLoadSettingsJson(cc)
            {
            return new Promise(function (resolve, reject)
            {
            window._CCSettings = ${data};
            window._CCSettings.server = '';
            resolve();
            });
        }`
    );
  }

  function write_resjs() {
    // 读取并写入到一个对象中
    let res_object = {};
    get_all_child_file(C.RES_PATH).forEach((filePath) => {
      // 注意,存储时删除BASE_PATH前置
      let store_path = filePath.replace(new RegExp(`^${C.BASE_PATH}/`), "");
      res_object[store_path] = get_base64_file_content(filePath);
    });
    // 写入文件
    fs.writeFileSync(
      C.OUTPUT_RES_JS,
      `window.res=${JSON.stringify(res_object)}`
    );
  }

  function modify_ccjs() {
    var data = get_file_content(C.CC_JS_PATH);
    data = data.replace(`System.register([]`, `System.register('cc',[]`);

    var reg1 =
      /.loadNative[\s]{0,5}=[\s]{0,5}function[\s\S]{1,100}return new Promise[\s\S]{0,10}function[\s\S]{1,100}.getCache[\s\S]{1,250}XMLHttpRequest[\s\S]{1,40}"load audio failed:[\s\S]{1,100}responseType[\s\S]{1,5}arraybuffer[\s\S]{1,170}decodeAudioData[\s\S]{1,110}.addCache[\s\S]{1,330}.onerror[\s\S]{1,150}.ontimeout[\s\S]{1,150}.onabort[\s\S]{1,150}.send\(null\)\}\)\)\}/;
    var results = data.match(new RegExp(reg1)); 
    var getCacheFun = results[0].match(new RegExp(/=[\s\S]{1,10}.getCache/))[0].replace("=","");
    console.log(getCacheFun)
    var retainCacheFun =results[0].match(new RegExp(/return[\s\S]{1,10}.retainCache/))[0].replace("return","");
    console.log(retainCacheFun)
    var decodeAudioDataFun = results[0].match(new RegExp(/\?[\s\S]{1,10}.decodeAudioData/))[0].replace("?","");
    console.log(decodeAudioDataFun)
    var addCacheFun = results[0].match(new RegExp(/\{[\s\S]{1,10}.addCache/))[0].replace("{","").replace("}","");
    console.log(addCacheFun)
    data = data.replace(
      results[0],
      `.loadNative = function (a) { return new Promise((function (t, n) { 
                    var i = ${getCacheFun}(a);
                    if (i) return ${retainCacheFun}(a), void t(i); 
                                    externDownloadArrayBuffer(a,function(data){
                                        ${decodeAudioDataFun}(data).then((function (n) {
                                            ${addCacheFun}(a, n), t(n)
                                        })).catch((function () {}))
                                    }) 
                                }))
                            }`
    );
    // 写入文件
    fs.writeFileSync("src/dist/cc.js", data);
  }

  function get_html_code_by_js_file(js_filepath: string): string {
    let js = get_file_content(js_filepath);
    let min_js = js; // uglify.minify(js).code
    return `<script type="text/javascript">${min_js}</script>`;
  }

  function get_html_code_by_css_file(css_filepath: string): string {
    let css = get_file_content(css_filepath);
    let min_css = new CleanCSS().minify(css).styles;
    return `<style>${min_css}</style>`;
  }

  export function do_task() {
    console.time("写入res.js");
    write_resjs();
    console.timeEnd("写入res.js");

    modify_ccjs();

    console.time("写入load-setting-override.js");
    write_loadsettingjs();
    console.timeEnd("写入load-setting-override.js");

    console.time("清理html");
    let html = get_file_content(C.INPUT_HTML_FILE);
    html = html.replace(/<link rel="stylesheet".*\/>/gs, "");
    html = html.replace(/<script.*<\/script>/gs, "");
    console.timeEnd("清理html");

    console.log("写入所有css文件");
    C.INPUT_CSS_FILES.forEach((v) => {
      console.time(`---${path.basename(v)}`);
      html = html.replace(
        /<\/head>/,
        `${get_html_code_by_css_file(v)}\n</head>`
      );
      console.timeEnd(`---${path.basename(v)}`);
    });

    console.log("写入所有js到html");
    C.INPUT_JS_FILES.forEach((v) => {
      console.time(`---${path.basename(v)}`);
      html = html.replace(
        "</body>",
        () => `${get_html_code_by_js_file(v)}\n</body>`
      );
      console.timeEnd(`---${path.basename(v)}`);
    });

    console.time("输出html文件");
    fs.writeFileSync(C.OUTPUT_INDEX_HTML, html);
    console.timeEnd("输出html文件");
  }
}

Tool.do_task();
