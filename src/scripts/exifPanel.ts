// src/lib/exifPanel.ts
// 确保这个路径正确指向你的工具函数
import { formatEXIF, readEXIF } from "../lib/exif";

// --- 类型定义 ---
type ExifData = Awaited<ReturnType<typeof readEXIF>>;
type FormattedExif = {
  summary: string;
  list: string[];
};

// --- 状态管理 ---
const exifCache = new Map<string, Promise<FormattedExif | null>>();

// --- 核心逻辑 ---
function formatExifData(exif: ExifData): FormattedExif {
  if (!exif) return { summary: "", list: [] };

  const parts: string[] = [];
  const listItems: string[] = [];
  const fmt = {
    aperture: (v: number) => `f/${v.toFixed(1)}`,
    shutter: (v: number) => (v >= 1 ? `${v}s` : `1/${Math.round(1 / v)}s`),
    iso: (v: number) => `ISO ${v}`,
    focal: (v: number) => `${v}mm`,
  };

  // 1. 列表详情
  if (exif.make || exif.model)
    listItems.push(`📷 ${[exif.make, exif.model].filter(Boolean).join(" ")}`);
  if (exif.lensModel) listItems.push(`🔍 ${exif.lensModel}`);

  if (typeof exif.focalLength === "number") {
    let text = fmt.focal(exif.focalLength);
    if (
      typeof exif.focalLengthIn35mm === "number" &&
      exif.focalLengthIn35mm !== exif.focalLength
    ) {
      text += ` (${exif.focalLengthIn35mm}mm 等效)`;
    }
    listItems.push(`📏 ${text}`);
    // Summary
    parts.push(fmt.focal(exif.focalLength));
  }

  if (typeof exif.aperture === "number") {
    listItems.push(`🎯 ${fmt.aperture(exif.aperture)}`);
    parts.push(fmt.aperture(exif.aperture));
  }

  if (typeof exif.shutterSpeed === "number") {
    listItems.push(`⏱️ ${fmt.shutter(exif.shutterSpeed)}`);
    parts.push(fmt.shutter(exif.shutterSpeed));
  }

  if (typeof exif.iso === "number") {
    listItems.push(`🔢 ${fmt.iso(exif.iso)}`);
    parts.push(fmt.iso(exif.iso));
  }

  if (exif.exposureTime)
    listItems.push(`📅 ${new Date(exif.exposureTime).toLocaleString()}`);
  if (exif.gps?.latitude && exif.gps?.longitude) {
    listItems.push(
      `📍 ${exif.gps.latitude.toFixed(6)}, ${exif.gps.longitude.toFixed(6)}`,
    );
  }

  // 2. 摘要排序
  const summaryParts: string[] = [];
  if (typeof exif.focalLength === "number")
    summaryParts.push(fmt.focal(exif.focalLength));
  if (typeof exif.aperture === "number")
    summaryParts.push(fmt.aperture(exif.aperture));
  if (typeof exif.shutterSpeed === "number")
    summaryParts.push(fmt.shutter(exif.shutterSpeed));
  if (typeof exif.iso === "number") summaryParts.push(fmt.iso(exif.iso));

  return {
    summary: summaryParts.join(" · "),
    list: listItems.length ? listItems : exif ? formatEXIF(exif) : [],
  };
}

export function getExifAsync(url: string): Promise<FormattedExif | null> {
  if (!url) return Promise.resolve(null);
  if (exifCache.has(url)) return exifCache.get(url)!;

  const promise = readEXIF(url)
    .then((exif) => formatExifData(exif))
    .catch((err) => {
      console.warn("EXIF读取失败:", url, err);
      return null;
    });

  exifCache.set(url, promise);
  return promise;
}

