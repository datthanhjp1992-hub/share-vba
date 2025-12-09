/**
 * VBA FUNCTIONS MODULE
 * File: vba-functions-module.js
 * 
 * Module quản lý VBA Functions với API backend
 * - Kết nối với Python API (Render.com)
 * - CRUD operations cho VBA functions
 * - Like & Download tracking
 */

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        API_BASE_URL: 'https://my-python-app-pm7j.onrender.com',
        API_ENDPOINT: 'https://my-python-app-pm7j.onrender.com/api/vba-functions',
        TOAST_DURATION: 3000
    };

    // ==================== STATE MANAGEMENT ====================
    const state = {
        currentFunctionId: null,
        allFunctions: [],
        selectedFunction: null,
        isLoading: false
    };

    // ==================== DOM CACHE ====================
    let DOM = {};

    function cacheDOMElements() {
        DOM = {
            // List elements
            functionsListBody: document.getElementById('dialogvbaexcel_functionsListBody'),
            listLoading: document.getElementById('dialogvbaexcel_listLoading'),
            listNoData: document.getElementById('dialogvbaexcel_listNoData'),
            listCount: document.getElementById('dialogvbaexcel_listCount'),
            searchInput: document.getElementById('dialogvbaexcel_searchInput'),
            searchBtn: document.getElementById('dialogvbaexcel_searchBtn'),
            refreshBtn: document.getElementById('dialogvbaexcel_refreshBtn'),
            addBtn: document.getElementById('dialogvbaexcel_addBtn'),
            testConnectionBtn: document.getElementById('dialogvbaexcel_testConnection'),
            
            // Detail elements
            detailContainer: document.getElementById('dialogvbaexcel_detailContainer'),
            noSelection: document.getElementById('dialogvbaexcel_noSelection'),
            functionDetail: document.getElementById('dialogvbaexcel_functionDetail'),
            selectedId: document.getElementById('dialogvbaexcel_selectedId'),
            detailTitle: document.getElementById('dialogvbaexcel_detailTitle'),
            detailLikes: document.getElementById('dialogvbaexcel_detailLikes'),
            detailDownloads: document.getElementById('dialogvbaexcel_detailDownloads'),
            detailCreatedAt: document.getElementById('dialogvbaexcel_detailCreatedAt'),
            editTitle: document.getElementById('dialogvbaexcel_editTitle'),
            editContent: document.getElementById('dialogvbaexcel_editContent'),
            editComment: document.getElementById('dialogvbaexcel_editComment'),
            saveBtn: document.getElementById('dialogvbaexcel_saveBtn'),
            deleteBtn: document.getElementById('dialogvbaexcel_deleteBtn'),
            incrementLikeBtn: document.getElementById('dialogvbaexcel_incrementLikeBtn'),
            incrementDownloadBtn: document.getElementById('dialogvbaexcel_incrementDownloadBtn'),
            
            // Modal elements
            functionModal: document.getElementById('dialogvbaexcel_functionModal'),
            confirmModal: document.getElementById('dialogvbaexcel_confirmModal'),
            functionForm: document.getElementById('dialogvbaexcel_functionForm'),
            deleteFunctionId: document.getElementById('dialogvbaexcel_deleteFunctionId'),
            
            // Toast
            toast: document.getElementById('dialogvbaexcel_toast')
        };
    }

    // ==================== INITIALIZATION ====================
    
    function init() {
        console.log('🚀 VBA Functions Module: Initializing...');
        cacheDOMElements();
        initEventListeners();
        loadFunctionsList();
        checkServerStatus();
    }

    function initEventListeners() {
        // Test connection
        if (DOM.testConnectionBtn) {
            DOM.testConnectionBtn.addEventListener('click', handleTestConnection);
        }

        // List controls
        if (DOM.refreshBtn) {
            DOM.refreshBtn.addEventListener('click', loadFunctionsList);
        }
        
        if (DOM.addBtn) {
            DOM.addBtn.addEventListener('click', () => openModal('add'));
        }
        
        // Search
        if (DOM.searchBtn) {
            DOM.searchBtn.addEventListener('click', searchFunctions);
        }
        
        if (DOM.searchInput) {
            DOM.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') searchFunctions();
            });
        }
        
        // Detail controls
        if (DOM.saveBtn) {
            DOM.saveBtn.addEventListener('click', saveFunction);
        }
        
        if (DOM.deleteBtn) {
            DOM.deleteBtn.addEventListener('click', () => confirmDelete(state.currentFunctionId));
        }
        
        if (DOM.incrementLikeBtn) {
            DOM.incrementLikeBtn.addEventListener('click', incrementLike);
        }
        
        if (DOM.incrementDownloadBtn) {
            DOM.incrementDownloadBtn.addEventListener('click', incrementDownload);
        }
        
        // Modal close buttons
        document.querySelectorAll('.dialogvbaexcel-close, .dialogvbaexcel-close-modal').forEach(btn => {
            btn.addEventListener('click', closeModals);
        });
        
        // Confirm/Cancel delete
        const cancelDeleteBtn = document.getElementById('dialogvbaexcel_cancelDelete');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', closeModals);
        }
        
        const confirmDeleteBtn = document.getElementById('dialogvbaexcel_confirmDelete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', softDeleteFunction);
        }
        
        // Form submit
        if (DOM.functionForm) {
            DOM.functionForm.addEventListener('submit', handleFormSubmit);
        }
        
        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (DOM.functionModal && e.target === DOM.functionModal) {
                closeModals();
            }
            if (DOM.confirmModal && e.target === DOM.confirmModal) {
                closeModals();
            }
        });
    }

    // ==================== API FUNCTIONS ====================

    async function checkServerStatus() {
        console.log('🔍 Checking server status...');
        
        const endpoints = [
            `${CONFIG.API_BASE_URL}/health`,
            `${CONFIG.API_BASE_URL}/`,
            CONFIG.API_ENDPOINT
        ];
        
        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                const response = await fetch(endpoint, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache'
                });
                const responseTime = Date.now() - startTime;
                
                console.log(`✓ ${endpoint}: ${response.status} (${responseTime}ms)`);
                
                if (response.ok) {
                    updateServerStatus(true);
                    return true;
                }
            } catch (error) {
                console.error(`✗ ${endpoint}: ${error.message}`);
            }
        }
        
        updateServerStatus(false);
        return false;
    }

    function updateServerStatus(isOnline) {
        const statusElement = document.getElementById('dialogvbaexcel_serverStatus');
        if (statusElement) {
            statusElement.textContent = isOnline ? 'Server đang hoạt động' : 'Không thể kết nối đến server';
            statusElement.style.color = isOnline ? '#28a745' : '#dc3545';
        }
    }

    async function loadFunctionsList() {
        console.log('📥 Loading functions list...');
        showListLoading(true);
        
        try {
            const response = await fetch(`${CONFIG.API_ENDPOINT}?show_deleted=false`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                state.allFunctions = data.data;
                displayFunctionsList(state.allFunctions);
                updateListCount(state.allFunctions.length);
                showToast('Đã tải danh sách functions thành công!', 'success');
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('❌ Error loading functions:', error);
            showToast('Không thể kết nối đến server: ' + error.message, 'error');
            showSampleData(); // Fallback to sample data
        } finally {
            showListLoading(false);
        }
    }

    async function loadFunctionsListByPrefix(inputPrefix) {
        console.log('📥 Loading functions list...');
        showListLoading(true);

        try {
            
            inputPrefix = inputPrefix ?? 0;

            const url = `${CONFIG.API_ENDPOINT}?prefix=${inputPrefix}&show_deleted=true`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                state.allFunctions = data.data;
                displayFunctionsList(state.allFunctions);
                updateListCount(state.allFunctions.length);
                showToast('Đã tải danh sách functions thành công!', 'success');
            } else {
                throw new Error(data.error || 'Unknown error');
            }

        } catch (error) {
            console.error('❌ Error loading functions:', error);
            showToast('Không thể kết nối đến server: ' + error.message, 'error');
            showSampleData(); // Fallback
        } finally {
            showListLoading(false);
        }
    }


    function showSampleData() {
        console.log('📋 Showing sample data...');
        
        state.allFunctions = [
            {
                id: 'EXC-001',
                title: 'Hàm Format Date Excel',
                content: 'Function FormatDateEx(dt As Date) As String\n    FormatDateEx = Format(dt, "dd/mm/yyyy")\nEnd Function',
                comment: 'Hàm định dạng ngày tháng',
                like: 15,
                download: 42,
                created_at: '2023-10-15T08:30:00Z'
            },
            {
                id: 'EXC-002',
                title: 'Hàm Remove Duplicates',
                content: 'Sub RemoveDuplicatesEx()\n    ActiveSheet.Range("A:A").RemoveDuplicates Columns:=1, Header:=xlYes\nEnd Sub',
                comment: 'Xóa trùng lặp trong cột A',
                like: 23,
                download: 67,
                created_at: '2023-10-16T14:20:00Z'
            },
            {
                id: 'EXC-003',
                title: 'Auto Filter Data',
                content: 'Sub ApplyAutoFilter()\n    If ActiveSheet.AutoFilterMode Then\n        ActiveSheet.AutoFilterMode = False\n    End If\n    ActiveSheet.Range("A1").AutoFilter\nEnd Sub',
                comment: 'Áp dụng auto filter',
                like: 8,
                download: 31,
                created_at: '2023-10-17T10:15:00Z'
            }
        ];
        
        displayFunctionsList(state.allFunctions);
        updateListCount(state.allFunctions.length);
        showToast('Đang sử dụng dữ liệu mẫu (server không khả dụng)', 'warning');
    }

    // ==================== CRUD OPERATIONS ====================

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('dialogvbaexcel_newTitle')?.value.trim() || '',
            content: document.getElementById('dialogvbaexcel_functionContent')?.value.trim() || '',
            comment: document.getElementById('dialogvbaexcel_newComment')?.value.trim() || '',
            type: parseInt(document.getElementById('dialogvbaexcel_functionType')?.value) || 4
        };
        
        if (!formData.title) {
            showToast('Vui lòng nhập tiêu đề function!', 'warning');
            return;
        }
        
        if (!formData.content) {
            showToast('Vui lòng nhập nội dung VBA code!', 'warning');
            return;
        }
        
        try {
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast(data.message, 'success');
                closeModals();
                loadFunctionsList();
                
                if (data.data?.id) {
                    setTimeout(() => selectFunction(data.data.id), 500);
                }
            } else {
                showToast('Lỗi: ' + data.error, 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    }

    async function saveFunction() {
        if (!state.currentFunctionId || !state.selectedFunction) {
            showToast('Vui lòng chọn một function để chỉnh sửa', 'warning');
            return;
        }
        
        const updatedData = {
            title: DOM.editTitle?.value.trim() || '',
            content: DOM.editContent?.value.trim() || '',
            comment: DOM.editComment?.value.trim() || ''
        };
        
        if (!updatedData.title || !updatedData.content) {
            showToast('Vui lòng nhập đầy đủ thông tin!', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${CONFIG.API_ENDPOINT}/${state.currentFunctionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Đã cập nhật function thành công!', 'success');
                loadFunctionsList();
                state.selectedFunction = data.data;
                displayFunctionDetail(state.selectedFunction);
            } else {
                showToast('Lỗi: ' + data.error, 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    }

    async function softDeleteFunction() {
        try {
            const response = await fetch(`${CONFIG.API_ENDPOINT}/${state.currentFunctionId}/soft-delete`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Đã xóa function thành công!', 'success');
                closeModals();
                clearSelection();
                loadFunctionsList();
            } else {
                showToast('Lỗi: ' + data.error, 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    }

    async function incrementLike() {
        if (!state.currentFunctionId) return;
        
        try {
            const response = await fetch(`${CONFIG.API_ENDPOINT}/${state.currentFunctionId}/like`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Đã tăng like!', 'success');
                if (state.selectedFunction && DOM.detailLikes) {
                    state.selectedFunction.like = data.data.like;
                    DOM.detailLikes.textContent = state.selectedFunction.like;
                }
            } else {
                showToast('Lỗi: ' + data.error, 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    }

    async function incrementDownload() {
        if (!state.currentFunctionId) return;
        
        try {
            const response = await fetch(`${CONFIG.API_ENDPOINT}/${state.currentFunctionId}/download`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Đã tăng download!', 'success');
                if (state.selectedFunction && DOM.detailDownloads) {
                    state.selectedFunction.download = data.data.download;
                    DOM.detailDownloads.textContent = state.selectedFunction.download;
                }
            } else {
                showToast('Lỗi: ' + data.error, 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối: ' + error.message, 'error');
        }
    }

    // ==================== UI FUNCTIONS ====================

    function displayFunctionsList(functions) {
        if (!DOM.functionsListBody) return;
        
        if (functions.length === 0) {
            DOM.functionsListBody.innerHTML = '';
            if (DOM.listNoData) DOM.listNoData.style.display = 'block';
            return;
        }
        
        if (DOM.listNoData) DOM.listNoData.style.display = 'none';
        
        const html = functions.map(func => `
            <tr data-id="${func.id}" class="${func.id === state.currentFunctionId ? 'dialogvbaexcel-selected' : ''}">
                <td>${func.id}</td>
                <td>${escapeHtml(func.title || 'Untitled Function')}</td>
            </tr>
        `).join('');
        
        DOM.functionsListBody.innerHTML = html;
        
        DOM.functionsListBody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', function() {
                selectFunction(this.getAttribute('data-id'));
            });
        });
    }

    function selectFunction(functionId) {
        // Remove selected class from all rows
        if (DOM.functionsListBody) {
            DOM.functionsListBody.querySelectorAll('tr').forEach(row => {
                row.classList.remove('dialogvbaexcel-selected');
            });
            
            const selectedRow = DOM.functionsListBody.querySelector(`tr[data-id="${functionId}"]`);
            if (selectedRow) {
                selectedRow.classList.add('dialogvbaexcel-selected');
            }
        }
        
        state.currentFunctionId = functionId;
        state.selectedFunction = state.allFunctions.find(f => f.id === functionId);
        
        if (state.selectedFunction) {
            displayFunctionDetail(state.selectedFunction);
        }
    }

    function displayFunctionDetail(func) {
        if (DOM.noSelection) DOM.noSelection.style.display = 'none';
        if (DOM.functionDetail) DOM.functionDetail.style.display = 'block';
        
        if (DOM.selectedId) {
            DOM.selectedId.textContent = func.id;
            DOM.selectedId.className = 'dialogvbaexcel-badge dialogvbaexcel-badge-primary';
        }
        
        if (DOM.detailTitle) DOM.detailTitle.textContent = func.title || 'Untitled Function';
        if (DOM.detailLikes) DOM.detailLikes.textContent = func.like;
        if (DOM.detailDownloads) DOM.detailDownloads.textContent = func.download;
        if (DOM.detailCreatedAt) DOM.detailCreatedAt.textContent = formatDate(func.created_at);
        
        if (DOM.editTitle) DOM.editTitle.value = func.title || '';
        if (DOM.editContent) DOM.editContent.value = func.content || '';
        if (DOM.editComment) DOM.editComment.value = func.comment || '';
    }

    function clearSelection() {
        state.currentFunctionId = null;
        state.selectedFunction = null;
        
        if (DOM.functionsListBody) {
            DOM.functionsListBody.querySelectorAll('tr').forEach(row => {
                row.classList.remove('dialogvbaexcel-selected');
            });
        }
        
        if (DOM.noSelection) DOM.noSelection.style.display = 'flex';
        if (DOM.functionDetail) DOM.functionDetail.style.display = 'none';
        if (DOM.selectedId) {
            DOM.selectedId.textContent = 'Chưa chọn';
            DOM.selectedId.className = 'dialogvbaexcel-badge';
        }
    }

    function searchFunctions() {
        const searchTerm = DOM.searchInput?.value.toLowerCase().trim() || '';
        
        if (!searchTerm) {
            displayFunctionsList(state.allFunctions);
            return;
        }
        
        const filtered = state.allFunctions.filter(func => 
            func.id.toLowerCase().includes(searchTerm) ||
            (func.title && func.title.toLowerCase().includes(searchTerm)) ||
            func.content.toLowerCase().includes(searchTerm)
        );
        
        displayFunctionsList(filtered);
        
        if (filtered.length === 0) {
            showToast('Không tìm thấy function phù hợp', 'warning');
        }
    }

    function openModal(mode) {
        if (DOM.functionForm) DOM.functionForm.reset();
        
        const modalTitle = document.getElementById('dialogvbaexcel_modalTitle');
        if (modalTitle) modalTitle.textContent = 'Thêm VBA Function mới';
        
        if (DOM.functionModal) DOM.functionModal.style.display = 'flex';
        
        const newTitleInput = document.getElementById('dialogvbaexcel_newTitle');
        if (newTitleInput) newTitleInput.focus();
    }

    function closeModals() {
        if (DOM.functionModal) DOM.functionModal.style.display = 'none';
        if (DOM.confirmModal) DOM.confirmModal.style.display = 'none';
    }

    function confirmDelete(functionId) {
        if (!functionId) return;
        
        state.currentFunctionId = functionId;
        
        if (DOM.deleteFunctionId) {
            DOM.deleteFunctionId.textContent = functionId;
        }
        
        if (DOM.confirmModal) {
            DOM.confirmModal.style.display = 'flex';
        }
    }

    // ==================== HELPER FUNCTIONS ====================

    async function handleTestConnection() {
        if (!DOM.testConnectionBtn) return;
        
        DOM.testConnectionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        const isConnected = await checkServerStatus();
        
        showToast(
            isConnected ? 'Kết nối server thành công!' : 'Không thể kết nối đến server',
            isConnected ? 'success' : 'error'
        );
        
        DOM.testConnectionBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Test';
    }

    function showListLoading(show) {
        if (DOM.listLoading) {
            DOM.listLoading.style.display = show ? 'block' : 'none';
        }
    }

    function updateListCount(count) {
        if (DOM.listCount) {
            DOM.listCount.textContent = count;
        }
    }

    function showToast(message, type = 'info') {
        if (DOM.toast) {
            DOM.toast.textContent = message;
            DOM.toast.className = `dialogvbaexcel-toast ${type} dialogvbaexcel-show`;
            
            setTimeout(() => {
                DOM.toast.classList.remove('dialogvbaexcel-show');
            }, CONFIG.TOAST_DURATION);
        }
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== AUTO-INITIALIZATION ====================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export public API
    window.dialogvbaexcel = {
        init: init,
        loadFunctions: loadFunctionsList,
        selectFunction: selectFunction
    };

    // Legacy compatibility
    window.dialogvbaexcel_init = init;

    console.log('✅ VBA Functions Module loaded');

})();