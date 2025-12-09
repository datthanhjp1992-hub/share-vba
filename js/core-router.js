/**
 * CORE ROUTER - Quản lý điều hướng và tải trang
 * File: core-router.js
 * 
 * Chức năng:
 * - Định tuyến giữa các trang
 * - Tải động nội dung HTML
 * - Quản lý history navigation
 * - Tự động khởi tạo lại components sau khi load trang
 */

(function() {
    'use strict';

    // Cấu hình routes
    const ROUTES = {
        wellcome: "wellcomePage.html",
        excel: "pagevbaexcel.html",
        access: "pagevbaaccess.html",
        powerpoint: "pagevbapp.html",
        other: "pagevbaother.html",
        usefullexcelfunction: "pageusefullvbaexcelfunction.html"
    };

    /**
     * Load trang mới và inject vào #content
     * @param {string} page - Đường dẫn file HTML
     */
    window.loadPage = function(page) {
        console.log('🔄 Loading page:', page);
        
        const contentEl = document.getElementById("content");
        if (!contentEl) {
            console.error('❌ Không tìm thấy element #content');
            return;
        }

        // Hiển thị loading
        contentEl.innerHTML = '<div class="page-loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

        fetch(page)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.text();
            })
            .then(html => {
                // Inject HTML
                contentEl.innerHTML = html;
                console.log('✅ HTML loaded successfully');

                // Xử lý và thực thi các script trong HTML
                executePageScripts(contentEl);

                // Reinitialize các components sau khi load xong
                setTimeout(() => {
                    reinitializeComponents();
                    autoInitializeComponents();
                }, 100);

                // Dispatch event để các module khác biết trang đã load
                window.dispatchEvent(new CustomEvent('pageLoaded', { 
                    detail: { page: page } 
                }));
            })
            .catch(err => {
                console.error("❌ Lỗi load trang:", err);
                showErrorPage(err.message);
            });
    };

    /**
     * Thực thi các script có trong HTML được load
     * @param {HTMLElement} container - Container chứa HTML mới
     */
    function executePageScripts(container) {
        const scripts = container.querySelectorAll("script");
        console.log(`📜 Found ${scripts.length} scripts in page`);

        scripts.forEach((oldScript, index) => {
            const newScript = document.createElement("script");
            
            // Copy tất cả attributes
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            
            // Script có src (external)
            if (oldScript.src) {
                newScript.src = oldScript.src;
                newScript.onload = () => {
                    console.log(`✅ External script loaded: ${oldScript.src}`);
                };
                newScript.onerror = () => {
                    console.error(`❌ Failed to load script: ${oldScript.src}`);
                };
            } else {
                // Inline script
                newScript.textContent = oldScript.textContent;
            }
            
            // Thêm vào body và xóa script cũ
            document.body.appendChild(newScript);
            oldScript.remove();
        });
    }

    /**
     * Reinitialize các component sau khi load trang mới
     */
    function reinitializeComponents() {
        console.log('🔄 Reinitializing components...');
        
        // Home Button
        if (window.homeButtonInstance?.reinitialize) {
            window.homeButtonInstance.reinitialize();
        }
        
        // Back Button
        if (window.backButtonInstance?.reinitialize) {
            window.backButtonInstance.reinitialize();
        }

        console.log('✅ Components reinitialized');
    }

    /**
     * Auto-initialize các components dựa trên data attributes
     */
    function autoInitializeComponents() {
        console.log('🔍 Auto-initializing components...');
        
        // DialogVBAExcel component
        const dialogContainer = document.getElementById('dialogvbaexcelContainer');
        if (dialogContainer?.dataset.autoInit === 'true') {
            console.log('📦 Found dialogvbaexcel container, initializing...');
            
            if (typeof dialogvbaexcel_init === 'function') {
                setTimeout(dialogvbaexcel_init, 150);
            } else if (window.dialogvbaexcel?.init) {
                setTimeout(window.dialogvbaexcel.init, 150);
            } else {
                console.warn('⚠️ DialogVBAExcel not loaded yet');
            }
        }
    }

    /**
     * Handler cho menu navigation
     * @param {string} route - Route key từ ROUTES config
     */
    window.handleMenuClick = function(route) {
        console.log("🔗 handleMenuClick called with route:", route);
        
        if (!ROUTES[route]) {
            console.warn("⚠️ Route not found:", route);
            alert("Trang này đang được phát triển!");
            return;
        }
        
        loadPage(ROUTES[route]);
    };

    /**
     * Hiển thị trang lỗi
     * @param {string} errorMessage - Thông báo lỗi
     */
    function showErrorPage(errorMessage) {
        const contentEl = document.getElementById("content");
        if (contentEl) {
            contentEl.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #d9534f;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>Không thể tải trang</h3>
                    <p>Lỗi: ${errorMessage}</p>
                    <button onclick="loadPage('wellcomePage.html')" 
                            style="padding: 10px 20px; background: #2a5298; color: white; 
                                   border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                        <i class="fas fa-home"></i> Quay lại trang chủ
                    </button>
                </div>
            `;
        }
    }

    // Export functions để sử dụng từ bên ngoài
    window.VBARouter = {
        loadPage: loadPage,
        navigate: handleMenuClick,
        reinitialize: reinitializeComponents
    };

    console.log('✅ Core Router initialized');

})();