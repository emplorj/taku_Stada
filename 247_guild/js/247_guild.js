document.addEventListener('DOMContentLoaded', function() {

  // --- ヘッダーのスクロールエフェクト ---
  const header = document.querySelector('.page-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // --- メンバーのフィルタリング機能 ---
  const filterButtons = document.querySelectorAll('.filter-btn');
  const memberCards = document.querySelectorAll('.member-list .member-card');
  
  if (filterButtons.length > 0 && memberCards.length > 0) {
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // アクティブなボタンのスタイルを切り替え
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const filter = button.dataset.filter; // 'all', '前衛', '後衛', 'その他'
        
        memberCards.forEach(card => {
          const role = card.dataset.role;
          
          // フィルタに一致するか、フィルタが'all'なら表示
          if (filter === 'all' || filter === role) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  // --- 掲示板機能 ---
  const postForm = document.getElementById('post-form');
  if (postForm) {
    postForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = this.elements.name.value;
      const title = this.elements.title.value;
      const body = this.elements.body.value;
      const date = new Date().toLocaleDateString('ja-JP');

      const newPost = document.createElement('div');
      newPost.classList.add('post');
      newPost.innerHTML = `
        <h4>${title}</h4>
        <p class="post-meta">投稿者: ${name} | ${date}</p>
        <p>${body.replace(/\n/g, '<br>')}</p>
      `;

      const postsContainer = document.getElementById('posts-container');
      postsContainer.insertBefore(newPost, postsContainer.children[1]);

      this.reset();
      this.elements.name.value = '名無しの冒険者';
    });
  }

});