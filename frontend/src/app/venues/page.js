'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { venuesAPI } from '@/lib/api';
import { MapPin, Star, Heart, ChevronLeft, ChevronRight, Car, Wifi, Lock, UtensilsCrossed } from 'lucide-react';
import styles from './venues.module.css';
import PageFooter from '../../components/PageFooter';
import NearbyFilter from '../../components/NearbyFilter';
import { useNearby, applyNearbyFilter } from '../../components/useNearby';

const SERVER_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

const SportIcons = {
    all: <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>,
    football: <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6l3 4-1 4H10l-1-4z"/><path d="M12 6V2"/><path d="M15 10l5-2"/><path d="M14 14l3 5"/><path d="M10 14l-3 5"/><path d="M9 10L4 8"/></svg>,
    badminton: <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 18v4"/><path d="M10 22h4"/><path d="M12 14c-4 0-6-4-6-8h12c0 4-2 8-6 8z"/><path d="M9 6v2"/><path d="M12 6v2"/><path d="M15 6v2"/></svg>,
    tennis: <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M6 5.3a9 9 0 0 1 0 13.4"/><path d="M18 5.3a9 9 0 0 0 0 13.4"/></svg>,
    basketball: <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2v20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    swimming: <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6 0 1.2.2 1.8.6l1.2.9c.5.4 1 .6 1.5.6s1-.2 1.5-.6l1.2-.9C9.8 6.2 10.4 6 11 6s1.2.2 1.8.6l1.2.9c.5.4 1 .6 1.5.6s1-.2 1.5-.6l1.2-.9C18.8 6.2 19.4 6 20 6"/><path d="M2 12c.6 0 1.2.2 1.8.6l1.2.9c.5.4 1 .6 1.5.6s1-.2 1.5-.6l1.2-.9c.6-.4 1.2-.6 1.8-.6s1.2.2 1.8.6l1.2.9c.5.4 1 .6 1.5.6s1-.2 1.5-.6l1.2-.9c.6-.4 1.2-.6 1.8-.6"/><path d="M2 18c.6 0 1.2.2 1.8.6l1.2.9c.5.4 1 .6 1.5.6s1-.2 1.5-.6l1.2-.9c.6-.4 1.2-.6 1.8-.6s1.2.2 1.8.6l1.2.9c.5.4 1 .6 1.5.6s1-.2 1.5-.6l1.2-.9c.6-.4 1.2-.6 1.8-.6"/></svg>
};

