// Quản lý dữ liệu sự kiện
class EventManager {
    constructor() {
        this.events = [];
        this.storageKey = 'free_fire_events';
        this.loadEvents();
    }

    // Tải sự kiện từ localStorage
    loadEvents() {
        const storedEvents = localStorage.getItem(this.storageKey);
        if (storedEvents) {
            this.events = JSON.parse(storedEvents);
        } else {
            // Dữ liệu mặc định
            this.events = this.getDefaultEvents();
            this.saveEvents();
        }
    }

    // Lưu sự kiện vào localStorage
    saveEvents() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.events));
    }

    // Lấy dữ liệu mặc định
    getDefaultEvents() {
        const now = new Date();
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + 10);
        
        return [
            {
                id: this.generateId(),
                name: "Cập nhật OB45 - Chế độ mới",
                description: "Cập nhật phiên bản OB45 với nhiều tính năng mới",
                bannerUrl: "https://ff.garena.com/images/ob45.jpg",
                category: "update",
                bannerStartDate: this.formatDateTime(now),
                eventStartDate: this.formatDateTime(now),
                eventEndDate: this.formatDateTime(futureDate),
                bannerEndDate: this.calculateBannerEndDate(this.formatDateTime(futureDate)),
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                name: "Sự kiện Đấu Trường Sinh Tồn",
                description: "Tham gia đấu trường để nhận phần thưởng hấp dẫn",
                bannerUrl: "",
                category: "event",
                bannerStartDate: this.formatDateTime(now),
                eventStartDate: this.formatDateTime(futureDate),
                eventEndDate: this.formatDateTime(new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000)),
                bannerEndDate: this.calculateBannerEndDate(this.formatDateTime(new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000))),
                createdAt: new Date().toISOString()
            }
        ];
    }

    // Tạo ID ngẫu nhiên
    generateId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Format datetime
    formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Tính toán ngày xóa banner (sau khi kết thúc 4-5 ngày)
    calculateBannerEndDate(eventEndDate) {
        const endDate = new Date(eventEndDate);
        const daysToAdd = Math.floor(Math.random() * 2) + 4; // 4 hoặc 5 ngày
        endDate.setDate(endDate.getDate() + daysToAdd);
        return this.formatDateTime(endDate);
    }

    // Lấy tất cả sự kiện
    getAllEvents() {
        return this.events;
    }

    // Lấy sự kiện đang diễn ra
    getOngoingEvents() {
        const now = new Date();
        return this.events.filter(event => {
            const startDate = new Date(event.eventStartDate);
            const endDate = new Date(event.eventEndDate);
            return startDate <= now && endDate >= now;
        });
    }

    // Lấy sự kiện sắp diễn ra
    getUpcomingEvents() {
        const now = new Date();
        return this.events.filter(event => {
            const startDate = new Date(event.eventStartDate);
            return startDate > now;
        });
    }

    // Thêm sự kiện mới
    addEvent(eventData) {
        const newEvent = {
            ...eventData,
            id: this.generateId(),
            createdAt: new Date().toISOString()
        };
        this.events.push(newEvent);
        this.saveEvents();
        return newEvent;
    }

    // Cập nhật sự kiện
    updateEvent(eventId, eventData) {
        const index = this.events.findIndex(event => event.id === eventId);
        if (index !== -1) {
            this.events[index] = {
                ...this.events[index],
                ...eventData,
                updatedAt: new Date().toISOString()
            };
            this.saveEvents();
            return this.events[index];
        }
        return null;
    }

    // Xóa sự kiện
    deleteEvent(eventId) {
        this.events = this.events.filter(event => event.id !== eventId);
        this.saveEvents();
    }

    // Tự động xóa banner đã hết hạn
    autoRemoveExpiredBanners() {
        const now = new Date();
        let changed = false;
        
        this.events = this.events.filter(event => {
            const bannerEndDate = new Date(event.bannerEndDate);
            if (bannerEndDate < now) {
                // Banner đã hết hạn
                if (event.bannerUrl) {
                    // Giữ sự kiện nhưng xóa banner
                    event.bannerUrl = '';
                    changed = true;
                }
                return true;
            }
            return true;
        });

        if (changed) {
            this.saveEvents();
        }
    }
}

// Khởi tạo EventManager toàn cục
const eventManager = new EventManager();