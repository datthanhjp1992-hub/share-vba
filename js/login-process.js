// Biến toàn cục lưu thông tin người dùng
window.userInformation = "";
window.userLoginStatus = "";
window.userName = "";
window.userAuthorities = "";
window.userBirthday = "";

/**
 * Phương thức gửi request lên server để kiểm tra đăng nhập
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu
 * @returns {Promise<Object>} - Kết quả đăng nhập
 */
async function loginProcess(username, password) {
    console.log(`🔐 Attempting login for user: ${username}`);
    
    try {
        // Gửi request GET đến API đăng nhập
        const apiUrl = API_CONFIG_BASEMENT.API_BASE_URL + `/account/login?account=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
        console.log(`📡 Sending login request to: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📥 Response status: ${response.status}`);
        
        // Parse response
        const result = await response.json();
        console.log('📊 Login response:', result);
        
        if (response.ok && result.success) {
            // Đăng nhập thành công
            console.log(`✅ Login successful for user: ${username}`);
            
            // Cập nhật biến toàn cục
            window.userInformation = result.data;
            window.userLoginStatus = "logged_in";
            window.userName = result.data.username || result.data.account;
            window.userAuthorities = result.data.authorities || 0;
            window.userBirthday = result.data.birthday || "";
            
            return {
                success: true,
                message: result.message,
                username: result.data.username || result.data.account,
                ...result.data
            };
        } else {
            // Đăng nhập thất bại
            console.log(`❌ Login failed: ${result.error || 'Unknown error'}`);
            
            // Reset biến toàn cục
            window.userInformation = "";
            window.userLoginStatus = "not_logged_in";
            window.userName = "";
            window.userAuthorities = "";
            window.userBirthday = "";
            
            return {
                success: false,
                error: result.error || 'Đăng nhập thất bại',
                statusCode: response.status
            };
        }
        
    } catch (error) {
        console.error('💥 Login process error:', error);
        
        // Reset biến toàn cục
        window.userInformation = "";
        window.userLoginStatus = "not_logged_in";
        window.userName = "";
        window.userAuthorities = "";
        window.userBirthday = "";
        
        return {
            success: false,
            error: `Lỗi kết nối: ${error.message}`,
            isNetworkError: true
        };
    }
}

/**
 * Kiểm tra trạng thái đăng nhập hiện tại
 * @returns {boolean} - True nếu đã đăng nhập
 */
function isLoggedIn() {
    return window.userLoginStatus === "logged_in" && window.userInformation !== "";
}

/**
 * Lấy thông tin người dùng hiện tại
 * @returns {Object} - Thông tin người dùng
 */
function getCurrentUser() {
    return window.userInformation || null;
}

/**
 * Lấy tên người dùng hiện tại
 * @returns {string} - Tên người dùng
 */
function getCurrentUsername() {
    return window.userName || "";
}

/**
 * Kiểm tra quyền của người dùng
 * @param {number} requiredAuthority - Quyền cần kiểm tra
 * @returns {boolean} - True nếu có quyền
 */
function hasAuthority(requiredAuthority) {
    return parseInt(window.userAuthorities || 0) >= requiredAuthority;
}

/**
 * Đăng xuất người dùng
 */
function logoutProcess() {
    console.log('👋 Logging out user');
    
    // Reset tất cả biến
    window.userInformation = "";
    window.userLoginStatus = "";
    window.userName = "";
    window.userAuthorities = "";
    window.userBirthday = "";
    
    // Có thể gọi API đăng xuất nếu cần
    // fetch('/account/logout', { method: 'POST' });
    
    return {
        success: true,
        message: 'Đã đăng xuất'
    };
}

// Export các hàm để sử dụng ở nơi khác
window.LoginProcess = {
    login: loginProcess,
    logout: logoutProcess,
    isLoggedIn: isLoggedIn,
    getCurrentUser: getCurrentUser,
    getCurrentUsername: getCurrentUsername,
    hasAuthority: hasAuthority
};

console.log('✅ Login Process module loaded');