/**
 * 自定义PhotoSwipe 5实现
 * 基于PhotoSwipe 5.4.4版本
 * 提供更好的性能、触摸支持和响应式设计
 */

document.addEventListener('DOMContentLoaded', function() {
  // 导入PhotoSwipe模块
  import('/themes/gallery/assets/js/photoswipe/photoswipe.esm.js')
    .then((PhotoSwipeModule) => {
      const PhotoSwipe = PhotoSwipeModule.default;
      
      // 导入PhotoSwipe Lightbox模块
      return import('/themes/gallery/assets/js/photoswipe/photoswipe-lightbox.esm.js')
        .then((LightboxModule) => {
          const PhotoSwipeLightbox = LightboxModule.default;
          
          // 导入动态标题插件
          return import('/themes/gallery/assets/js/photoswipe/photoswipe-dynamic-caption-plugin.esm.min.js')
            .then((CaptionModule) => {
              const PhotoSwipeDynamicCaption = CaptionModule.default;
              initPhotoSwipe(PhotoSwipe, PhotoSwipeLightbox, PhotoSwipeDynamicCaption);
            });
        });
    })
    .catch(error => console.error('PhotoSwipe加载失败:', error));
});

function initPhotoSwipe(PhotoSwipe, PhotoSwipeLightbox, PhotoSwipeDynamicCaption) {
  const gallery = document.getElementById("gallery");
  
  if (!gallery) return;
  
  // 创建增强版的PhotoSwipe Lightbox实例
  const lightbox = new PhotoSwipeLightbox({
    // 基本设置
    gallery,
    children: '.gallery-item',
    pswpModule: PhotoSwipe,
    
    // 增强的UI体验
    showHideAnimationType: 'zoom',  // 更平滑的动画
    bgOpacity: 0.85,                // 稍微透明的背景
    imageClickAction: 'zoom',       // 点击图片时放大而不是关闭
    tapAction: 'toggle-controls',   // 点击切换控制界面
    
    // 手势设置
    allowPanToNext: true,           // 允许滑动切换到下一张
    allowMouseDrag: true,           // 允许鼠标拖动
    
    // 响应式设置
    paddingFn: (viewportSize) => {
      return viewportSize.x < 700
        ? { top: 0, bottom: 0, left: 0, right: 0 }
        : { top: 30, bottom: 30, left: 30, right: 30 };
    },
    
    // 多语言支持
    closeTitle: '关闭',
    zoomTitle: '缩放',
    arrowPrevTitle: '上一张',
    arrowNextTitle: '下一张',
    errorMsg: '图片无法加载'
  });
  
  // 添加动态标题插件
  const captionPlugin = new PhotoSwipeDynamicCaption(lightbox, {
    captionContent: '.pswp-caption-content',
    type: 'auto',                      // 自动选择最佳标题位置
    mobileCaptionOverlapRatio: 0.3,    // 移动设备上标题覆盖比例
    mobileLayoutBreakpoint: 600,       // 移动布局断点
    verticallyCenterImage: true        // 垂直居中图片
  });
  
  // 注册下载按钮
  lightbox.on('uiRegister', () => {
    lightbox.pswp.ui.registerElement({
      name: 'download-button',
      order: 8,
      isButton: true,
      tagName: 'a',
      html: {
        isCustomSVG: true,
        inner: '<path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" id="pswp__icn-download"/>',
        outlineID: 'pswp__icn-download'
      },
      onInit: (el, pswp) => {
        el.setAttribute('download', '');
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
        el.setAttribute('title', '下载');
        
        // 更新下载链接
        pswp.on('change', () => {
          el.href = pswp.currSlide.data.src;
        });
      }
    });
  });
  
  // 添加缩放指示器
  lightbox.on('uiRegister', () => {
    lightbox.pswp.ui.registerElement({
      name: 'zoom-indicator',
      className: 'pswp__zoom-indicator',
      appendTo: 'wrapper',
      onInit: (el, pswp) => {
        let zoomLevel = document.createElement('div');
        zoomLevel.className = 'pswp__zoom-level';
        el.appendChild(zoomLevel);
        
        // 更新缩放级别显示
        pswp.on('zoomPanUpdate', ({ slide }) => {
          if (slide === pswp.currSlide) {
            const zoom = Math.round(slide.currZoomLevel * 100);
            zoomLevel.innerHTML = `${zoom}%`;
            
            // 显示缩放指示器，然后淡出
            el.classList.add('pswp__zoom-indicator--visible');
            clearTimeout(el.timeout);
            el.timeout = setTimeout(() => {
              el.classList.remove('pswp__zoom-indicator--visible');
            }, 1500);
          }
        });
      }
    });
  });
  
  // 添加图片计数器
  lightbox.on('uiRegister', () => {
    lightbox.pswp.ui.registerElement({
      name: 'counter',
      order: 5,
      onInit: (el, pswp) => {
        pswp.on('change', () => {
          el.innerHTML = `${pswp.currIndex + 1} / ${pswp.options.dataSource.length}`;
        });
      }
    });
  });
  
  // 添加键盘导航增强
  lightbox.on('bindEvents', () => {
    lightbox.pswp.events.add(document, 'keydown', (e) => {
      // 空格键切换缩放
      if (e.code === 'Space') {
        const slide = lightbox.pswp.currSlide;
        if (slide.currZoomLevel !== slide.zoomLevels.initial) {
          slide.zoomTo(slide.zoomLevels.initial, { x: slide.viewportSize.x/2, y: slide.viewportSize.y/2 }, 300);
        } else {
          slide.zoomTo(slide.zoomLevels.secondary, { x: slide.viewportSize.x/2, y: slide.viewportSize.y/2 }, 300);
        }
        e.preventDefault();
      }
      
      // Home键跳到第一张
      if (e.code === 'Home') {
        lightbox.pswp.goTo(0);
        e.preventDefault();
      }
      
      // End键跳到最后一张
      if (e.code === 'End') {
        lightbox.pswp.goTo(lightbox.pswp.options.dataSource.length - 1);
        e.preventDefault();
      }
    });
  });
  
  // 添加双击缩放增强
  lightbox.on('itemData', (e) => {
    // 确保图片有正确的尺寸信息
    if (!e.itemData.width || !e.itemData.height) {
      const img = new Image();
      img.src = e.itemData.src;
      img.onload = () => {
        e.itemData.width = img.width;
        e.itemData.height = img.height;
      };
    }
  });
  
  // 添加触摸手势增强
  lightbox.on('init', () => {
    // 双指旋转手势
    let lastAngle = 0;
    let currentRotation = 0;
    
    lightbox.pswp.events.add(lightbox.pswp.element, 'touchstart', (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        ) * 180 / Math.PI;
      }
    });
    
    lightbox.pswp.events.add(lightbox.pswp.element, 'touchmove', (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const angle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        ) * 180 / Math.PI;
        
        const deltaAngle = angle - lastAngle;
        lastAngle = angle;
        currentRotation += deltaAngle;
        
        const slide = lightbox.pswp.currSlide;
        if (slide && slide.content && slide.content.element) {
          slide.content.element.style.transform = 
            `${slide.content.element.style.transform} rotate(${currentRotation}deg)`;
        }
      }
    });
  });
  
  // 初始化PhotoSwipe
  lightbox.init();
}

// 添加自定义样式
const style = document.createElement('style');
style.textContent = `
  .pswp__zoom-indicator {
    position: absolute;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 1;
  }
  
  .pswp__zoom-indicator--visible {
    opacity: 1;
  }
  
  .pswp__counter {
    font-size: 14px;
    color: #fff;
    margin: 0 10px;
  }
  
  /* 增强移动端体验 */
  @media (max-width: 600px) {
    .pswp__top-bar {
      background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%);
    }
    
    .pswp__caption {
      background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%);
    }
  }
`;
document.head.appendChild(style);