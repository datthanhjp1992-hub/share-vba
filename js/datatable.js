/**
 * DATATABLE COMPONENT
 * File: datatable.js
 * 
 * Component hiển thị bảng dữ liệu với các tính năng:
 * - Tìm kiếm, sắp xếp, phân trang
 * - Export CSV
 * - Actions (View, Edit, Delete)
 * 
 * Cách sử dụng:
 * 
 * const table = new DataTable('#myTable', {
 *     data: myData,
 *     columns: [
 *         { field: 'id', label: 'ID', sortable: true },
 *         { field: 'name', label: 'Tên', sortable: true },
 *         { field: 'email', label: 'Email' }
 *     ]
 * });
 */

class DataTable {
    constructor(selector, options = {}) {
        this.container = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
        
        if (!this.container) {
            console.error('DataTable: Container not found');
            return;
        }

        // Default options
        this.options = {
            data: [],
            columns: [],
            title: 'Data Table',
            searchable: true,
            sortable: true,
            pagination: true,
            pageSize: 10,
            pageSizeOptions: [5, 10, 25, 50, 100],
            striped: true,
            bordered: false,
            hoverable: true,
            responsive: true,
            showActions: true,
            showExport: false,
            onEdit: null,
            onDelete: null,
            onView: null,
            onAdd: null,
            exportFileName: 'data',
            ...options
        };

        // State
        this.state = {
            filteredData: [...this.options.data],
            currentPage: 1,
            pageSize: this.options.pageSize,
            sortField: null,
            sortDirection: 'asc',
            searchTerm: ''
        };

        this.init();
    }

    init() {
        this.render();
        this.attachEvents();
    }

    render() {
        const wrapper = this.createWrapper();
        this.container.innerHTML = '';
        this.container.appendChild(wrapper);
    }

    createWrapper() {
        const wrapper = document.createElement('div');
        wrapper.className = 'datatable-wrapper';
        wrapper.innerHTML = `
            ${this.createHeader()}
            ${this.createTableContainer()}
            ${this.options.pagination ? this.createFooter() : ''}
        `;
        return wrapper;
    }

