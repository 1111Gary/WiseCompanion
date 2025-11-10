document.addEventListener("DOMContentLoaded", async () => {
  const filePath = './activities.json';
  const category = document.body.dataset.category;

  const listContainer = document.getElementById('activity-list');
  const tagContainer = document.getElementById('filter-tags');

  try {
    const response = await fetch(filePath);
    const data = await response.json();

    // 当前页面分类数据
    const filteredData = data.filter(item =>
      item.category && item.category.includes(category)
    );

    if (!filteredData.length) {
      listContainer.innerHTML = `<p class="text-center text-gray-400">暂无活动数据。</p>`;
      return;
    }

    // ✅ 自动生成标签
    const subcategories = [...new Set(filteredData.flatMap(item => item.category.filter(c => c !== category)))];
    const allTags = ['All', ...subcategories];

    allTags.forEach(tag => {
      const btn = document.createElement('button');
      btn.textContent = tag === 'All' ? '全部' : tag;
      btn.className = 'tag-button' + (tag === 'All' ? ' active' : '');
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tag-button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderList(tag === 'All' ? filteredData : filteredData.filter(item => item.category.includes(tag)));
      });
      tagContainer.appendChild(btn);
    });

    renderList(filteredData);

    // ✅ 渲染函数
    function renderList(items) {
      listContainer.innerHTML = '';
      items.forEach(item => {
        const endDate = item.endDate ? new Date(item.endDate) : null;
        const now = new Date();
        let countdownText = '';
        let expired = false;

        if (endDate) {
          const diff = endDate - now;
          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            countdownText = `剩余 ${days} 天`;
          } else {
            countdownText = '已结束';
            expired = true;
          }
        } else {
          countdownText = '长期有效';
        }

        const card = document.createElement('div');
        card.className = 'task-list-card';
        card.innerHTML = `
          <div class="task-icon">${item.icon || '🏦'}</div>
          <div class="task-content">
            <div class="task-title">${item.name}</div>
            <div class="task-subtitle">${item.description || ''}</div>
          </div>
          <div class="task-action">
            <a href="${item.deepLink || '#'}" target="_blank" class="action-button">${category === 'Bank' ? '去参与' : '前往'}</a>
            <div class="countdown ${expired ? 'expired' : ''}">${countdownText}</div>
          </div>
        `;
        listContainer.appendChild(card);
      });
    }
  } catch (err) {
    console.error('加载活动数据失败:', err);
    listContainer.innerHTML = `<p class="text-center text-red-400">❌ 数据加载失败</p>`;
  }
});
