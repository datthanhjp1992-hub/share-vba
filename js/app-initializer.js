/**
 * APP INITIALIZER - Khởi động và quản lý ứng dụng
 * File: app-initializer.js
 * 
 * Chức năng:
 * - Khởi tạo ứng dụng khi DOM ready
 * - Quản lý login/register
 * - Xử lý social links
 * - Hiển thị thông báo
 * - Animation effects
 */

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        STORAGE_KEY_USERNAME: 'vba_forum_username',
        STORAGE_KEY_REMEMBER: 'vba_forum_remember',
        MESSAGE_DURATION: 3000,
        SCROLL_ANIMATION_OFFSET: 100
    };

    // ==================== INITIALIZATION ====================
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 VBA Forum Application initialized!');
        
        initLoginForm();
        initSocialLinks();
        initScrollAnimation();
        checkSavedLogin();
        addMessageStyles();
    });

    // ==================== LOGIN/REGISTER FUNCTIONS ====================

    function initLoginForm() {
        const loginButton = document.getElementById('loginButton');
        const registerButton = document.getElementById('registerButton');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember');
        
        if (loginButton) {
            loginButton.addEventListener('click', function() {
                handleLogin(usernameInput, passwordInput, rememberCheckbox);
            });
        }
        
        if (registerButton) {
            registerButton.addEventListener('click', function() {
                showMessage('Chuyển hướng đến trang đăng ký tài khoản mới...', 'info');
            });
        }

        // Forgot password link
        document.addEventListener('click', function(e) {
            if (e.target.closest('.forgot-password')) {
                e.preventDefault();
                showMessage('Chuyển hướng đến trang khôi phục mật khẩu...', 'info');
            }
        });
    }

    function handleLogin(usernameInput, passwordInput, rememberCheckbox) {
        if (!usernameInput || !passwordInput) return;

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const remember = rememberCheckbox?.checked || false;
        
        if (!username || !password) {
            showMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu', 'error');
            return;
        }
        
        // Simulate successful login
        showMessage(`Đăng nhập thành công với tên đăng nhập: ${username}`, 'success');
        
        // Save credentials if remember is checked
        if (remember) {
            localStorage.setItem(CONFIG.STORAGE_KEY_USERNAME, username);
            localStorage.setItem(CONFIG.STORAGE_KEY_REMEMBER, 'true');
            console.log('✅ Login credentials saved');
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEY_USERNAME);
            localStorage.removeItem(CONFIG.STORAGE_KEY_REMEMBER);
        }
    }

    function checkSavedLogin() {
        const savedUsername = localStorage.getItem(CONFIG.STORAGE_KEY_USERNAME);
        const savedRemember = localStorage.getItem(CONFIG.STORAGE_KEY_REMEMBER);
        const usernameInput = document.getElementById('username');
        const rememberCheckbox = document.getElementById('remember');
        
        if (savedUsername && savedRemember === 'true' && usernameInput && rememberCheckbox) {
            usernameInput.value = savedUsername;
            rememberCheckbox.checked = true;
            console.log('✅ Auto-filled saved login credentials');
        }
    }

    // ==================== SOCIAL LINKS ====================

    function initSocialLinks() {
        document.addEventListener('click', function(e) {
            const socialIcon = e.target.closest('.social-icon');
            if (!socialIcon) return;
            
            e.preventDefault();
            
            const platform = getSocialPlatform(socialIcon);
            showMessage(`Đang mở trang ${platform} của chúng tôi...`, 'info');
        });

        // Ad buttons
        document.addEventListener('click', function(e) {
            if (e.target.closest('.ad-button')) {
                showMessage('Đang chuyển hướng đến trang khóa học VBA...', 'info');
            }
        });
    }

    function getSocialPlatform(element) {
        if (element.classList.contains('facebook')) return 'Facebook';
        if (element.classList.contains('youtube')) return 'YouTube';
        if (element.classList.contains('github')) return 'GitHub';
        if (element.classList.contains('linkedin')) return 'LinkedIn';
        return 'Social Media';
    }

    // ==================== MESSAGE SYSTEM ====================

    function showMessage(message, type) {
        // Remove old message if exists
        const oldMessage = document.querySelector('.custom-message');
        if (oldMessage) {
            oldMessage.remove();
        }
        
        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `custom-message ${type}`;
        messageDiv.textContent = message;
        
        // Add to DOM
        document.body.appendChild(messageDiv);
        
        // Show with animation
        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 10);
        
        // Auto hide after duration
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                messageDiv.remove();
            }, 500);
        }, CONFIG.MESSAGE_DURATION);
    }

    function addMessageStyles() {
        // Check if styles already exist
        if (document.getElementById('app-message-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'app-message-styles';
        style.textContent = `
            .custom-message {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 5px;
                color: white;
                font-weight: 600;
                z-index: 1000;
                transform: translateX(120%);
                transition: transform 0.5s ease;
                max-width: 350px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .custom-message.show {
                transform: translateX(0);
            }
            
            .custom-message.success {
                background: linear-gradient(to right, #28a745, #20c997);
                border-left: 5px solid #1e7e34;
            }
            
            .custom-message.error {
                background: linear-gradient(to right, #dc3545, #e83e8c);
                border-left: 5px solid #bd2130;
            }
            
            .custom-message.info {
                background: linear-gradient(to right, #17a2b8, #138496);
                border-left: 5px solid #117a8b;
            }

            .custom-message.warning {
                background: linear-gradient(to right, #ffc107, #ff9800);
                border-left: 5px solid #ff6f00;
                color: #000;
            }

            .page-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                font-size: 1.2rem;
                color: #2a5298;
            }

            .page-loading i {
                margin-right: 10px;
                font-size: 1.5rem;
            }
        `;
        document.head.appendChild(style);
    }

    // ==================== SCROLL ANIMATION ====================

    function initScrollAnimation() {
        window.addEventListener('scroll', handleScrollAnimation);
        handleScrollAnimation(); // Trigger on load
    }

    function handleScrollAnimation() {
        const panels = document.querySelectorAll('.panel');
        const windowHeight = window.innerHeight;
        
        panels.forEach(panel => {
            const panelTop = panel.getBoundingClientRect().top;
            
            if (panelTop < windowHeight - CONFIG.SCROLL_ANIMATION_OFFSET) {
                panel.classList.add('animated');
            }
        });
    }

    // ==================== EXPORTS ====================

    window.VBAApp = {
        showMessage: showMessage,
        handleLogin: handleLogin
    };

    console.log('✅ App Initializer loaded');

})();