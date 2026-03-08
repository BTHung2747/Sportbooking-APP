'use client';

import { Navigation, Loader2, X } from 'lucide-react';

export default function NearbyFilter({ nearbyEnabled, status, onToggle, onReset, count }) {
    return (
        <>
            {/* Checkbox giống hệt các filter khác */}
            <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 14, color: nearbyEnabled ? '#FF5A5F' : '#374151',
                cursor: status === 'loading' ? 'wait' : 'pointer',
                fontWeight: nearbyEnabled ? 600 : 400,
            }}>
                {status === 'loading' ? (
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#FF5A5F', flexShrink: 0 }} />
                ) : (
                    <input
                        type="checkbox"
                        checked={nearbyEnabled}
                        onChange={(e) => onToggle(e.target.checked)}
                        disabled={status === 'loading'}
                        style={{ width: 18, height: 18, accentColor: '#FF5A5F', cursor: 'pointer', flexShrink: 0 }}
                    />
                )}
                <span>Gần tôi nhất</span>
            </label>

            {/* Lỗi bị từ chối định vị */}
            {status === 'denied' && (
                <span style={{ fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <X size={12} /> Hãy cho phép định vị trong trình duyệt
                </span>
            )}

            {/* Badge khi đang lọc */}
            {status === 'granted' && nearbyEnabled && (
                <span style={{
                    fontSize: 12, color: '#059669', display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(5,150,105,0.08)', padding: '3px 10px', borderRadius: 20,
                }}>
                    {count} sân trong 10km ·
                    <button onClick={onReset} style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 12 }}>
                        Bỏ lọc
                    </button>
                </span>
            )}

            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
    );
}