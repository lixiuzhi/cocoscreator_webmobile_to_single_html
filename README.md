# 转换cocos creator发布的web mobile项目为单页面文件   
## 说明
Cocos Creator版本 v3.4.1   
禁用 `MD5 Cache` 在 `Project > Build...`   
## 使用   
安装依赖   
```
npm install   
```
将发布后的web-mobile项目拷贝到src/web-mobile   
执行 
```
npm run build
```
## 输出   
dist目录下的index.html   