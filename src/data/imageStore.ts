import { promises as fs } from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';
import type {
	ImageModule,
	Collection,
	GalleryData,
	GalleryImage,
	Image,
} from './gallerySchema.ts';

/**
 * Error class for image-related errors
 */
export class ImageStoreError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ImageStoreError';
	}
}

/**
 * Import all images from /src directory
 */
const imageModules = import.meta.glob('/src/**/*.{jpg,jpeg,png,gif}', {
	eager: true,
});

const collectionsPath = 'src/gallery/collections.yaml';
const galleryDirectory = 'src/gallery';

export const featuredCollectionId = 'featured';
const builtInCollections = [featuredCollectionId];

/**
 * 获取已注册的所有集合
 * @returns {Promise<Collection[]>} 集合列表
 */
export const getCollections = async (): Promise<Collection[]> => {
	try {
		const collectionsYamlPath = path.resolve(process.cwd(), collectionsPath);
		const content = await fs.readFile(collectionsYamlPath, 'utf8');
		const collections = yaml.load(content) as { collections: Collection[] };
		return collections.collections;
	} catch (error) {
		throw new ImageStoreError(
			`Failed to load collections: ${getErrorMsgFrom(error)}`
		);
	}
};

/**
 * 获取所有图片
 * @returns {Promise<Image[]>} 所有图片
 */
export const getImages = async (): Promise<Image[]> => {
	try {
		// 获取所有集合
		const collections = await getCollections();
		const collectionsData = await Promise.all(
			collections.map(async (collection) => {
				return {
					collection,
					images: await getImagesFromCollection(collection.id),
				};
			})
		);

		// 合并所有集合的图片
		return collectionsData.flatMap((data) => data.images);
	} catch (error) {
		throw new ImageStoreError(`Failed to load images: ${getErrorMsgFrom(error)}`);
	}
};

/**
 * 获取特定集合的图片
 * @param {string} collectionId - 集合ID
 * @returns {Promise<Image[]>} 该集合中的图片
 */
export const getImagesFromCollection = async (
	collectionId: string
): Promise<Image[]> => {
	try {
		// 确定集合的YAML文件路径
		const collectionYamlPath = path.resolve(
			process.cwd(),
			`${galleryDirectory}/${collectionId}/collection.yaml`
		);
		
		// 读取YAML文件
		const content = await fs.readFile(collectionYamlPath, 'utf8');
		const galleryData = yaml.load(content) as GalleryData;
		
		// 验证数据
		validateGalleryData(galleryData, collectionId);
		
		// 处理图片
		return processImages(galleryData.images, collectionId);
	} catch (error) {
		throw new ImageStoreError(
			`Failed to load images from collection ${collectionId}: ${getErrorMsgFrom(error)}`
		);
	}
};

/**
 * 根据集合ID筛选图片
 * @param {string} collectionId - 集合ID
 * @returns {Promise<Image[]>} 该集合中的图片
 */
export const getImagesByCollection = async (
	collectionId: string
): Promise<Image[]> => {
	if (collectionId === featuredCollectionId) {
		// 如果是featured集合，需要从所有集合中筛选
		const allImages = await getImages();
		return allImages.filter((image) => image.collections.includes(collectionId));
	} else {
		// 否则直接从特定集合加载
		return getImagesFromCollection(collectionId);
	}
};

/**
 * 处理图片
 * @param {GalleryImage[]} images - 图片数据
 * @param {string} collectionId - 集合ID
 * @returns {Image[]} 处理后的图片数据
 */
const processImages = (
	images: GalleryImage[],
	collectionId: string
): Image[] => {
	return images.reduce<Image[]>((acc, imageEntry) => {
		// 构建图片路径，例如: /src/gallery/beijing/images/photo.jpg
		const imagePath = path.join(
			'/',
			galleryDirectory,
			collectionId,
			'images',
			imageEntry.path
		);
		
		try {
			acc.push(createImageDataFor(imagePath, imageEntry, collectionId));
		} catch (error) {
			console.warn(`[WARN] ${getErrorMsgFrom(error)}`);
		}
		
		return acc;
	}, []);
};

/**
 * 创建图片数据
 * @param {string} imagePath - 图片路径
 * @param {GalleryImage} img - 图片元数据
 * @param {string} defaultCollection - 默认集合
 * @returns {Image} 图片数据
 */
const createImageDataFor = (
	imagePath: string, 
	img: GalleryImage, 
	defaultCollection: string
): Image => {
	const imageModule = imageModules[imagePath] as ImageModule | undefined;

	if (!imageModule) {
		throw new ImageStoreError(`Image not found: ${imagePath}`);
	}

	// 确保图片至少属于其默认集合
	const collections = img.meta.collections || [];
	if (!collections.includes(defaultCollection)) {
		collections.push(defaultCollection);
	}

	return {
		src: imageModule.default,
		title: img.meta.title,
		description: img.meta.description,
		collections: collections,
	};
};

/**
 * 验证数据
 * @param {GalleryData} gallery - 相册数据
 * @param {string} collectionId - 集合ID
 */
function validateGalleryData(gallery: GalleryData, collectionId: string) {
	const validCollections = [collectionId, ...builtInCollections];
	
	for (const image of gallery.images) {
		if (!image.meta.collections) {
			image.meta.collections = [collectionId];
			continue;
		}

		const invalidCollections = image.meta.collections.filter(
			(col) => !validCollections.includes(col)
		);
		
		if (invalidCollections.length > 0) {
			console.warn(
				`[WARN] Invalid collection(s) [${invalidCollections.join(', ')}] referenced in image: ${image.path}`
			);
			
			// 移除无效的集合引用
			image.meta.collections = image.meta.collections.filter(
				(col) => validCollections.includes(col)
			);
			
			// 确保至少属于默认集合
			if (!image.meta.collections.includes(collectionId)) {
				image.meta.collections.push(collectionId);
			}
		}
	}
}

function getErrorMsgFrom(error: unknown) {
	return error instanceof Error ? error.message : 'Unknown error';
}
