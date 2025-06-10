    // トップページに戻るロゴを動的に挿入するスクリプト
    document.addEventListener('DOMContentLoaded', function() {
        const placeholder = document.getElementById('home-logo-placeholder');
        if (placeholder) {
            const logoHtml = `
                <a href="index.html" class="home-logo-link">
                    <img src="img/卓スタダロゴ.png" alt="トップページに戻る" class="home-logo">
                </a>
            `;
            placeholder.innerHTML = logoHtml;
        }
    });
    
        const canvas = document.getElementById('particleCanvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        const particleCount = 80;
        const particleSize = 1.5;
        const particleColor = 'rgba(255, 255, 255, 0.4)';

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        }

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * (particleSize * 2 - particleSize / 2) + particleSize / 2;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.speedY = Math.random() * 0.4 - 0.2;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width + this.size) this.x = -this.size;
                if (this.x < -this.size) this.x = canvas.width + this.size;
                if (this.y > canvas.height + this.size) this.y = -this.size;
                if (this.y < -this.size) this.y = canvas.height + this.size;
            }

            draw() {
                ctx.fillStyle = particleColor;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function animateParticles() {
            requestAnimationFrame(animateParticles);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
        }

        window.addEventListener('load', () => {
            resizeCanvas();
            animateParticles();
        });
        window.addEventListener('resize', resizeCanvas);
