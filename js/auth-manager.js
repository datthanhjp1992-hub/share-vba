/**
 * Authentication Manager
 * File: auth-manager.js
 * Quản lý việc hiển thị và chuyển đổi giữa login/logout dialogs
 */

(function() {
    'use strict';

    class AuthManager {
        constructor() {
            this.dialogContainer = null;
            this.currentUser = null;
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;
            
            console.log('🔐 Auth Manager initializing...');
            
            this.dialogContainer = document.getElementById('authDialog');
            if (!this.dialogContainer) {
                console.error('❌ Cannot find authDialog container');
                return;
            }

            // Load appropriate dialog based on login status
            this.loadDialog();

            // Listen for login/logout events
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('✅ Auth Manager initialized');
        }

        loadDialog() {
            const userData = localStorage.getItem('vba_user_data');
            
            if (userData) {
                try {
                    this.currentUser = JSON.parse(userData);
                    this.loadLoggedInDialog();
                } catch (e) {
                    console.error('Error parsing user data:', e);
                    this.loadLoginDialog();
                }
            } else {
                this.loadLoginDialog();
            }
        }

        async loadLoginDialog() {
            try {
                const response = await fetch('./dialogLogin.html');
                if (!response.ok) throw new Error('Failed to load login dialog');
                
                const html = await response.text();
                this.dialogContainer.innerHTML = html;
                
                // Initialize login form
                this.initLoginForm();
                
                console.log('✅ Login dialog loaded');
            } catch (error) {
                console.error('Error loading login dialog:', error);
                this.dialogContainer.innerHTML = '<p class="error">Không thể tải form đăng nhập</p>';
            }
        }

        async loadLoggedInDialog() {
            try {
                const response = await fetch('./dialogLogging.html');
                if (!response.ok) throw new Error('Failed to load logged in dialog');
                
                const html = await response.text();
                this.dialogContainer.innerHTML = html;
                
                // Update user info
                this.updateUserInfo();
                
                // Initialize logout button
                this.initLogoutButton();
                
                console.log('✅ Logged in dialog loaded');
            } catch (error) {
                console.error('Error loading logged in dialog:', error);
                this.dialogContainer.innerHTML = '<p class="error">Không thể tải thông tin người dùng</p>';
            }
        }

        updateUserInfo() {
            if (!this.currentUser) return;
            
            // Update username
            const usernameEl = document.getElementById('loggedUsername');
            if (usernameEl) {
                usernameEl.textContent = this.currentUser.username || this.currentUser.account || 'Không xác định';
            }
            
            // Update authorities
            const authoritiesEl = document.getElementById('loggedAuthorities');
            if (authoritiesEl) {
                const authLevel = this.currentUser.authorities || 0;
                let authText = 'Người dùng';
                if (authLevel === 1) authText = 'Quản trị viên';
                if (authLevel === 2) authText = 'Người kiểm duyệt';
                authoritiesEl.textContent = authText;
            }
            
            // Update birthday
            const birthdayEl = document.getElementById('loggedBirthday');
            if (birthdayEl) {
                const birthday = this.currentUser.birthday;
                if (birthday) {
                    try {
                        const date = new Date(birthday);
                        birthdayEl.textContent = date.toLocaleDateString('vi-VN');
                    } catch (e) {
                        birthdayEl.textContent = 'Không xác định';
                    }
                } else {
                    birthdayEl.textContent = 'Chưa cập nhật';
                }
            }
        }

        initLoginForm() {
            const loginButton = document.getElementById('loginButton');
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const rememberCheckbox = document.getElementById('remember');
            
            if (loginButton && window.VBAApp && window.VBAApp.handleLogin) {
                loginButton.addEventListener('click', () => {
                    window.VBAApp.handleLogin(usernameInput, passwordInput, rememberCheckbox);
                });
            }
            
            // Enter key support
            if (usernameInput && passwordInput) {
                usernameInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        window.VBAApp.handleLogin(usernameInput, passwordInput, rememberCheckbox);
                    }
                });
                
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        window.VBAApp.handleLogin(usernameInput, passwordInput, rememberCheckbox);
                    }
                });
            }
        }

        initLogoutButton() {
            const logoutButton = document.getElementById('logoutButton');
            const confirmLogout = document.getElementById('confirmLogout');
            const cancelLogout = document.getElementById('cancelLogout');
            const logoutModal = document.getElementById('logoutConfirmation');
            
            if (logoutButton) {
                logoutButton.addEventListener('click', () => {
                    this.showLogoutConfirmation();
                });
            }
            
            if (confirmLogout) {
                confirmLogout.addEventListener('click', () => {
                    this.performLogout();
                });
            }
            
            if (cancelLogout) {
                cancelLogout.addEventListener('click', () => {
                    this.hideLogoutConfirmation();
                });
            }
            
            // Close modal when clicking outside
            if (logoutModal) {
                logoutModal.addEventListener('click', (e) => {
                    if (e.target === logoutModal) {
                        this.hideLogoutConfirmation();
                    }
                });
            }
        }

        showLogoutConfirmation() {
            const logoutModal = document.getElementById('logoutConfirmation');
            if (logoutModal) {
                logoutModal.classList.add('show');
            }
        }

        hideLogoutConfirmation() {
            const logoutModal = document.getElementById('logoutConfirmation');
            if (logoutModal) {
                logoutModal.classList.remove('show');
            }
        }

        performLogout() {
            // Call logout process
            if (window.LoginProcess && window.LoginProcess.logout) {
                window.LoginProcess.logout();
            }
            
            // Clear local storage
            localStorage.removeItem('vba_user_data');
            localStorage.removeItem('vba_forum_username');
            localStorage.removeItem('vba_forum_remember');
            
            // Reset current user
            this.currentUser = null;
            
            // Hide confirmation modal
            this.hideLogoutConfirmation();
            
            // Show logout message
            if (window.VBAApp && window.VBAApp.showMessage) {
                window.VBAApp.showMessage('Đã đăng xuất thành công', 'info');
            }
            
            // Reload login dialog
            this.loadLoginDialog();
            
            console.log('✅ User logged out');
        }

        setupEventListeners() {
            // Listen for custom login success event
            document.addEventListener('userLoggedIn', (event) => {
                if (event.detail && event.detail.userData) {
                    this.currentUser = event.detail.userData;
                    this.loadLoggedInDialog();
                }
            });
            
            // Listen for logout event
            document.addEventListener('userLoggedOut', () => {
                this.currentUser = null;
                this.loadLoginDialog();
            });
        }
    }

    // Create global instance
    window.AuthManager = new AuthManager();

})();