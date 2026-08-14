// Quản lý đếm ngược thời gian
class CountdownManager {
    constructor() {
        this.timers = new Map();
    }

    // Bắt đầu đếm ngược cho một sự kiện
    startCountdown(eventId, targetDate, elementId, onComplete = null) {
        // Xóa timer cũ nếu có
        this.stopCountdown(eventId);
        
        const target = new Date(targetDate).getTime();
        const element = document.getElementById(elementId);
        
        if (!element) return;
        
        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = target - now;
            
            if (distance < 0) {
                // Hết thời gian
                element.innerHTML = "Đã kết thúc";
                if (onComplete) {
                    onComplete();
                }
                this.stopCountdown(eventId);
                return;
            }
            
            // Tính toán thời gian còn lại
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            // Format hiển thị
            let display = '';
            if (days > 0) {
                display = `${days} ngày ${hours} giờ`;
            } else if (hours > 0) {
                display = `${hours} giờ ${minutes} phút`;
            } else if (minutes > 0) {
                display = `${minutes} phút ${seconds} giây`;
            } else {
                display = `${seconds} giây`;
            }
            
            element.innerHTML = display;
        };
        
        // Cập nhật ngay lập tức
        updateCountdown();
        
        // Cập nhật mỗi giây
        const timer = setInterval(updateCountdown, 1000);
        
        // Lưu timer
        this.timers.set(eventId, timer);
    }

    // Dừng đếm ngược
    stopCountdown(eventId) {
        const timer = this.timers.get(eventId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(eventId);
        }
    }

    // Dừng tất cả timer
    stopAllCountdowns() {
        this.timers.forEach((timer) => {
            clearInterval(timer);
        });
        this.timers.clear();
    }
}

// Khởi tạo CountdownManager toàn cục
const countdownManager = new CountdownManager();