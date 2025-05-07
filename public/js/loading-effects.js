document.addEventListener('DOMContentLoaded', () => {
  // 查找所有图片并监听加载状态
  const images = document.querySelectorAll('.masonry-card-image');
  
  images.forEach(img => {
    // 创建观察器
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const dataSrc = img.getAttribute('data-src');
          if (dataSrc && img.getAttribute('src') !== dataSrc) {
            // 预加载图片
            const tempImg = new Image();
            tempImg.onload = () => {
              // 图片加载完成，切换src
              img.setAttribute('src', dataSrc);
              const loadingOverlay = img.closest('.masonry-card-media').querySelector('.loading-overlay');
              if (loadingOverlay) {
                // 淡出加载动画
                loadingOverlay.style.opacity = 0;
                setTimeout(() => {
                  loadingOverlay.style.display = 'none';
                }, 300);
              }
              img.classList.add('loaded');
            };
            tempImg.src = dataSrc;
          }
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px'
    });
    
    observer.observe(img);
  });
  
  // 为页面添加微妙的加载转场效果
  document.body.classList.add('content-loaded');
}); 