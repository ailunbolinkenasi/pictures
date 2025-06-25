import type { ImageMetadata } from 'astro';

/**
 * 集合YAML文件的结构
 */
export interface GalleryData {
	images: GalleryImage[];
}

/**
 * 集合
 */
export interface Collection {
	id: string;
	name: string;
}

/**
 * YAML中的图片定义
 */
export interface GalleryImage {
	path: string;
	meta: {
		title: string;
		description: string;
		collections?: string[];
	};
}

/**
 * 处理后的图片数据
 */
export interface Image {
	src: ImageMetadata;
	title: string;
	description: string;
	collections: string[];
}

/**
 * 图片模块
 */
export interface ImageModule {
	default: ImageMetadata;
}
