import exifr from "exifr";

export interface EXIFData {
  make?: string;
  model?: string;
  lensModel?: string;
  focalLength?: number;
  focalLengthIn35mm?: number;
  aperture?: number;
  shutterSpeed?: number;
  iso?: number;
  exposureTime?: string;
  dateTimeOriginal?: string;
  gps?: {
    latitude?: number;
    longitude?: number;
  };
}

/**
 * 格式化快门速度
 */
function formatShutterSpeed(seconds: number): string {
  if (seconds >= 1) {
    return `${seconds}s`;
  }
  const fraction = 1 / seconds;
  if (fraction > 1 && fraction < 1000) {
    return `1/${Math.round(fraction)}s`;
  }
  return `${seconds}s`;
}

/**
 * 格式化光圈值
 */
function formatAperture(fNumber: number): string {
  return `f/${fNumber.toFixed(1)}`;
}

/**
 * 格式化焦距
 */
function formatFocalLength(
  focalLength: number,
  focalLengthIn35mm?: number,
): string {
  let result = `${focalLength}mm`;
  if (focalLengthIn35mm && focalLengthIn35mm !== focalLength) {
    result += ` (${focalLengthIn35mm}mm 35mm等效)`;
  }
  return result;
}

/**
 * 读取图片的 EXIF 信息
 */
export async function readEXIF(imagePath: string): Promise<EXIFData | null> {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    const exif = await exifr.parse(blob, {
      exif: [
        "Make",
        "Model",
        "LensModel",
        "FocalLength",
        "FocalLengthIn35mmFilm",
        "FNumber",
        "ExposureTime",
        "ISO",
        "DateTimeOriginal",
      ],
      gps: true,
    } as any);

    if (!exif) {
      return null;
    }

    return {
      make: exif.Make,
      model: exif.Model,
      lensModel: exif.LensModel,
      focalLength: exif.FocalLength,
      focalLengthIn35mm: exif.FocalLengthIn35mmFilm,
      aperture: exif.FNumber,
      shutterSpeed: exif.ExposureTime,
      iso: exif.ISO,
      exposureTime: exif.DateTimeOriginal
        ? new Date(exif.DateTimeOriginal).toLocaleString()
        : undefined,
      gps: exif.gps,
    };
  } catch (error) {
    console.warn("读取 EXIF 信息失败:", error);
    return null;
  }
}

/**
 * 格式化 EXIF 数据为显示文本
 */
export function formatEXIF(exif: EXIFData): string[] {
  const result: string[] = [];

  // 相机信息
  if (exif.make || exif.model) {
    const camera = [exif.make, exif.model].filter(Boolean).join(" ");
    result.push(`📷 ${camera}`);
  }

  // 镜头信息
  if (exif.lensModel) {
    result.push(`🔍 ${exif.lensModel}`);
  }

  // 焦距
  if (exif.focalLength) {
    result.push(
      `📏 ${formatFocalLength(exif.focalLength, exif.focalLengthIn35mm)}`,
    );
  }

  // 光圈
  if (exif.aperture) {
    result.push(`🎯 ${formatAperture(exif.aperture)}`);
  }

  // 快门速度
  if (exif.shutterSpeed) {
    result.push(`⏱️ ${formatShutterSpeed(exif.shutterSpeed)}`);
  }

  // ISO
  if (exif.iso) {
    result.push(`🔢 ISO ${exif.iso}`);
  }

  // 拍摄时间
  if (exif.exposureTime) {
    result.push(`📅 ${exif.exposureTime}`);
  }

  // GPS 位置
  if (exif.gps?.latitude && exif.gps?.longitude) {
    result.push(
      `📍 ${exif.gps.latitude.toFixed(6)}, ${exif.gps.longitude.toFixed(6)}`,
    );
  }

  return result;
}