    createHeader() {
        return `
            <div class="datatable-header">
                <div class="datatable-title">
                    <i class="fas fa-table"></i>
                    ${this.options.title}
                </div>
                ${this.options.searchable ? `
                    <div class="datatable-search">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Tìm kiếm..." class="datatable-search-input">
                    </div>
                ` : ''}
                <div class="datatable-actions">
                    ${this.options.onAdd ? `
                        <button class="datatable-btn datatable-btn-success btn-add">
                            <i class="fas fa-plus"></i> Thêm mới
                        </button>
                    ` : ''}
                    ${this.options.showExport ? `
                        <button class="datatable-btn datatable-btn-primary btn-export">
                            <i class="fas fa-download"></i> Export
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createTableContainer() {
        if (this.state.filteredData.length === 0) {
            return `
                <div class="datatable-empty">
                    <i class="fas fa-inbox"></i>
                    <h3>Không có dữ liệu</h3>
                    <p>Chưa có dữ liệu để hiển thị</p>
                </div>
            `;
        }

        const tableClasses = [
            'datatable',
            this.options.striped ? 'striped' : '',
            this.options.bordered ? 'bordered' : '',
            this.options.hoverable ? 'hoverable' : ''
        ].filter(Boolean).join(' ');

        const paginatedData = this.getPaginatedData();

        return `
            <div class="datatable-container">
                <table class="${tableClasses}">
                    <thead>
                        <tr>
                            ${this.options.columns.map(col => this.createHeaderCell(col)).join('')}
                            ${this.options.showActions ? '<th class="text-center">Thao tác</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${paginatedData.map(row => this.createRow(row)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    createHeaderCell(column) {
        const sortable = column.sortable !== false && this.options.sortable;
        const sortClass = this.state.sortField === column.field ? this.state.sortDirection : '';
        
        return `
            <th class="${sortable ? 'sortable ' + sortClass : ''}" 
                data-field="${column.field}"
                style="${column.width ? 'width: ' + column.width : ''}">
                ${column.label || column.field}
            </th>
        `;
    }

    createRow(row) {
        return `
            <tr data-id="${row.id || ''}">
                ${this.options.columns.map(col => this.createCell(row, col)).join('')}
                ${this.options.showActions ? this.createActionsCell(row) : ''}
            </tr>
        `;
    }

    createCell(row, column) {
        let value = row[column.field];
        
        // Custom render function
        if (column.render) {
            value = column.render(value, row);
        }
        
        // Format value
        if (column.format === 'date' && value) {
            value = new Date(value).toLocaleDateString('vi-VN');
        } else if (column.format === 'currency' && value) {
            value = new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
            }).format(value);
        } else if (column.format === 'number' && value) {
            value = new Intl.NumberFormat('vi-VN').format(value);
        }

        const align = column.align || 'left';
        
        return `
            <td class="text-${align}" data-label="${column.label || column.field}">
                ${value !== null && value !== undefined ? value : ''}
            </td>
        `;
    }

    createActionsCell(row) {
        const buttons = [];
        
        if (this.options.onView) {
            buttons.push(`<button class="datatable-action-btn btn-view" data-action="view"><i class="fas fa-eye"></i> Xem</button>`);
        }
        if (this.options.onEdit) {
            buttons.push(`<button class="datatable-action-btn btn-edit" data-action="edit"><i class="fas fa-edit"></i> Sửa</button>`);
        }
        if (this.options.onDelete) {
            buttons.push(`<button class="datatable-action-btn btn-delete" data-action="delete"><i class="fas fa-trash"></i> Xóa</button>`);
        }

        return `
            <td class="text-center" data-label="Thao tác">
                <div class="datatable-action-btns">
                    ${buttons.join('')}
                </div>
            </td>
        `;
    }

    createFooter() {
        const totalPages = Math.ceil(this.state.filteredData.length / this.state.pageSize);
        const startIndex = (this.state.currentPage - 1) * this.state.pageSize + 1;
        const endIndex = Math.min(this.state.currentPage * this.state.pageSize, this.state.filteredData.length);

        return `
            <div class="datatable-footer">
                <div class="datatable-info">
                    Hiển thị ${startIndex} - ${endIndex} / ${this.state.filteredData.length} dòng
                </div>
                <div class="datatable-pagesize">
                    Số dòng:
                    <select class="pagesize-select">
                        ${this.options.pageSizeOptions.map(size => 
                            `<option value="${size}" ${size === this.state.pageSize ? 'selected' : ''}>${size}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="datatable-pagination">
                    <button class="datatable-page-btn" data-page="first" ${this.state.currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-angle-double-left"></i>
                    </button>
                    <button class="datatable-page-btn" data-page="prev" ${this.state.currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-angle-left"></i>
                    </button>
                    ${this.createPageButtons(totalPages)}
                    <button class="datatable-page-btn" data-page="next" ${this.state.currentPage === totalPages ? 'disabled' : ''}>
                        <i class="fas fa-angle-right"></i>
                    </button>
                    <button class="datatable-page-btn" data-page="last" ${this.state.currentPage === totalPages ? 'disabled' : ''}>
                        <i class="fas fa-angle-double-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    createPageButtons(totalPages) {
        const buttons = [];
        const maxButtons = 5;
        let startPage = Math.max(1, this.state.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(`
                <button class="datatable-page-btn ${i === this.state.currentPage ? 'active' : ''}" 
                        data-page="${i}">
                    ${i}
                </button>
            `);
        }

        return buttons.join('');
    }

    attachEvents() {
        // Search
        if (this.options.searchable) {
            const searchInput = this.container.querySelector('.datatable-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            }
        }

        // Sort
        if (this.options.sortable) {
            const headers = this.container.querySelectorAll('.datatable th.sortable');
            headers.forEach(header => {
                header.addEventListener('click', () => this.handleSort(header.dataset.field));
            });
        }

        // Pagination
        if (this.options.pagination) {
            const pageButtons = this.container.querySelectorAll('.datatable-page-btn[data-page]');
            pageButtons.forEach(btn => {
                btn.addEventListener('click', () => this.handlePageChange(btn.dataset.page));
            });

            const pageSizeSelect = this.container.querySelector('.pagesize-select');
            if (pageSizeSelect) {
                pageSizeSelect.addEventListener('change', (e) => this.handlePageSizeChange(e.target.value));
            }
        }

        // Actions
        const actionButtons = this.container.querySelectorAll('.datatable-action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const rowData = this.getRowData(row);
                const action = btn.dataset.action;

                if (action === 'edit' && this.options.onEdit) {
                    this.options.onEdit(rowData);
                } else if (action === 'delete' && this.options.onDelete) {
                    this.options.onDelete(rowData);
                } else if (action === 'view' && this.options.onView) {
                    this.options.onView(rowData);
                }
            });
        });

        // Add button
        const addBtn = this.container.querySelector('.btn-add');
        if (addBtn && this.options.onAdd) {
            addBtn.addEventListener('click', () => this.options.onAdd());
        }

        // Export button
        const exportBtn = this.container.querySelector('.btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }

    getRowData(row) {
        const id = row.dataset.id;
        return this.state.filteredData.find(item => item.id == id) || {};
    }

    handleSearch(term) {
        this.state.searchTerm = term.toLowerCase();
        this.filterData();
        this.state.currentPage = 1;
        this.render();
        this.attachEvents();
    }

    handleSort(field) {
        if (this.state.sortField === field) {
            this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortField = field;
            this.state.sortDirection = 'asc';
        }

        this.sortData();
        this.render();
        this.attachEvents();
    }

    handlePageChange(page) {
        const totalPages = Math.ceil(this.state.filteredData.length / this.state.pageSize);

        if (page === 'first') {
            this.state.currentPage = 1;
        } else if (page === 'last') {
            this.state.currentPage = totalPages;
        } else if (page === 'prev' && this.state.currentPage > 1) {
            this.state.currentPage--;
        } else if (page === 'next' && this.state.currentPage < totalPages) {
            this.state.currentPage++;
        } else if (!isNaN(page)) {
            this.state.currentPage = parseInt(page);
        }

        this.render();
        this.attachEvents();
    }

    handlePageSizeChange(size) {
        this.state.pageSize = parseInt(size);
        this.state.currentPage = 1;
        this.render();
        this.attachEvents();
    }

    filterData() {
        this.state.filteredData = this.options.data.filter(row => {
            if (!this.state.searchTerm) return true;

            return this.options.columns.some(col => {
                const value = row[col.field];
                return value && value.toString().toLowerCase().includes(this.state.searchTerm);
            });
        });

        if (this.state.sortField) {
            this.sortData();
        }
    }

    sortData() {
        this.state.filteredData.sort((a, b) => {
            const aVal = a[this.state.sortField];
            const bVal = b[this.state.sortField];

            if (aVal === bVal) return 0;

            const comparison = aVal > bVal ? 1 : -1;
            return this.state.sortDirection === 'asc' ? comparison : -comparison;
        });
    }

    getPaginatedData() {
        if (!this.options.pagination) {
            return this.state.filteredData;
        }

        const startIndex = (this.state.currentPage - 1) * this.state.pageSize;
        const endIndex = startIndex + this.state.pageSize;
        return this.state.filteredData.slice(startIndex, endIndex);
    }

    // ==================== PUBLIC METHODS ====================
    
    updateData(newData) {
        this.options.data = newData;
        this.state.filteredData = [...newData];
        this.state.currentPage = 1;
        this.filterData();
        this.render();
        this.attachEvents();
    }

    refresh() {
        this.filterData();
        this.render();
        this.attachEvents();
    }

    exportData() {
        const csv = this.convertToCSV(this.state.filteredData);
        this.downloadCSV(csv, `${this.options.exportFileName}.csv`);
    }

    convertToCSV(data) {
        const headers = this.options.columns.map(col => col.label || col.field);
        const rows = data.map(row => 
            this.options.columns.map(col => {
                let value = row[col.field] || '';
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            })
        );

        return [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    }

    downloadCSV(csv, filename) {
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataTable;
}

window.DataTable = DataTable;