// --- UI 组件：EXIF 面板 ---
export const ExifPanel = (() => {
  let panel: HTMLElement | null = null;
  let contentEl: HTMLElement | null = null;

  const init = () => {
    if (panel) return;
    panel = document.createElement("div");
    panel.className = "exif-overlay";
    // 阻止面板上的点击冒泡，防止触发 Fancybox 关闭
    panel.onclick = (e) => e.stopPropagation();

    panel.innerHTML = `
      <div class="exif-container">
        <div class="exif-header">
          <h3>照片信息</h3>
          <button class="exif-close-btn" aria-label="关闭">✕</button>
        </div>
        <div class="exif-content"></div>
      </div>
    `;

    const closeBtn = panel.querySelector(".exif-close-btn");
    closeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
    });

    // 点击遮罩层关闭
    panel.addEventListener("click", (e) => {
      if (e.target === panel) close();
    });

    contentEl = panel.querySelector(".exif-content");
    document.body.appendChild(panel);
  };

  const renderLoading = () => {
    if (!contentEl) return;
    contentEl.innerHTML = `
      <div class="exif-loading">
        <div class="loading-spinner"></div>
        <p>正在读取照片信息...</p>
      </div>`;
  };

  const renderData = (data: string[]) => {
    if (!contentEl) return;
    if (data.length) {
      const listHtml = data
        .map((text) => `<div class="exif-item">${text}</div>`)
        .join("");
      contentEl.innerHTML = `<div class="exif-list">${listHtml}</div>`;
    } else {
      contentEl.innerHTML = `
        <div class="exif-empty">
          <p>📷 没有找到照片的 EXIF 信息</p>
          <p class="exif-hint">这张照片可能没有包含详细的元数据。</p>
        </div>`;
    }
  };

  const open = async (url: string) => {
    init();
    // 使用 requestAnimationFrame 确保 CSS transition 生效
    requestAnimationFrame(() => {
      panel!.classList.add("active");
    });

    renderLoading();

    const [data] = await Promise.all([
      getExifAsync(url),
      new Promise((r) => setTimeout(r, 300)), // 最小 loading 时间，防止闪烁
    ]);

    renderData(data?.list || []);
  };

  const close = () => {
    if (panel) {
      panel.classList.remove("active");
      // 等待动画结束后移除 DOM，或者保持 DOM 只隐藏
      setTimeout(() => {
        if (panel && !panel.classList.contains("active")) {
          // 可选：panel.remove();
          // 目前仅仅是 remove class active
        }
      }, 300);
    }
  };

  return { open, close };
})();

// --- UI 组件：Tooltip ---
const ExifTooltip = (() => {
  let tip: HTMLElement | null = null;

  const create = () => {
    if (tip) return tip;
    tip = document.createElement("div");
    tip.className = "exif-tooltip";
    document.body.appendChild(tip);
    return tip;
  };

  const update = (list: string[]) => {
    const el = create();
    // 只显示前 5 项，避免 Tooltip 过长
    const showList = list.slice(0, 5);
    el.innerHTML = `<ul class="exif-tooltip-list">${showList.map((t) => `<li>${t}</li>`).join("")}</ul>`;
  };

  const move = (x: number, y: number) => {
    if (!tip) return;
    const offsetX = 20;
    const offsetY = 20;

    // 简单的边界处理
    let left = x + offsetX;
    let top = y + offsetY;

    if (left + 200 > window.innerWidth) left = x - 220;
    if (top + 200 > window.innerHeight) top = y - 220;

    tip.style.transform = `translate(${left}px, ${top}px)`;
  };

  const show = () => {
    if (tip) tip.style.opacity = "1";
  };
  const hide = () => {
    if (tip) tip.style.opacity = "0";
  };

  return { update, move, show, hide };
})();

// --- 初始化函数 (供 index.astro 调用) ---
export function initGalleryInteractions() {
  const items = document.querySelectorAll(".masonry-item"); // 注意：匹配 Astro 的 class

  items.forEach((item) => {
    const link = item.querySelector("a");
    if (!link) return;
    const url = link.href;

    // 鼠标移入时预加载并显示 Tooltip
    item.addEventListener("mouseenter", async () => {
      const data = await getExifAsync(url);

      if (data?.list.length) {
        ExifTooltip.update(data.list);
        ExifTooltip.show();
      }
    });

    item.addEventListener("mousemove", (e) => {
      ExifTooltip.move((e as MouseEvent).clientX, (e as MouseEvent).clientY);
    });

    item.addEventListener("mouseleave", () => {
      ExifTooltip.hide();
    });
  });
}

// --- Fancybox 配置生成器 ---
export const getFancyboxConfig = () => ({
  Toolbar: {
    display: {
      left: ["infobar"],
      middle: ["thumbs"],
      right: ["exif", "slideshow", "download", "close"], // 添加 'exif'
    },
    items: {
      exif: {
        tpl: `<button class="f-button" title="查看 EXIF (I)" data-fancybox-exif>
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </button>`,
        click: (fancybox: any) => {
          const src = fancybox.Carousel.slides[fancybox.Carousel.page]?.src;
          if (src) ExifPanel.open(src);
        },
      },
    },
  },
  on: {
    "Carousel.change": async (_fancybox: any) => {
      // 切换图片时，可以在这里做一些额外操作，比如更新 URL hash
    },
    close: () => ExifPanel.close(), // 关闭 Fancybox 时同时也关闭面板
  },
});
