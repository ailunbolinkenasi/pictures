document.addEventListener('DOMContentLoaded', () => {
  // 初始化瀑布流布局
  const grid = document.getElementById('masonryGrid');
  const items = document.querySelectorAll('.masonry-item');
  
  // ResizeObserver监听窗口变化自动调整布局
  const resizeObserver = new ResizeObserver(entries => {
    updateMasonryLayout();
  });
  
  resizeObserver.observe(grid);
  
  // 初始化懒加载
  const lazyImages = document.querySelectorAll('.masonry-card-image');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        
        // 预加载图片
        const preloadImage = new Image();
        preloadImage.src = src;
        preloadImage.onload = () => {
          img.src = src;
          img.classList.add('loaded');
        };
        
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '200px'
  });
  
  lazyImages.forEach(img => {
    imageObserver.observe(img);
  });
  
  // 视差滚动效果
  const parallaxItems = document.querySelectorAll('.masonry-item');
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    
    parallaxItems.forEach(item => {
      const depth = item.getAttribute('data-depth');
      const movement = -(scrollTop * depth);
      const scale = 1 + (depth / 10);
      
      item.style.transform = `translateY(${movement}px) scale(${scale})`;
    });
  });
  
  // 3D倾斜效果
  items.forEach(item => {
    item.addEventListener('mousemove', handleMouseMove);
    item.addEventListener('mouseleave', handleMouseLeave);
    item.addEventListener('mouseenter', handleMouseEnter);
  });
  
  function handleMouseMove(e) {
    const card = this.querySelector('.masonry-card');
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;
    
    card.style.transform = `perspective(1000px) rotateX(${deltaY * -5}deg) rotateY(${deltaX * 5}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.boxShadow = `
      0 ${10 + deltaY * 5}px ${20 + deltaY * 10}px rgba(0, 0, 0, ${0.1 + Math.abs(deltaY) * 0.05}),
      0 ${4 + deltaY * 2}px ${8 + deltaY * 4}px rgba(0, 0, 0, 0.1)
    `;
  }
  
  function handleMouseLeave() {
    const card = this.querySelector('.masonry-card');
    card.style.transform = '';
    card.style.boxShadow = '';
  }
  
  function handleMouseEnter() {
    this.style.zIndex = 10;
  }
  
  // 键盘导航支持
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const focusedElement = document.activeElement;
      if (focusedElement.classList.contains('masonry-card')) {
        focusedElement.style.transform = 'scale(1.05)';
        focusedElement.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
      }
    }
  });
  
  // 计算和更新瀑布流布局
  function updateMasonryLayout() {
    const containerWidth = grid.offsetWidth;
    let columns = Math.floor(containerWidth / 300);
    
    // 响应式列数调整
    if (window.innerWidth < 640) {
      columns = 1;
    } else if (window.innerWidth < 1024) {
      columns = Math.min(columns, 3);
    } else if (window.innerWidth >= 1600) {
      columns = Math.min(5, columns);
    } else {
      columns = Math.min(4, columns);
    }
    
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // 使用内容分块渲染减轻初始加载压力
    const renderBatch = (startIndex, batchSize) => {
      const endIndex = Math.min(startIndex + batchSize, items.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        items[i].style.visibility = 'visible';
        items[i].style.opacity = '1';
      }
      
      if (endIndex < items.length) {
        setTimeout(() => {
          renderBatch(endIndex, batchSize);
        }, 50);
      }
    };
    
    // 初始所有项隐藏
    items.forEach(item => {
      item.style.visibility = 'hidden';
      item.style.opacity = '0';
    });
    
    // 开始分批渲染
    renderBatch(0, 8);
  }
  
  // 初始化布局
  updateMasonryLayout();
}); 