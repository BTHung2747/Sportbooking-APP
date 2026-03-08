import { useState, useCallback } from 'react';

// ─────────────────────────────────────────────
// 1. Tính khoảng cách giữa 2 tọa độ (km)
// ─────────────────────────────────────────────
export function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // bán kính Trái Đất (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────
// 2. Lọc + sort danh sách venues
//    - gắn khoảng cách vào mỗi venue
//    - lọc nearby 10km (nếu bật)
//    - lọc theo địa chỉ (nếu có nhập)
//    - sort theo nearbyEnabled/sortBy
// ─────────────────────────────────────────────
export function applyNearbyFilter(venues, userLocation, nearbyEnabled, sortBy, addressKeyword = '') {

    // Bước 1: gắn distance vào từng venue
    const withDistance = venues.map((v) => {
        const vLat = v.latitude != null ? parseFloat(v.latitude) : null;
        const vLng = v.longitude != null ? parseFloat(v.longitude) : null;
        const distance =
            userLocation && vLat != null && !isNaN(vLat) && vLng != null && !isNaN(vLng)
                ? haversineDistance(userLocation.lat, userLocation.lng, vLat, vLng)
                : null;
        return { ...v, distance };
    });

    // Bước 2: lọc nearby ≤ 10km (nếu nearbyEnabled = true)
    const nearbyFiltered = nearbyEnabled
        ? withDistance.filter(v => v.distance !== null && v.distance <= 10)
        : withDistance;

    // Bước 3: lọc theo địa chỉ user nhập vào ô tìm kiếm
    const addressFiltered = nearbyFiltered.filter(v => {
        if (!addressKeyword) return true; // ô trống → hiện tất cả
        const keyword = addressKeyword.toLowerCase();
        return (
            v.address?.toLowerCase().includes(keyword)  ||  // tìm trong tên đường
            v.district?.toLowerCase().includes(keyword) ||  // tìm trong quận/phường
            v.city?.toLowerCase().includes(keyword)         // tìm trong thành phố
        );
    });

    // Bước 4: sort
    return [...addressFiltered].sort((a, b) => {
        if (sortBy === 'nearest') {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;  // không có tọa độ → xuống cuối
            if (b.distance === null) return -1;
            return a.distance - b.distance;     // gần nhất lên đầu
        }
        if (sortBy === 'rating') return (b.avgRating ?? 0) - (a.avgRating ?? 0); // cao nhất lên đầu
        return 0; // relevant → giữ nguyên thứ tự API
    });
}

// ─────────────────────────────────────────────
// 3. Custom Hook — quản lý state định vị
// ─────────────────────────────────────────────
export function useNearby() {
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyEnabled, setNearbyEnabled] = useState(false);
    const [status, setStatus] = useState('idle');
    // status:
    //  'idle'    → chưa làm gì
    //  'loading' → đang xin quyền / chờ GPS
    //  'granted' → đã có tọa độ
    //  'denied'  → bị từ chối hoặc lỗi

    // Xin vị trí từ trình duyệt
    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus('denied'); // trình duyệt không hỗ trợ
            return;
        }
        setStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                // Thành công → lưu tọa độ, bật filter
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setNearbyEnabled(true);
                setStatus('granted');
            },
            () => {
                // Thất bại (từ chối hoặc timeout)
                setStatus('denied');
                setNearbyEnabled(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    // Xử lý khi user tick/bỏ tick checkbox
    const toggle = useCallback((checked) => {
        if (!checked) {
            setNearbyEnabled(false); // bỏ tick → tắt filter, giữ vị trí cũ
            return;
        }
        if (userLocation) {
            setNearbyEnabled(true);  // đã có vị trí → bật luôn, không xin lại
            return;
        }
        requestLocation(); // chưa có vị trí → đi xin
    }, [userLocation, requestLocation]);

    // Nút "Bỏ lọc"
    const reset = useCallback(() => {
        setNearbyEnabled(false);
        setStatus('idle');
    }, []);

    return { userLocation, nearbyEnabled, status, toggle, reset };
}