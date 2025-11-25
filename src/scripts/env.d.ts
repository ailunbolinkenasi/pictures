/// <reference types="astro/client" />

// 声明 exif-parser 模块
declare module "exif-parser";

// 声明全局 Fancybox (如果需要)
declare interface Window {
  Fancybox: any;
}
