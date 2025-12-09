/**
 * NAVIGATION COMPONENTS - Back Button & Home Button
 * File: navigation-components.js
 * 
 * Quản lý các nút điều hướng Back và Home
 * Tự động khởi tạo và xử lý overflow
 */

(function() {
    'use strict';

    // ==================== BACK BUTTON ====================
    class BackButton {
        constructor() {
            this.initialized = false;
            this.buttons = new Set();
            this.history = [];
            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
            
            // Lắng nghe sự kiện pageLoaded để lưu history
            window.addEventListener('pageLoaded', (e) => {
                this.addToHistory(e.detail.page);
            });
        }

        setup() {
            if (this.initialized) {
                console.log('BackButton: Reinitializing...');
                this.cleanup();
            }

            const backButtons = document.querySelectorAll('.back-button');
            console.log(`BackButton: Found ${backButtons.length} buttons`);
            
            backButtons.forEach(button => {
                if (this.buttons.has(button)) return;

                // Thêm icon nếu chưa có
                if (!button.querySelector('i')) {
                    button.innerHTML = '<i class="fas fa-arrow-left"></i>';
                }

                // Gán event handler
                button._clickHandler = (e) => this.handleClick(e, button);
                button.addEventListener('click', button._clickHandler);

                // Xử lý overflow
                this.preventOverflow(button);
                this.buttons.add(button);
            });

            // Resize & scroll handlers với throttle
            if (!this._resizeHandler) {
                this._resizeHandler = this.throttle(() => {
                    this.buttons.forEach(btn => this.preventOverflow(btn));
                }, 100);
                window.addEventListener('resize', this._resizeHandler);
            }

            if (!this._scrollHandler) {
                this._scrollHandler = this.throttle(() => {
                    this.buttons.forEach(btn => this.preventOverflow(btn));
                }, 100);
                window.addEventListener('scroll', this._scrollHandler);
            }

            this.initialized = true;
        }

        cleanup() {
            this.buttons.forEach(button => {
                if (button._clickHandler) {
                    button.removeEventListener('click', button._clickHandler);
                    delete button._clickHandler;
                }
            });
            this.buttons.clear();
        }

        addToHistory(page) {
            this.history.push(page);
            console.log('BackButton: History updated', this.history);
        }

        handleClick(event, button) {
            event.preventDefault();
            event.stopPropagation();
            
            const route = button.getAttribute('data-route');
            const url = button.getAttribute('data-url');
            const onclick = button.getAttribute('data-onclick');
            const fallback = button.getAttribute('data-fallback') || 'wellcomePage.html';

            console.log('BackButton clicked:', { route, url, onclick, fallback });

            // Ưu tiên: onclick > route > url > custom back
            if (onclick) {
                try {
                    new Function(onclick)();
                } catch (error) {
                    console.error('Error executing onclick:', error);
                }
            } else if (route) {
                if (typeof handleMenuClick === 'function') {
                    handleMenuClick(route);
                } else {
                    console.warn('handleMenuClick not found');
                }
            } else if (url) {
                window.location.href = url;
            } else {
                this.goBack(fallback);
            }
        }

        goBack(fallback) {
            if (this.history.length > 1) {
                this.history.pop();
                const previousPage = this.history[this.history.length - 1];
                console.log('Going back to:', previousPage);
                
                if (typeof loadPage === 'function') {
                    loadPage(previousPage);
                } else if (window.history.length > 1) {
                    window.history.back();
                } else {
                    this.loadFallbackPage(fallback);
                }
            } else {
                this.loadFallbackPage(fallback);
            }
        }

        loadFallbackPage(fallback) {
            console.log('Loading fallback page:', fallback);
            
            if (typeof loadPage === 'function') {
                loadPage(fallback);
            } else if (typeof handleMenuClick === 'function') {
                handleMenuClick('wellcome');
            } else {
                window.location.href = fallback;
            }
        }

        preventOverflow(button) {
            if (!button) return;

            const buttonRect = button.getBoundingClientRect();
            
            // Nếu vượt ra ngoài bên trái
            if (buttonRect.left < 0) {
                button.style.left = '10px';
            }

            // Xử lý tooltip position
            const viewportWidth = window.innerWidth;
            const isNearRightEdge = buttonRect.right > viewportWidth - 100;
            
            if (isNearRightEdge) {
                button.classList.add('tooltip-right');
            } else {
                button.classList.remove('tooltip-right');
            }
        }

        throttle(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            };
        }

        reinitialize() {
            this.setup();
        }

        static back(fallback = 'wellcomePage.html') {
            if (window.backButtonInstance) {
                window.backButtonInstance.goBack(fallback);
            } else {
                window.history.back();
            }
        }
    }

    // ==================== HOME BUTTON ====================
    class HomeButton {
        constructor() {
            this.initialized = false;
            this.buttons = new Set();
            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            if (this.initialized) {
                console.log('HomeButton: Reinitializing...');
                this.cleanup();
            }

            const homeButtons = document.querySelectorAll('.home-button');
            console.log(`HomeButton: Found ${homeButtons.length} buttons`);
            
            homeButtons.forEach(button => {
                if (this.buttons.has(button)) return;

                // Thêm icon nếu chưa có
                if (!button.querySelector('i')) {
                    button.innerHTML = '<i class="fas fa-home"></i>';
                }

                // Gán event handler
                button._clickHandler = (e) => this.handleClick(e, button);
                button.addEventListener('click', button._clickHandler);

                // Xử lý overflow
                this.preventOverflow(button);
                this.buttons.add(button);
            });

            // Resize & scroll handlers với throttle
            if (!this._resizeHandler) {
                this._resizeHandler = this.throttle(() => {
                    this.buttons.forEach(btn => this.preventOverflow(btn));
                }, 100);
                window.addEventListener('resize', this._resizeHandler);
            }

            if (!this._scrollHandler) {
                this._scrollHandler = this.throttle(() => {
                    this.buttons.forEach(btn => this.preventOverflow(btn));
                }, 100);
                window.addEventListener('scroll', this._scrollHandler);
            }

            this.initialized = true;
        }

        cleanup() {
            this.buttons.forEach(button => {
                if (button._clickHandler) {
                    button.removeEventListener('click', button._clickHandler);
                    delete button._clickHandler;
                }
            });
            this.buttons.clear();
        }

        handleClick(event, button) {
            event.preventDefault();
            event.stopPropagation();
            
            const route = button.getAttribute('data-route');
            const url = button.getAttribute('data-url');
            const onclick = button.getAttribute('data-onclick');

            console.log('HomeButton clicked:', { route, url, onclick });

            // Ưu tiên: onclick > route > url
            if (onclick) {
                try {
                    new Function(onclick)();
                } catch (error) {
                    console.error('Error executing onclick:', error);
                }
            } else if (route) {
                if (typeof handleMenuClick === 'function') {
                    handleMenuClick(route);
                } else {
                    console.warn('handleMenuClick not found');
                }
            } else if (url) {
                window.location.href = url;
            } else {
                console.warn('No route, url, or onclick specified');
            }
        }

        preventOverflow(button) {
            if (!button) return;

            const viewportWidth = window.innerWidth;
            const buttonRect = button.getBoundingClientRect();

            // Nếu vượt ra ngoài bên phải
            if (buttonRect.right > viewportWidth) {
                button.style.right = '10px';
            }

            // Xử lý tooltip position
            const isNearRightEdge = buttonRect.right > viewportWidth - 100;
            const isNearLeftEdge = buttonRect.left < 100;

            if (isNearRightEdge) {
                button.classList.add('tooltip-left');
            } else if (isNearLeftEdge) {
                button.classList.add('tooltip-right');
            } else {
                button.classList.remove('tooltip-left', 'tooltip-right');
            }
        }

        throttle(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            };
        }

        reinitialize() {
            this.setup();
        }
    }

    // ==================== INITIALIZATION ====================
    // Tạo global instances
    if (!window.backButtonInstance) {
        window.backButtonInstance = new BackButton();
    } else {
        window.backButtonInstance.reinitialize();
    }

    if (!window.homeButtonInstance) {
        window.homeButtonInstance = new HomeButton();
    } else {
        window.homeButtonInstance.reinitialize();
    }

    // Export classes
    window.BackButton = BackButton;
    window.HomeButton = HomeButton;

    console.log('✅ Navigation Components initialized');

})();