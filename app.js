// Ứng dụng chính
class FreeFireEventsApp {
    constructor() {
        this.currentTab = 'ongoing';
        this.searchQuery = '';
        this.filterCategory = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderEvents();
        this.startAutoUpdate();
        this.checkBannerExpiry();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderEvents();
        });

        // Filter category
        document.getElementById('filterCategory').addEventListener('change', (e) => {
            this.filterCategory = e.target.value;
            this.renderEvents();
        });

        // Auto-calculate banner end date
        document.getElementById('eventEndDate').addEventListener('change', (e) => {
            this.autoCalculateBannerEndDate();
        });

        // Close modal on background click
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target === e.target.closest('.modal')) {
                this.closeEventModal();
            }
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });
        
        this.renderEvents();
    }

    getFilteredEvents() {
        let events = [];
        
        switch (this.currentTab) {
            case 'ongoing':
                events = eventManager.getOngoingEvents();
                break;
            case 'upcoming':
                events = eventManager.getUpcomingEvents();
                break;
            default:
                events = eventManager.getAllEvents();
        }
        
        // Apply search filter
        if (this.searchQuery) {
            events = events.filter(event => 
                event.name.toLowerCase().includes(this.searchQuery) ||
                event.description.toLowerCase().includes(this.searchQuery)
            );
        }
        
        // Apply category filter
        if (this.filterCategory !== 'all') {
            events = events.filter(event => event.category === this.filterCategory);
        }
        
        return events;
    }

    renderEvents() {
        const eventsGrid = document.getElementById('eventsGrid');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const noEvents = document.getElementById('noEvents');
        
        // Hiển thị loading
        loadingSpinner.style.display = 'block';
        eventsGrid.innerHTML = '';
        noEvents.style.display = 'none';
        
        setTimeout(() => {
            const events = this.getFilteredEvents();
            
            loadingSpinner.style.display = 'none';
            
            if (events.length === 0) {
                noEvents.style.display = 'block';
                eventsGrid.innerHTML = '';
                return;
            }
            
            events.forEach(event => {
                eventsGrid.appendChild(this.createEventCard(event));
            });
            
            // Update counts
            this.updateTabCounts();
            
            // Start countdown timers
            events.forEach(event => {
                this.startEventCountdown(event);
            });
        }, 300);
    }

    createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.eventId = event.id;
        
        // Xác định trạng thái
        const now = new Date();
        const startDate = new Date(event.eventStartDate);
        const endDate = new Date(event.eventEndDate);
        const isOngoing = startDate <= now && endDate >= now;
        const isUpcoming = startDate > now;
        
        // Tạo HTML cho card
        card.innerHTML = `
            <div class="event-banner">
                ${event.bannerUrl ? 
                    `<img src="${event.bannerUrl}" alt="${event.name}" onerror="this.parentElement.innerHTML='<div class=&quot;banner-placeholder&quot;>ĐANG CẬP NHẬT</div>'">` : 
                    '<div class="banner-placeholder">ĐANG CẬP NHẬT</div>'
                }
                <span class="event-category category-${event.category}">${this.getCategoryLabel(event.category)}</span>
                <span class="event-status ${isOngoing ? 'status-ongoing' : 'status-upcoming'}">
                    ${isOngoing ? 'Đang diễn ra' : 'Sắp diễn ra'}
                </span>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.name}</h3>
                <p class="event-description">${event.description || 'Không có mô tả'}</p>
                
                <div class="event-dates">
                    <div class="event-start">
                        <i class="fas fa-play"></i>
                        <span>Bắt đầu: ${this.formatDisplayDate(event.eventStartDate)}</span>
                    </div>
                    <div class="event-end">
                        <i class="fas fa-stop"></i>
                        <span>Kết thúc: ${this.formatDisplayDate(event.eventEndDate)}</span>
                    </div>
                </div>
                
                <div class="event-countdown">
                    <div class="countdown-label">${isOngoing ? 'Kết thúc trong:' : 'Bắt đầu trong:'}</div>
                    <div class="countdown-timer" id="countdown-${event.id}"></div>
                </div>
                
                <div class="event-actions">
                    <button class="btn-copy-link" onclick="app.copyEventLink('${event.id}')">
                        <i class="fas fa-link"></i> Copy link
                    </button>
                    <button class="btn-edit" onclick="app.editEvent('${event.id}')">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn-delete" onclick="app.deleteEvent('${event.id}')">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    startEventCountdown(event) {
        const now = new Date();
        const startDate = new Date(event.eventStartDate);
        const endDate = new Date(event.eventEndDate);
        
        let targetDate;
        if (startDate > now) {
            targetDate = event.eventStartDate;
        } else if (endDate > now) {
            targetDate = event.eventEndDate;
        } else {
            return;
        }
        
        const elementId = `countdown-${event.id}`;
        countdownManager.startCountdown(event.id, targetDate, elementId, () => {
            // Khi countdown kết thúc, render lại events
            this.renderEvents();
        });
    }

    openAddEventModal() {
        document.getElementById('modalTitle').textContent = 'Thêm Sự Kiện Mới';
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = '';
        document.getElementById('eventModal').style.display = 'block';
    }

    editEvent(eventId) {
        const event = eventManager.events.find(e => e.id === eventId);
        if (!event) return;
        
        document.getElementById('modalTitle').textContent = 'Sửa Sự Kiện';
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventBannerUrl').value = event.bannerUrl || '';
        document.getElementById('eventCategory').value = event.category;
        document.getElementById('bannerStartDate').value = event.bannerStartDate;
        document.getElementById('eventStartDate').value = event.eventStartDate;
        document.getElementById('eventEndDate').value = event.eventEndDate;
        document.getElementById('bannerEndDate').value = event.bannerEndDate || '';
        
        document.getElementById('eventModal').style.display = 'block';
    }

    closeEventModal() {
        document.getElementById('eventModal').style.display = 'none';
    }

    saveEvent(e) {
        e.preventDefault();
        
        const eventId = document.getElementById('eventId').value;
        const eventData = {
            name: document.getElementById('eventName').value,
            description: document.getElementById('eventDescription').value,
            bannerUrl: document.getElementById('eventBannerUrl').value,
            category: document.getElementById('eventCategory').value,
            bannerStartDate: document.getElementById('bannerStartDate').value,
            eventStartDate: document.getElementById('eventStartDate').value,
            eventEndDate: document.getElementById('eventEndDate').value,
            bannerEndDate: document.getElementById('bannerEndDate').value
        };
        
        // Validate dates
        if (new Date(eventData.eventStartDate) > new Date(eventData.eventEndDate)) {
            this.showToast('Thời gian bắt đầu phải trước thời gian kết thúc!', 'error');
            return;
        }
        
        if (eventId) {
            eventManager.updateEvent(eventId, eventData);
            this.showToast('Cập nhật sự kiện thành công!', 'success');
        } else {
            eventManager.addEvent(eventData);
            this.showToast('Thêm sự kiện mới thành công!', 'success');
        }
        
        this.closeEventModal();
        this.renderEvents();
    }

    deleteEvent(eventId) {
        if (confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
            eventManager.deleteEvent(eventId);
            countdownManager.stopCountdown(eventId);
            this.showToast('Xóa sự kiện thành công!', 'success');
            this.renderEvents();
        }
    }

    copyEventLink(eventId) {
        const event = eventManager.events.find(e => e.id === eventId);
        if (!event) return;
        
        const link = event.bannerUrl || 'Đang cập nhật';
        navigator.clipboard.writeText(link).then(() => {
            this.showToast('Đã sao chép link banner!', 'success');
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = link;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('Đã sao chép link banner!', 'success');
        });
    }

    autoCalculateBannerEndDate() {
        const eventEndDate = document.getElementById('eventEndDate').value;
        if (eventEndDate) {
            const bannerEndDate = eventManager.calculateBannerEndDate(eventEndDate);
            document.getElementById('bannerEndDate').value = bannerEndDate;
        }
    }

    startAutoUpdate() {
        // Kiểm tra và cập nhật mỗi phút
        setInterval(() => {
            this.checkBannerExpiry();
            this.renderEvents();
        }, 60000);
    }

    checkBannerExpiry() {
        eventManager.autoRemoveExpiredBanners();
    }

    updateTabCounts() {
        document.getElementById('ongoing-count').textContent = eventManager.getOngoingEvents().length;
        document.getElementById('upcoming-count').textContent = eventManager.getUpcomingEvents().length;
        document.getElementById('all-count').textContent = eventManager.getAllEvents().length;
    }

    getCategoryLabel(category) {
        const labels = {
            'update': 'Cập nhật',
            'event': 'Sự kiện',
            'promotion': 'Khuyến mãi',
            'special': 'Đặc biệt'
        };
        return labels[category] || category;
    }

    formatDisplayDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    refreshEvents() {
        this.renderEvents();
        this.showToast('Đã làm mới dữ liệu sự kiện!', 'info');
    }
}

// Khởi tạo ứng dụng
const app = new FreeFireEventsApp();

// Global functions cho HTML onclick
function openAddEventModal() {
    app.openAddEventModal();
}

function closeEventModal() {
    app.closeEventModal();
}

function saveEvent(e) {
    app.saveEvent(e);
}

function refreshEvents() {
    app.refreshEvents();
}

function filterEvents() {
    // Được gọi từ oninput và onchange trong HTML
}

function copyBannerUrl() {
    const bannerUrl = document.getElementById('eventBannerUrl').value;
    if (bannerUrl) {
        navigator.clipboard.writeText(bannerUrl).then(() => {
            app.showToast('Đã sao chép link banner!', 'success');
        });
    }
}