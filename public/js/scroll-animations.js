document.addEventListener('DOMContentLoaded', () => {
  // 检查是否支持CSS Scroll-driven Animations
  const supportsScrollTimeline = CSS.supports('animation-timeline: scroll()');
  
  // 如果已支持，则无需JS实现
  if (supportsScrollTimeline) return;
  
  // 否则使用Intersection Observer实现
  const cards = document.querySelectorAll('.masonry-card');
  
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // 当卡片进入视口
      if (entry.isIntersecting) {
        const card = entry.target;
        const image = card.querySelector('.masonry-card-image');
        const title = card.querySelector('.masonry-card-title');
        const meta = card.querySelector('.masonry-card-meta');
        
        // 应用动画类
        card.classList.add('animate-card');
        
        // 添加延迟加载的动画类
        setTimeout(() => {
          image?.classList.add('animate-image');
        }, 100);
        
        setTimeout(() => {
          title?.classList.add('animate-content');
        }, 200);
        
        setTimeout(() => {
          meta?.classList.add('animate-content');
        }, 300);
        
        // 一旦触发动画，不再需要观察
        cardObserver.unobserve(card);
      }
    });
  }, {
    // 设置阈值，当元素30%进入视口时触发
    threshold: 0.3,
    // 提前开始观察，增加滚动流畅度
    rootMargin: '0px 0px 100px 0px'
  });
  
  // 开始观察所有卡片
  cards.forEach(card => {
    cardObserver.observe(card);
  });
  
  // 添加动画效果监听器，处理悬停状态
  document.addEventListener('scroll', () => {
    cards.forEach(card => {
      // 检查卡片是否在视口内
      const rect = card.getBoundingClientRect();
      const isInView = (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom >= 0 &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
        rect.right >= 0
      );
      
      if (isInView) {
        // 计算卡片在视口中的位置 (0-1范围)
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const cardCenter = rect.top + (rect.height / 2);
        const viewportCenter = viewportHeight / 2;
        const distanceFromCenter = Math.abs(cardCenter - viewportCenter) / viewportCenter;
        
        // 根据与视口中心的距离调整卡片的Z轴位置
        const zTranslate = Math.max(0, 20 - (distanceFromCenter * 40));
        const scale = Math.max(0.95, 1 - (distanceFromCenter * 0.1));
        
        // 应用3D效果
        card.style.transform = `perspective(1000px) translateZ(${zTranslate}px) scale(${scale})`;
      }
    });
  }, { passive: true });
});
