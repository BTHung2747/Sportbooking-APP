'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { venuesAPI, fieldsAPI, uploadAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import styles from './owner.module.css';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

const SERVER_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

const sportTypeLabels = {
    football: '⚽ Bóng đá',
    badminton: '🏸 Cầu lông',
    tennis: '🎾 Tennis',
    basketball: '🏀 Bóng rổ',
    volleyball: '🏐 Bóng chuyền',
    pickleball: '🏓 Pickleball',
};

const statusMap = {
    PENDING: { label: 'Chờ duyệt', class: 'badge-warning', icon: '⏳' },
    APPROVED: { label: 'Đang hoạt động', class: 'badge-success', icon: '✅' },
    REJECTED: { label: 'Bị từ chối', class: 'badge-danger', icon: '❌' },
    SUSPENDED: { label: 'Tạm ngưng', class: 'badge-neutral', icon: '⏸️' },
};

export default function OwnerVenuesPage() {
    const router = useRouter();
    const { user, isAuthenticated, isOwner, loading: authLoading } = useAuth();
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showManage, setShowManage] = useState(null);
    const [form, setForm] = useState({
        name: '', phone: '', address: '', city: '', district: '',
        sportTypes: ['football'], description: '',
        openTime: '06:00', closeTime: '23:00',
        latitude: '', longitude: '', images: [],
    });
    const [mapLocation, setMapLocation] = useState({});

    const handleMapChange = (loc) => {
        setMapLocation(loc);
        setForm(prev => ({
            ...prev,
            address: loc.address || prev.address,
            city: loc.city || prev.city,
            district: loc.district || prev.district,
            latitude: loc.latitude || prev.latitude,
            longitude: loc.longitude || prev.longitude,
        }));
    };
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Field management
    const [showAddField, setShowAddField] = useState(false);
    const [fieldForm, setFieldForm] = useState({
        name: '', sportType: 'football', fieldType: 'STANDARD', capacity: 10,
    });
    const [fieldPricingRows, setFieldPricingRows] = useState([
        { label: 'Giờ thường', startTime: '06:00', endTime: '17:00', price: '' },
    ]);
    const [fieldError, setFieldError] = useState('');
    const [fieldSubmitting, setFieldSubmitting] = useState(false);

    // Edit venue
    const [editVenue, setEditVenue] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editMapLocation, setEditMapLocation] = useState({});
    const [editImageFiles, setEditImageFiles] = useState([]);
    const [editImagePreviews, setEditImagePreviews] = useState([]);
    const [editExistingImages, setEditExistingImages] = useState([]);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState('');

    // Edit field
    const [editingField, setEditingField] = useState(null);
    const [editFieldForm, setEditFieldForm] = useState({});

    // Pricing management
    const [showAddPricing, setShowAddPricing] = useState(null);
    const [pricingForm, setPricingForm] = useState({
        label: '', startTime: '06:00', endTime: '08:00', price: '',
    });
    const [editingPricing, setEditingPricing] = useState(null);
    const [editPricingForm, setEditPricingForm] = useState({});

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isOwner)) {
            router.push('/login');
            return;
        }
        if (isOwner) loadVenues();
    }, [isAuthenticated, isOwner, authLoading]);

    const loadVenues = async () => {
        try {
            const { data } = await venuesAPI.getMyVenues();
            setVenues(data.data.venues);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // Image handling
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles(prev => [...prev, ...files]);
        files.forEach(f => {
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target.result]);
            reader.readAsDataURL(f);
        });
    };
    const removeImage = (idx) => {
        setImageFiles(prev => prev.filter((_, i) => i !== idx));
        setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    };

    // Create venue
    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            let imageUrls = [];
            if (imageFiles.length > 0) {
                const { data: uploadRes } = await uploadAPI.multiple(imageFiles);
                imageUrls = uploadRes.data.urls;
            }
            await venuesAPI.create({
                ...form,
                images: imageUrls,
                latitude: form.latitude ? parseFloat(form.latitude) : null,
                longitude: form.longitude ? parseFloat(form.longitude) : null,
            });
            setShowCreate(false);
            setForm({ name: '', phone: '', address: '', city: '', district: '', sportTypes: ['football'], description: '', openTime: '06:00', closeTime: '23:00', latitude: '', longitude: '', images: [] });
            setImageFiles([]);
            setImagePreviews([]);
            loadVenues();
        } catch (err) {
            setError(err.response?.data?.message || 'Tạo sân thất bại');
        } finally { setSubmitting(false); }
    };

    // Add field + pricing together
    const handleAddField = async (e) => {
        e.preventDefault();
        setFieldSubmitting(true);
        setFieldError('');
        try {
            const { data: fieldRes } = await fieldsAPI.create(showManage, {
                ...fieldForm,
                capacity: parseInt(fieldForm.capacity) || 10,
            });
            const newFieldId = fieldRes.data.field.id;
            // Add pricing rules
            for (const row of fieldPricingRows) {
                if (row.price) {
                    await fieldsAPI.createPricing(newFieldId, {
                        label: row.label,
                        startTime: row.startTime,
                        endTime: row.endTime,
                        price: parseFloat(row.price),
                    });
                }
            }
            setShowAddField(false);
            setFieldForm({ name: '', sportType: 'football', fieldType: 'SINGLE', capacity: 10 });
            setFieldPricingRows([{ label: 'Giờ thường', startTime: '06:00', endTime: '17:00', price: '' }]);
            loadVenues();
        } catch (err) {
            setFieldError(err.response?.data?.message || 'Thêm sân con thất bại');
        } finally { setFieldSubmitting(false); }
    };

    // Toggle field active
    const handleToggleField = async (fieldId, currentActive) => {
        try {
            await fieldsAPI.toggle(fieldId, !currentActive);
            loadVenues();
        } catch (err) { console.error(err); }
    };

    // Delete field
    const handleDeleteField = async (fieldId) => {
        if (!confirm('Bạn có chắc muốn xóa sân con này?')) return;
        try {
            await fieldsAPI.delete(fieldId);
            loadVenues();
        } catch (err) { alert(err.response?.data?.message || 'Xóa thất bại'); }
    };

    // Save edit field
    const handleSaveField = async (fieldId) => {
        try {
            await fieldsAPI.update(fieldId, {
                name: editFieldForm.name,
                sportType: editFieldForm.sportType,
                capacity: parseInt(editFieldForm.capacity) || 10,
            });
            setEditingField(null);
            loadVenues();
        } catch (err) { console.error(err); }
    };

    // Add pricing
    const handleAddPricing = async (e) => {
        e.preventDefault();
        try {
            await fieldsAPI.createPricing(showAddPricing, {
                ...pricingForm,
                price: parseFloat(pricingForm.price),
            });
            setShowAddPricing(null);
            setPricingForm({ label: '', startTime: '06:00', endTime: '08:00', price: '' });
            loadVenues();
        } catch (err) { alert(err.response?.data?.message || 'Thêm giá thất bại'); }
    };

    // Save edit pricing
    const handleSavePricing = async (ruleId) => {
        try {
            await fieldsAPI.updatePricing(ruleId, {
                label: editPricingForm.label,
                startTime: editPricingForm.startTime,
                endTime: editPricingForm.endTime,
                price: parseFloat(editPricingForm.price),
            });
            setEditingPricing(null);
            loadVenues();
        } catch (err) { console.error(err); }
    };

    // Delete pricing
    const handleDeletePricing = async (ruleId) => {
        if (!confirm('Xóa khung giá này?')) return;
        try {
            await fieldsAPI.deletePricing(ruleId);
            loadVenues();
        } catch (err) { alert(err.response?.data?.message || 'Xóa thất bại'); }
    };

    // Open edit venue form
    const handleOpenEdit = (venue) => {
        setEditVenue(venue);
        setEditForm({
            name: venue.name || '',
            phone: venue.phone || '',
            address: venue.address || '',
            city: venue.city || '',
            district: venue.district || '',
            sportTypes: Array.isArray(venue.sportTypes) ? venue.sportTypes : ['football'],
            description: venue.description || '',
            openTime: venue.openTime || '06:00',
            closeTime: venue.closeTime || '23:00',
            latitude: venue.latitude ? String(venue.latitude) : '',
            longitude: venue.longitude ? String(venue.longitude) : '',
        });
        setEditMapLocation({
            latitude: venue.latitude,
            longitude: venue.longitude,
            address: venue.address,
            city: venue.city,
            district: venue.district,
        });
        setEditExistingImages(Array.isArray(venue.images) ? [...venue.images] : []);
        setEditImageFiles([]);
        setEditImagePreviews([]);
        setEditError('');
    };

    const handleEditMapChange = (loc) => {
        setEditMapLocation(loc);
        setEditForm(prev => ({
            ...prev,
            address: loc.address || prev.address,
            city: loc.city || prev.city,
            district: loc.district || prev.district,
            latitude: loc.latitude || prev.latitude,
            longitude: loc.longitude || prev.longitude,
        }));
    };

    const handleEditImageSelect = (e) => {
        const files = Array.from(e.target.files);
        setEditImageFiles(prev => [...prev, ...files]);
        files.forEach(f => {
            const reader = new FileReader();
            reader.onload = (ev) => setEditImagePreviews(prev => [...prev, ev.target.result]);
            reader.readAsDataURL(f);
        });
    };

    const removeEditExistingImage = (idx) => {
        setEditExistingImages(prev => prev.filter((_, i) => i !== idx));
    };
    const removeEditNewImage = (idx) => {
        setEditImageFiles(prev => prev.filter((_, i) => i !== idx));
        setEditImagePreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditSubmitting(true);
        setEditError('');
        try {
            let newUrls = [];
            if (editImageFiles.length > 0) {
                const { data: uploadRes } = await uploadAPI.multiple(editImageFiles);
                newUrls = uploadRes.data.urls;
            }
            const finalImages = [...editExistingImages, ...newUrls];
            await venuesAPI.update(editVenue.id, {
                ...editForm,
                images: finalImages,
                latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
                longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
            });
            setEditVenue(null);
            loadVenues();
        } catch (err) {
            setEditError(err.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDeleteVenue = async (venueId, venueName) => {
        if (!confirm(`Bạn có chắc muốn xóa "${venueName}"?\nTất cả sân con và lịch sử liên quan sẽ bị xóa. Hành động này không thể hoàn tác.`)) return;
        try {
            await venuesAPI.delete(venueId);
            loadVenues();
        } catch (err) {
            alert(err.response?.data?.message || 'Xóa sân thất bại');
        }
    };

    const managedVenue = venues.find(v => v.id === showManage);

    const statusCardClass = {
        APPROVED: styles.statusApproved,
        PENDING: styles.statusPending,
        REJECTED: styles.statusRejected,
        SUSPENDED: styles.statusSuspended,
    };
    const statusOverlayClass = {
        APPROVED: styles.statusOverlayApproved,
        PENDING: styles.statusOverlayPending,
        REJECTED: styles.statusOverlayRejected,
        SUSPENDED: styles.statusOverlaySuspended,
    };

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Page Header */}
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Quản lý sân</h1>
                        <p className={styles.pageSubtitle}>Quản lý khu sân, sân con và bảng giá của bạn</p>
                    </div>
                    <div className={styles.pageHeaderActions}>
                        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                            + Tạo khu sân mới
                        </button>
                    </div>
                </div>

                {/* Summary bar */}
                {!loading && venues.length > 0 && (
                    <div className={styles.summaryBar}>
                        <div className={styles.summaryItem}>
                            🏟️ <strong>{venues.length}</strong> khu sân
                        </div>
                        <div className={styles.summaryItem}>
                            ✅ <strong>{venues.filter(v => v.status === 'APPROVED').length}</strong> hoạt động
                        </div>
                        <div className={styles.summaryItem}>
                            ⏳ <strong>{venues.filter(v => v.status === 'PENDING').length}</strong> chờ duyệt
                        </div>
                        <div className={styles.summaryItem}>
                            ⚽ <strong>{venues.reduce((s, v) => s + (v.fields?.length || 0), 0)}</strong> sân con
                        </div>
                    </div>
                )}

                {/* Venue list */}
                {loading ? (
                    <div className={styles.grid}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={styles.venueCard}>
                                <div className="skeleton" style={{ height: 150, borderRadius: 0 }} />
                                <div style={{ padding: '16px' }}>
                                    <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
                                    <div className="skeleton" style={{ height: 12, width: '80%', marginBottom: 6 }} />
                                    <div className="skeleton" style={{ height: 12, width: '50%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : venues.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🏟️</div>
                        <div className="empty-state-title">Chưa có khu sân nào</div>
                        <div className="empty-state-text">Tạo khu sân đầu tiên để bắt đầu nhận khách</div>
                        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Tạo khu sân →</button>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {venues.map(venue => (
                            <div key={venue.id} className={`${styles.venueCard} ${statusCardClass[venue.status] || ''}`}>

                                {/* Image */}
                                {venue.images?.length > 0 ? (
                                    <div className={styles.venueImages}>
                                        <img src={`${SERVER_URL}${venue.images[0]}`} alt={venue.name} className={styles.venueThumb} />
                                        <div className={styles.imageBadges}>
                                            {venue.images.length > 1 && <span className={styles.imageCount}>+{venue.images.length - 1} ảnh</span>}
                                            <span className={`${styles.statusOverlay} ${statusOverlayClass[venue.status] || ''}`}>
                                                {statusMap[venue.status]?.icon} {statusMap[venue.status]?.label}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.venueImages}>
                                        <div className={styles.venueImagesPlaceholder}>
                                            <span>🏟️</span>Chưa có ảnh
                                        </div>
                                        <div className={styles.imageBadges}>
                                            <span />
                                            <span className={`${styles.statusOverlay} ${statusOverlayClass[venue.status] || ''}`}>
                                                {statusMap[venue.status]?.icon} {statusMap[venue.status]?.label}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Body */}
                                <div className={styles.venueBody}>
                                    <h3 className={styles.venueName}>{venue.name}</h3>

                                    <p className={styles.venueAddr}>
                                        <span className={styles.venueAddrIcon}>📍</span>
                                        {venue.district}, {venue.city}
                                    </p>
                                    {venue.phone && (
                                        <p className={styles.venueAddr}>
                                            <span className={styles.venueAddrIcon}>📞</span>
                                            {venue.phone}
                                        </p>
                                    )}
                                    <p className={styles.venueAddr}>
                                        <span className={styles.venueAddrIcon}>🕐</span>
                                        {venue.openTime} – {venue.closeTime}
                                    </p>

                                    {venue.description && <p className={styles.venueDesc}>{venue.description}</p>}
                                </div>

                                {/* Stats row */}
                                <div className={styles.venueStats}>
                                    <div className={styles.stat}>
                                        <strong>{venue._count?.fields || 0}</strong>
                                        <span>Sân con</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <strong>{venue._count?.reviews || 0}</strong>
                                        <span>Đánh giá</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <strong>{venue.sportTypes?.length || 0}</strong>
                                        <span>Môn</span>
                                    </div>
                                </div>

                                {/* Field chips */}
                                {venue.fields?.length > 0 && (
                                    <div className={styles.fieldsPreview}>
                                        {venue.fields.slice(0, 4).map(f => (
                                            <span key={f.id} className={`${styles.fieldChip} ${!f.isActive ? styles.fieldInactive : ''}`}>
                                                {f.name}
                                            </span>
                                        ))}
                                        {venue.fields.length > 4 && (
                                            <span className={styles.fieldChip} style={{ opacity: 0.6 }}>+{venue.fields.length - 4}</span>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className={styles.venueCardActions}>
                                    <button className={`${styles.cardActionBtn} ${styles.actionManage}`}
                                        onClick={() => setShowManage(venue.id)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                                        </svg>
                                        Quản lý
                                    </button>
                                    <button className={styles.cardActionBtn}
                                        title="Chỉnh sửa" onClick={() => handleOpenEdit(venue)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                        Sửa
                                    </button>
                                    <button className={`${styles.cardActionBtn} ${styles.actionDelete}`}
                                        title="Xóa sân" onClick={() => handleDeleteVenue(venue.id, venue.name)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ===== CREATE VENUE MODAL ===== */}
                {showCreate && (
                    <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="modal-header">
                                <h2 className="heading-sm">Tạo khu sân mới</h2>
                                <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
                            </div>

                            {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>{error}</div>}

                            <form onSubmit={handleCreate}>
                                {/* Images */}
                                <div className="form-group">
                                    <label className="form-label">📷 Ảnh khu sân</label>
                                    <div className={styles.imageUpload}>
                                        {imagePreviews.map((src, i) => (
                                            <div key={i} className={styles.imagePreviewItem}>
                                                <img src={src} alt="" />
                                                <button type="button" className={styles.imageRemove} onClick={() => removeImage(i)}>×</button>
                                            </div>
                                        ))}
                                        <label className={styles.imageAddBtn}>
                                            <input type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
                                            <span>+</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tên khu sân *</label>
                                    <input type="text" className="form-input" placeholder="Sân Bóng Đá ABC" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">📞 SĐT liên hệ</label>
                                    <input type="tel" className="form-input" placeholder="0901234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                                {/* Map Picker - Address */}
                                <div className="form-group">
                                    <label className="form-label">📍 Chọn vị trí trên bản đồ *</label>
                                    <MapPicker
                                        value={mapLocation}
                                        onChange={handleMapChange}
                                        height={300}
                                    />
                                </div>

                                {/* Editable address fields (auto-filled from map) */}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div className="form-group" style={{ flex: 2 }}>
                                        <label className="form-label">Địa chỉ *</label>
                                        <input type="text" className="form-input" placeholder="Tự động điền từ bản đồ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Thành phố *</label>
                                        <input type="text" className="form-input" placeholder="Tự động điền" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Quận/Huyện *</label>
                                        <input type="text" className="form-input" placeholder="Tự động điền" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required />
                                    </div>
                                </div>

                                {/* Sport types */}
                                <div className="form-group">
                                    <label className="form-label">Môn thể thao *</label>
                                    <div className={styles.sportChips}>
                                        {Object.entries(sportTypeLabels).map(([key, label]) => (
                                            <button key={key} type="button"
                                                className={`${styles.sportChip} ${form.sportTypes.includes(key) ? styles.sportChipActive : ''}`}
                                                onClick={() => {
                                                    const types = form.sportTypes.includes(key)
                                                        ? form.sportTypes.filter(t => t !== key)
                                                        : [...form.sportTypes, key];
                                                    if (types.length > 0) setForm({ ...form, sportTypes: types });
                                                }}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Open/Close */}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Giờ mở cửa</label>
                                        <select className="form-input" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })}>
                                            {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Giờ đóng cửa</label>
                                        <select className="form-input" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })}>
                                            {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Mô tả</label>
                                    <textarea className="form-input" placeholder="Giới thiệu về sân..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                                    {submitting ? <span className="spinner" /> : 'Gửi duyệt →'}
                                </button>
                                <p className="caption" style={{ textAlign: 'center', marginTop: 8 }}>
                                    Sau khi admin duyệt, bạn có thể thêm sân con và bảng giá
                                </p>
                            </form>
                        </div>
                    </div>
                )}

                {/* ===== EDIT VENUE MODAL ===== */}
                {editVenue && (
                    <div className="modal-overlay" onClick={() => setEditVenue(null)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '92vh', overflowY: 'auto' }}>
                            <div className="modal-header">
                                <h2 className="heading-sm">✏️ Chỉnh sửa: {editVenue.name}</h2>
                                <button className="modal-close" onClick={() => setEditVenue(null)}>×</button>
                            </div>

                            {editError && (
                                <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
                                    {editError}
                                </div>
                            )}

                            <form onSubmit={handleEditSubmit}>
                                {/* Image management */}
                                <div className="form-group">
                                    <label className="form-label">📷 Ảnh khu sân</label>

                                    {/* Existing images */}
                                    {editExistingImages.length > 0 && (
                                        <div style={{ marginBottom: 8 }}>
                                            <p className="caption" style={{ marginBottom: 6 }}>Ảnh hiện tại (bấm × để xóa)</p>
                                            <div className={styles.imageUpload}>
                                                {editExistingImages.map((url, i) => (
                                                    <div key={i} className={styles.imagePreviewItem}>
                                                        <img src={`${SERVER_URL}${url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button type="button" className={styles.imageRemove} onClick={() => removeEditExistingImage(i)}>×</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* New images to upload */}
                                    <div className={styles.imageUpload}>
                                        {editImagePreviews.map((src, i) => (
                                            <div key={i} className={`${styles.imagePreviewItem} ${styles.imagePreviewNew}`}>
                                                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" className={styles.imageRemove} onClick={() => removeEditNewImage(i)}>×</button>
                                                <span className={styles.newBadge}>Mới</span>
                                            </div>
                                        ))}
                                        <label className={styles.imageAddBtn}>
                                            <input type="file" accept="image/*" multiple onChange={handleEditImageSelect} style={{ display: 'none' }} />
                                            <span>+</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tên khu sân *</label>
                                    <input type="text" className="form-input" value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">📞 SĐT liên hệ</label>
                                    <input type="tel" className="form-input" value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">📍 Cập nhật vị trí (tuỳ chọn)</label>
                                    <MapPicker value={editMapLocation} onChange={handleEditMapChange} height={260} />
                                </div>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div className="form-group" style={{ flex: 2 }}>
                                        <label className="form-label">Địa chỉ *</label>
                                        <input type="text" className="form-input" value={editForm.address}
                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} required />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Thành phố *</label>
                                        <input type="text" className="form-input" value={editForm.city}
                                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} required />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Quận/Huyện *</label>
                                        <input type="text" className="form-input" value={editForm.district}
                                            onChange={(e) => setEditForm({ ...editForm, district: e.target.value })} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Môn thể thao *</label>
                                    <div className={styles.sportChips}>
                                        {Object.entries(sportTypeLabels).map(([key, label]) => (
                                            <button key={key} type="button"
                                                className={`${styles.sportChip} ${editForm.sportTypes?.includes(key) ? styles.sportChipActive : ''}`}
                                                onClick={() => {
                                                    const types = editForm.sportTypes?.includes(key)
                                                        ? editForm.sportTypes.filter(t => t !== key)
                                                        : [...(editForm.sportTypes || []), key];
                                                    if (types.length > 0) setEditForm({ ...editForm, sportTypes: types });
                                                }}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Giờ mở cửa</label>
                                        <select className="form-input" value={editForm.openTime}
                                            onChange={(e) => setEditForm({ ...editForm, openTime: e.target.value })}>
                                            {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Giờ đóng cửa</label>
                                        <select className="form-input" value={editForm.closeTime}
                                            onChange={(e) => setEditForm({ ...editForm, closeTime: e.target.value })}>
                                            {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Mô tả</label>
                                    <textarea className="form-input" rows={3} value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                                </div>

                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditVenue(null)}>
                                        Huỷ
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={editSubmitting}>
                                        {editSubmitting ? <span className="spinner" /> : '💾 Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ===== MANAGE VENUE MODAL ===== */}
                {showManage && managedVenue && (
                    <div className="modal-overlay" onClick={() => { setShowManage(null); setShowAddField(false); setShowAddPricing(null); setEditingField(null); setEditingPricing(null); }}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660, maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="modal-header">
                                <h2 className="heading-sm">⚙️ {managedVenue.name}</h2>
                                <button className="modal-close" onClick={() => { setShowManage(null); setShowAddField(false); setShowAddPricing(null); }}>×</button>
                            </div>

                            <div className={styles.manageSummary}>
                                <span>📍 {managedVenue.address}, {managedVenue.district}</span>
                                <span>🕐 {managedVenue.openTime} - {managedVenue.closeTime}</span>
                            </div>

                            {/* Fields */}
                            <div style={{ marginBottom: 16 }}>
                                <div className="flex-between" style={{ marginBottom: 12 }}>
                                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>Sân con ({managedVenue.fields?.length || 0})</h3>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddField(!showAddField)}>
                                        {showAddField ? 'Đóng' : '+ Thêm sân con'}
                                    </button>
                                </div>

                                {/* Add field form with inline pricing */}
                                {showAddField && (
                                    <div className={styles.inlineForm}>
                                        {fieldError && <div className="form-error" style={{ marginBottom: 8 }}>{fieldError}</div>}
                                        <form onSubmit={handleAddField}>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div className="form-group" style={{ flex: 2 }}>
                                                    <label className="form-label">Tên sân *</label>
                                                    <input type="text" className="form-input" placeholder="Sân 5A..." value={fieldForm.name}
                                                        onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })} required />
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label className="form-label">Sức chứa</label>
                                                    <input type="number" className="form-input" min="2" max="50" value={fieldForm.capacity}
                                                        onChange={(e) => setFieldForm({ ...fieldForm, capacity: e.target.value })} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label className="form-label">Loại sân</label>
                                                    <select className="form-input" value={fieldForm.fieldType}
                                                        onChange={(e) => setFieldForm({ ...fieldForm, fieldType: e.target.value })}>
                                                        <option value="STANDARD">Sân đơn</option>
                                                        <option value="COMBINED">Sân ghép</option>
                                                    </select>
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label className="form-label">Môn thể thao</label>
                                                    <select className="form-input" value={fieldForm.sportType}
                                                        onChange={(e) => setFieldForm({ ...fieldForm, sportType: e.target.value })}>
                                                        {Object.entries(sportTypeLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Inline pricing rows */}
                                            <div style={{ marginTop: 8 }}>
                                                <label className="form-label">💰 Bảng giá</label>
                                                {fieldPricingRows.map((row, idx) => (
                                                    <div key={idx} className={styles.pricingInputRow}>
                                                        <input type="text" className="form-input" placeholder="Tên" value={row.label}
                                                            onChange={(e) => { const r = [...fieldPricingRows]; r[idx].label = e.target.value; setFieldPricingRows(r); }}
                                                            style={{ flex: 1.5 }} />
                                                        <select className="form-input" value={row.startTime}
                                                            onChange={(e) => { const r = [...fieldPricingRows]; r[idx].startTime = e.target.value; setFieldPricingRows(r); }}
                                                            style={{ flex: 1 }}>
                                                            {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                        <span>→</span>
                                                        <select className="form-input" value={row.endTime}
                                                            onChange={(e) => { const r = [...fieldPricingRows]; r[idx].endTime = e.target.value; setFieldPricingRows(r); }}
                                                            style={{ flex: 1 }}>
                                                            {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                        <input type="number" className="form-input" placeholder="VNĐ/h" value={row.price}
                                                            onChange={(e) => { const r = [...fieldPricingRows]; r[idx].price = e.target.value; setFieldPricingRows(r); }}
                                                            style={{ flex: 1.2 }} />
                                                        {fieldPricingRows.length > 1 && (
                                                            <button type="button" className={styles.removeBtn}
                                                                onClick={() => setFieldPricingRows(fieldPricingRows.filter((_, i) => i !== idx))}>×</button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" className="btn btn-ghost btn-sm"
                                                    onClick={() => setFieldPricingRows([...fieldPricingRows, { label: '', startTime: '06:00', endTime: '08:00', price: '' }])}>
                                                    + Thêm khung giá
                                                </button>
                                            </div>

                                            <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} disabled={fieldSubmitting}>
                                                {fieldSubmitting ? <span className="spinner" /> : 'Tạo sân con'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Existing fields */}
                                {managedVenue.fields?.length === 0 ? (
                                    <div className={styles.emptyFields}>📋 Chưa có sân con. Thêm sân con để bắt đầu nhận đặt.</div>
                                ) : (
                                    <div className={styles.fieldsList}>
                                        {managedVenue.fields?.map(field => (
                                            <div key={field.id} className={`${styles.fieldItem} ${!field.isActive ? styles.fieldItemInactive : ''}`}>
                                                <div className={styles.fieldItemHeader}>
                                                    {editingField === field.id ? (
                                                        <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                                                            <input className="form-input" value={editFieldForm.name} style={{ flex: 1, padding: '4px 8px', fontSize: 13 }}
                                                                onChange={(e) => setEditFieldForm({ ...editFieldForm, name: e.target.value })} />
                                                            <button className="btn btn-primary btn-sm" onClick={() => handleSaveField(field.id)}>💾</button>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingField(null)}>✕</button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div style={{ flex: 1 }}>
                                                                <strong>{field.isActive ? '⚽' : '⏸️'} {field.name}</strong>
                                                                <span className="caption"> • {sportTypeLabels[field.sportType]?.split(' ').slice(1).join(' ') || field.sportType} • {field.capacity || '?'}p</span>
                                                            </div>
                                                            <div className={styles.fieldActions}>
                                                                {/* Toggle */}
                                                                <button className={`${styles.toggleBtn} ${field.isActive ? styles.toggleActive : ''}`}
                                                                    onClick={() => handleToggleField(field.id, field.isActive)}
                                                                    title={field.isActive ? 'Tắt hoạt động' : 'Bật hoạt động'}>
                                                                    <span className={styles.toggleDot} />
                                                                </button>
                                                                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingField(field.id); setEditFieldForm({ name: field.name, sportType: field.sportType, capacity: field.capacity }); }}>✏️</button>
                                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteField(field.id)}>🗑️</button>
                                                                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddPricing(showAddPricing === field.id ? null : field.id)}>+ 💰</button>
                                                                <button className="btn btn-primary btn-sm"
                                                                    title="Cấu hình bảng giá nâng cao"
                                                                    onClick={() => router.push(`/owner/pricing/${field.id}?name=${encodeURIComponent(field.name)}&venue=${encodeURIComponent(managedVenue.name)}&venueId=${managedVenue.id}&sport=${field.sportType}`)}>
                                                                    📊
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Pricing */}
                                                {field.pricingRules?.length > 0 && (
                                                    <div className={styles.pricingList}>
                                                        {field.pricingRules.map(rule => (
                                                            <div key={rule.id} className={styles.pricingRow}>
                                                                {editingPricing === rule.id ? (
                                                                    <div className={styles.pricingEditRow}>
                                                                        <input className="form-input" value={editPricingForm.label} placeholder="Tên" style={{ flex: 1, padding: '3px 6px', fontSize: 12 }}
                                                                            onChange={(e) => setEditPricingForm({ ...editPricingForm, label: e.target.value })} />
                                                                        <input className="form-input" value={editPricingForm.startTime} style={{ width: 60, padding: '3px 6px', fontSize: 12 }}
                                                                            onChange={(e) => setEditPricingForm({ ...editPricingForm, startTime: e.target.value })} />
                                                                        <span>→</span>
                                                                        <input className="form-input" value={editPricingForm.endTime} style={{ width: 60, padding: '3px 6px', fontSize: 12 }}
                                                                            onChange={(e) => setEditPricingForm({ ...editPricingForm, endTime: e.target.value })} />
                                                                        <input className="form-input" type="number" value={editPricingForm.price} style={{ width: 80, padding: '3px 6px', fontSize: 12 }}
                                                                            onChange={(e) => setEditPricingForm({ ...editPricingForm, price: e.target.value })} />
                                                                        <button className="btn btn-primary btn-sm" onClick={() => handleSavePricing(rule.id)}>💾</button>
                                                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingPricing(null)}>✕</button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span>{rule.label || 'Khung giờ'}</span>
                                                                        <span className="caption">{rule.startTime} - {rule.endTime}</span>
                                                                        <strong style={{ color: 'var(--primary)' }}>{Number(rule.price).toLocaleString('vi-VN')}đ/h</strong>
                                                                        <div style={{ display: 'flex', gap: 2 }}>
                                                                            <button className={styles.miniBtn} onClick={() => { setEditingPricing(rule.id); setEditPricingForm({ label: rule.label || '', startTime: rule.startTime, endTime: rule.endTime, price: Number(rule.price) }); }}>✏️</button>
                                                                            <button className={styles.miniBtn} onClick={() => handleDeletePricing(rule.id)}>🗑️</button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add pricing inline */}
                                                {showAddPricing === field.id && (
                                                    <form onSubmit={handleAddPricing} className={styles.inlineForm} style={{ marginTop: 8, padding: 12 }}>
                                                        <div className={styles.pricingInputRow}>
                                                            <input type="text" className="form-input" placeholder="Tên khung" value={pricingForm.label}
                                                                onChange={(e) => setPricingForm({ ...pricingForm, label: e.target.value })} style={{ flex: 1.5 }} />
                                                            <select className="form-input" value={pricingForm.startTime} style={{ flex: 1 }}
                                                                onChange={(e) => setPricingForm({ ...pricingForm, startTime: e.target.value })}>
                                                                {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                            <span>→</span>
                                                            <select className="form-input" value={pricingForm.endTime} style={{ flex: 1 }}
                                                                onChange={(e) => setPricingForm({ ...pricingForm, endTime: e.target.value })}>
                                                                {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                            <input type="number" className="form-input" placeholder="VNĐ/h" value={pricingForm.price}
                                                                onChange={(e) => setPricingForm({ ...pricingForm, price: e.target.value })} style={{ flex: 1.2 }} required />
                                                            <button type="submit" className="btn btn-primary btn-sm">Thêm</button>
                                                        </div>
                                                    </form>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