export default function VenuesPage() {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ address: '', sportType: '' });
    const [activeSport, setActiveSport] = useState('football');
    const [sortBy, setSortBy] = useState('relevant');

    const { userLocation, nearbyEnabled, status, toggle, reset } = useNearby();

    const sportTypes = [
        { value: '', label: 'Tất cả môn', icon: SportIcons.all },
        { value: 'football', label: 'Bóng đá', icon: SportIcons.football },
        { value: 'badminton', label: 'Cầu lông', icon: SportIcons.badminton },
        { value: 'tennis', label: 'Tennis', icon: SportIcons.tennis },
        { value: 'basketball', label: 'Bóng rổ', icon: SportIcons.basketball },
        { value: 'swimming', label: 'Bơi lội', icon: SportIcons.swimming },
    ];
    // khi filters thay doi goi lai api theo dieu kien moi
    useEffect(() => { loadVenues(); }, [filters]);

    // Khi bật gần tôi thì sort
    useEffect(() => {
        if (nearbyEnabled) setSortBy('nearest');
        else setSortBy('relevant');
    }, [nearbyEnabled]);

    const loadVenues = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.sportType) params.sportType = filters.sportType;
            const { data } = await venuesAPI.list(params);
            setVenues(data.data.venues);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getSportIcon = (t) => sportTypes.find(s => s.value === t)?.icon || SportIcons.all;
    const getSportLabel = (t) => sportTypes.find(s => s.value === t)?.label || t;
    const getSportLabel1 = (t) => sportTypes.find(s => s.value === t)?.value || t;
    const getSportTagClass = (t) => {
        const map = { badminton: styles.tagYellow, tennis: styles.tagYellow, football: styles.tagBlue, basketball: styles.tagRed, swimming: styles.tagCyan };
        return map[t] || styles.tagGray;
    };
    const displayedVenues = applyNearbyFilter(venues, userLocation, nearbyEnabled, sortBy, filters.address);

    return (
        <div className={styles.page}>
            {/* Hero */}
            <div className={styles.hero}>
                <h1 className={styles.heroTitle}>Tìm sân thể thao gần bạn</h1>
                <p className={styles.heroSubtitle}>Khám phá và đặt sân dễ dàng từ hơn 1000+ địa điểm trên toàn quốc</p>
                <div className={styles.searchBar}>
                    <div className={styles.searchSport}>
                        <span className={styles.searchIcon}>{getSportIcon(filters.sportType)}</span>
                        <select value={filters.sportType} onChange={(e) => setFilters({ ...filters, sportType: e.target.value })}>
                            {sportTypes.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                        </select>
                    </div>
                    <div className={styles.searchDivider} />
                    <div className={styles.searchLocation}>
                        <MapPin size={20} />
                        <input
                            type="text"
                            placeholder="Tìm theo địa chỉ , quận ,thành phố..."
                            value={filters.address}
                            onChange={(e) => setFilters({ ...filters, address: e.target.value })}
                        />
                    </div>
                    <button className={styles.searchButton} onClick={loadVenues}>Tìm kiếm</button>
                </div>
            </div>

            <div className={styles.container}>
                {/* Sport Tabs */}
                <div className={styles.sportFilters}>
                    {sportTypes.slice(1).map(st => (
                        <button
                            key={st.value}
                            className={`${styles.sportTab} ${activeSport === st.value ? styles.sportTabActive : ''}`}
                            onClick={() => { setActiveSport(st.value); setFilters({ ...filters, sportType: st.value }); }}
                        >
                            <span className={styles.sportTabIcon}>{st.icon}</span>
                            {st.label}
                        </button>
                    ))}
                </div>

                {/* Quick Filters — NearbyFilter tách riêng */}
                <div className={styles.quickFilters}>
                    <NearbyFilter
                        nearbyEnabled={nearbyEnabled}
                        status={status}
                        userLocation={userLocation}
                        onToggle={toggle}
                        onReset={reset}
                        count={displayedVenues.length}
                    />
                    <label className={styles.quickFilter}>
                        <input type="checkbox" /><span>Giá tốt nhất</span>
                    </label>
                    <label className={styles.quickFilter}>
                        <input type="checkbox" /><span>Đánh giá cao</span>
                    </label>
                    <label className={styles.quickFilter}>
                        <input type="checkbox" /><span>Ưu đãi hôm nay</span>
                    </label>
                </div>

                {/* Results Bar */}
                <div className={styles.resultsBar}>
                    <div className={styles.resultsCount}>
                        Tìm thấy <strong>{displayedVenues.length}</strong> sân phù hợp
                        {nearbyEnabled && (
                            <span style={{ marginLeft: 8, fontSize: 13, color: '#10B981', fontWeight: 500 }}>
                                · trong bán kính 10km
                            </span>
                        )}
                    </div>
                    
                </div>

                {/* Grid */}
                {loading ? (
                    <div className={styles.grid}>
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={styles.skeletonImage} />
                                <div className={styles.skeletonBody}>
                                    <div className={styles.skeletonLine} style={{ width: '70%' }} />
                                    <div className={styles.skeletonLine} style={{ width: '50%' }} />
                                    <div className={styles.skeletonLine} style={{ width: '40%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayedVenues.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📍</div>
                        <h3 className={styles.emptyTitle}>
                            {nearbyEnabled ? 'Không có sân nào trong bán kính 10km' : 'Chưa có sân nào'}
                        </h3>
                        <p className={styles.emptyText}>
                            {nearbyEnabled ? 'Thử tắt bộ lọc "Gần tôi nhất" để xem tất cả sân' : 'Thử thay đổi bộ lọc hoặc tìm ở khu vực khác'}
                        </p>
                        {nearbyEnabled && (
                            <button onClick={reset} style={{ marginTop: 16, padding: '10px 24px', background: '#FF5A5F', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                                Xem tất cả sân
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {displayedVenues.map(venue => (
                            <Link key={venue.id} href={`/venues/${venue.id}`} className={styles.venueCard}>
                                <div className={styles.venueImage}>
                                    {venue.images?.length > 0 ? (
                                        <img src={`${SERVER_URL}${venue.images[0]}`} alt={venue.name} />
                                    ) : (
                                        <div className={styles.venuePlaceholder}>{getSportIcon(venue.sportTypes?.[0])}</div>
                                    )}
                                    <div className={styles.statusBadge}>Đang hoạt động</div>
                                    {venue.distance !== null && (
                                        <div style={{
                                            position: 'absolute', bottom: 12, left: 12,
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            background: 'rgba(0,0,0,0.6)', color: 'white',
                                            padding: '4px 10px', borderRadius: 20,
                                            fontSize: 12, fontWeight: 600, backdropFilter: 'blur(4px)'
                                        }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                                            {venue.distance.toFixed(1)} km
                                        </div>
                                    )}
                                    <button className={styles.heartButton} onClick={e => e.preventDefault()}>
                                        <Heart size={20} />
                                    </button>
                                </div>
                                <div className={styles.venueBody}>
                                    <h3 className={styles.venueName}>{venue.name}</h3>
                                    <div className={styles.venueRating}>
                                        {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#FFC107" color="#FFC107" />)}
                                        <span className={styles.ratingValue}>{venue.avgRating?.toFixed(1) || '0.0'}</span>
                                        <span className={styles.reviewCount}>({venue.reviewCount || 0})</span>
                                    </div>
                                    <div className={styles.venueInfo}>
                                        <span>{getSportLabel(venue.sportTypes?.[0])}</span>
                                        <span className={styles.infoDivider}>|</span>
                                        <span>{venue.fields?.length || 0} sân khả dụng</span>
                                    </div>
                                    <div className={styles.venueLocation}>
                                        <MapPin size={14} />
                                        <span>{venue.address}, {venue.district}, {venue.city}</span>
                                    </div>
                                    <div className={styles.venueAmenities}>
                                        <Car size={20} /><Wifi size={20} /><Lock size={20} /><UtensilsCrossed size={20} />
                                    </div>
                                    <div className={styles.sportTags}>
                                        <span className={getSportTagClass(venue.sportTypes?.[0])}>
                                            {getSportLabel1(venue.sportTypes?.[0])}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && displayedVenues.length > 0 && (
                    <div className={styles.pagination}>
                        <button className={styles.pageArrow}><ChevronLeft size={20} /></button>
                        <button className={`${styles.pageNum} ${styles.pageActive}`}>1</button>
                        <button className={styles.pageArrow}><ChevronRight size={20} /></button>
                        <div className={styles.pageInfo}>Hiển thị {displayedVenues.length} sân</div>
                    </div>
                )}

                <div className={styles.promoBanner}>
                    <div className={styles.promoIcon}>{SportIcons.football}</div>
                    <div className={styles.promoContent}>
                        <h3>Giảm đến 30% cho lần đặt đầu tiên</h3>
                        <p>Đăng ký ngay để nhận ưu đãi đặt sân hấp dẫn</p>
                    </div>
                    <button className={styles.promoButton}>Đăng ký ngay</button>
                </div>
            </div>
            <PageFooter />
        </div>
    );
}