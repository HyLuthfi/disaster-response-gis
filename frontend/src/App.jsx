import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ScaleControl, LayersControl, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Navigation, Truck, Activity, Search, Filter, Map, Settings, Layers, Building2, BarChart2, FileText, Radio, Package, Users, Clock, Target, MessageSquare, CheckCircle, XCircle, Info, Plus, Globe, Bell, X, Eye, EyeOff, User, LogOut, Trash2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import LoginScreen from './components/LoginScreen';

// Dummy Images untuk membuat UI lebih hidup (SaaS Grade)
const dummyImagesArmada = {
  'Excavator': 'https://images.unsplash.com/photo-1541888081622-10f769741e97?auto=format&fit=crop&w=150&q=80',
  'Dump Truck': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=150&q=80',
  'Ambulans': 'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?auto=format&fit=crop&w=150&q=80',
  'Kendaraan Logistik': 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=150&q=80',
  'Crane': 'https://images.unsplash.com/photo-1504307651254-35680f356fce?auto=format&fit=crop&w=150&q=80',
  'default': 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=150&q=80'
};

const dummyImagesFasilitas = {
  'Rumah Sakit': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=150&q=80',
  'Puskesmas': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=150&q=80',
  'Posko': 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=150&q=80',
  'Tempat Evakuasi': 'https://images.unsplash.com/photo-1576089172869-4f5f6f315620?auto=format&fit=crop&w=150&q=80',
  'default': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=150&q=80'
};

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fungsi untuk menghitung jarak menggunakan Haversine Formula (dalam km)
function getDistance(lat1, lon1, lat2, lon2) {
  if(!lat1 || !lon1 || !lat2 || !lon2) return 999999;
  const R = 6371; // Radius bumi
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Icon Kustom untuk Posko Induk (GPS Live Style)
const poskoIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;">
      <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="20" fill="rgba(37, 99, 235, 0.2)" class="animate-ping" style="transform-origin: center;" />
        <circle cx="24" cy="24" r="12" fill="rgba(37, 99, 235, 0.4)" class="animate-pulse" style="transform-origin: center;" />
        <circle cx="24" cy="24" r="8" fill="#2563eb" stroke="white" stroke-width="2.5" />
      </svg>
    </div>
  `,
  iconSize: [64, 64],
  iconAnchor: [32, 32],
  popupAnchor: [0, -20],
});

// Icon Kustom Dinamis untuk Armada Alat Berat/Satgas
const getTruckIcon = (nama = '', jenis = '') => {
  const isAmbulance = (jenis && (jenis.includes('Ambulans') || jenis.includes('Medis'))) || (nama && (nama.includes('Medis') || nama.includes('Ambulance') || nama.includes('RS')));
  const isDamkar = (jenis && jenis.includes('Pemadam')) || (nama && nama.includes('Damkar'));
  const isPerson = (nama && (nama.includes('Satgas') || nama.includes('Relawan')) && !isAmbulance && !isDamkar) || (jenis && (jenis.includes('Personil') || jenis.includes('Orang')));
  
  let borderColor = 'border-primary';
  let strokeColor = '#2563eb';
  
  if (isAmbulance) {
    borderColor = 'border-danger';
    strokeColor = '#ef4444';
  } else if (isDamkar || isPerson) {
    borderColor = 'border-orange-500';
    strokeColor = '#f97316';
  }

  return L.divIcon({
    className: 'bg-transparent',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 group">
        <div class="absolute inset-0 bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.15)] flex items-center justify-center border-2 ${borderColor} group-hover:scale-110 transition-transform duration-300 overflow-hidden">
           ${isAmbulance
             ? `<img src="/icons/icon_ambulance.png" class="w-full h-full object-cover" alt="Ambulans" />`
             : isPerson
             ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>`
             : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                  <path d="M15 18H9"/>
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14v10h1"/>
                  <circle cx="17" cy="18" r="2"/>
                  <circle cx="7" cy="18" r="2"/>
               </svg>`
           }
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
};

// Icon Kustom Dinamis untuk Fasilitas Darurat/Instansi
const getBuildingIcon = (nama = '', jenis = '') => {
  const isHealth = (jenis && (jenis.includes('Rumah Sakit') || jenis.includes('Kesehatan') || jenis.includes('Puskesmas'))) || (nama && (nama.includes('RS') || nama.includes('Medis') || nama.includes('Klinik')));
  const isDamkar = (jenis && jenis.includes('Pemadam')) || (nama && nama.includes('Damkar'));
  
  let borderColor = 'border-warning';
  let strokeColor = '#f59e0b';
  
  if (isHealth) {
    borderColor = 'border-danger';
    strokeColor = '#ef4444';
  } else if (isDamkar) {
    borderColor = 'border-orange-500';
    strokeColor = '#f97316';
  }

  let svgContent = `
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M9 22v-4h6v4"></path>
    <path d="M8 6h.01"></path>
    <path d="M16 6h.01"></path>
    <path d="M12 6h.01"></path>
    <path d="M12 10h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 10h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M8 14h.01"></path>
  `;

  if (isHealth) {
    // Custom Image Used below
  } else if (isDamkar) {
    svgContent = `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>`;
  }

  return L.divIcon({
    className: 'bg-transparent',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 group">
        <div class="absolute inset-0 bg-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.15)] flex items-center justify-center border-2 ${borderColor} group-hover:scale-110 transition-transform duration-300 overflow-hidden">
           ${isHealth 
             ? `<img src="/icons/icon_RS.jpg" class="w-full h-full object-cover" alt="RS" />`
             : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  ${svgContent}
               </svg>`
           }
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
};

// Icon Kustom untuk Bencana Pending (Titik Kuning)
const bencanaPendingIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <div class="relative flex items-center justify-center w-12 h-12 group">
      <!-- Mega Pulse Effect -->
      <div class="absolute w-[300%] h-[300%] bg-warning/40 rounded-full animate-ping z-0" style="animation-duration: 1.5s;"></div>
      <div class="absolute w-[180%] h-[180%] bg-warning/30 rounded-full animate-pulse z-0" style="animation-duration: 2s;"></div>
      
      <!-- Core Icon -->
      <div class="relative w-10 h-10 bg-warning rounded-full shadow-[0_0_30px_rgba(245,158,11,1)] flex items-center justify-center border-2 border-white z-10 group-hover:scale-110 transition-transform">
         <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
         </svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

// Icon Kustom untuk Bencana (Titik Merah)
const bencanaIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <div class="relative flex items-center justify-center w-12 h-12 group">
      <!-- Mega Pulse Effect -->
      <div class="absolute w-[300%] h-[300%] bg-danger/40 rounded-full animate-ping z-0" style="animation-duration: 1.5s;"></div>
      <div class="absolute w-[180%] h-[180%] bg-danger/30 rounded-full animate-pulse z-0" style="animation-duration: 2s;"></div>
      
      <!-- Core Icon -->
      <div class="relative w-10 h-10 bg-danger rounded-full shadow-[0_0_30px_rgba(239,68,68,1)] flex items-center justify-center border-2 border-white z-10 group-hover:scale-110 transition-transform">
         <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
         </svg>
      </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -26],
});

function FocusButton({ center, currentUser, alatBerat, fasilitas, markerRefs }) {
  const map = useMap();
  
  const handleFocus = () => {
    let targetLoc = center;
    let targetZoom = 14;
    let popupToOpen = null;

    if (currentUser?.role === 'Public') {
      targetLoc = [-5.7350, 105.5900];
      targetZoom = 17;
    } else if (currentUser && currentUser.instansi_name) {
      const instansiLower = currentUser.instansi_name.toLowerCase();
      
      const myArmada = alatBerat?.find(a => 
        (a.instansi_pemilik && a.instansi_pemilik.toLowerCase().includes(instansiLower)) ||
        (a.nama && a.nama.toLowerCase().includes(instansiLower))
      );
      
      const myFasilitas = !myArmada ? fasilitas?.find(f => 
        f.nama && f.nama.toLowerCase().includes(instansiLower)
      ) : null;

      if (myArmada) {
        const lat = myArmada?.geometry?.coordinates?.[1];
        const lon = myArmada?.geometry?.coordinates?.[0];
        if (lat && lon) {
          targetLoc = [lat, lon];
          targetZoom = 17;
          popupToOpen = `armada-${myArmada.id}`;
        }
      } else if (myFasilitas) {
        const lat = myFasilitas?.geometry?.coordinates?.[1];
        const lon = myFasilitas?.geometry?.coordinates?.[0];
        if (lat && lon) {
          targetLoc = [lat, lon];
          targetZoom = 17;
          popupToOpen = `fasilitas-${myFasilitas.id}`;
        }
      }
    }
    
    map.flyTo(targetLoc, targetZoom, { duration: 1.5 });
    
    if (popupToOpen && markerRefs && markerRefs.current[popupToOpen]) {
      setTimeout(() => {
        const marker = markerRefs.current[popupToOpen];
        if (marker) marker.openPopup();
      }, 1500); // Wait for flyTo animation
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-[1000]">
      <button 
        onClick={handleFocus}
        className="w-12 h-12 bg-white rounded-xl shadow-floating border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors group"
        title="Lokasi Saya / Posko Utama"
      >
        <Target size={24} className="group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}

// Komponen untuk Toggle Hide Offline (Square Right Button)
function ToggleOfflineButton({ hideOffline, setHideOffline }) {
  return (
    <div className="absolute bottom-24 right-6 z-[1000]">
      <button 
        onClick={(e) => { e.stopPropagation(); setHideOffline(!hideOffline); }}
        className={`w-12 h-12 rounded-2xl shadow-floating flex flex-col items-center justify-center gap-0.5 transition-all group border ${
          hideOffline 
            ? 'bg-primary text-white border-primary hover:bg-primary/90 shadow-[0_4px_15px_rgba(37,99,235,0.3)]' 
            : 'bg-white text-slate-600 border-slate-100 hover:text-primary hover:bg-slate-50'
        }`}
        title={hideOffline ? 'Tampilkan Semua Fasilitas' : 'Sembunyikan Fasilitas Offline'}
      >
        <Building2 size={20} className="group-hover:-translate-y-0.5 transition-transform" />
        <span className="text-[7px] font-black tracking-widest uppercase opacity-80">
          {hideOffline ? 'Siaga' : 'Semua'}
        </span>
      </button>
    </div>
  );
}

// Komponen untuk memaksa pengaturan Zoom maksimal
function MapZoomSetup() {
  const map = useMap();
  useEffect(() => {
    map.setMaxZoom(24);
  }, [map]);
  return null;
}

// Komponen untuk otomatis flyTo ketika lokasi dipilih dari Sidebar
function MapFlyTo({ focus, markerRefs }) {
  const map = useMap();
  useEffect(() => {
    if (focus && focus.lat && focus.lon) {
      map.flyTo([focus.lat, focus.lon], 16, { duration: 1.5 });
      if (focus.id && focus.type && markerRefs && markerRefs.current) {
        setTimeout(() => {
          const marker = markerRefs.current[`${focus.type}-${focus.id}`];
          if (marker) marker.openPopup();
        }, 300);
      }
    }
  }, [focus, map, markerRefs]);
  return null;
}

// Komponen untuk menangani event klik peta
function MapEventsSetup({ isTutupMode, onMapClick }) {
  useMapEvents({
    click(e) {
      if (isTutupMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [alatBerat, setAlatBerat] = useState([]);
  const [fasilitas, setFasilitas] = useState([]);
  const [bencana, setBencana] = useState([]);
  const [pesanPublik, setPesanPublik] = useState([]);
  const [logistik, setLogistik] = useState([]);
  const [rute, setRute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [isFormLaporanOpen, setIsFormLaporanOpen] = useState(false);
  const [isDaruratModalOpen, setIsDaruratModalOpen] = useState(false);
  const mapRef = useRef(null);
  const [selectedBencanaRelawan, setSelectedBencanaRelawan] = useState(null);
  const [relawanSubTab, setRelawanSubTab] = useState('list');
  const [relawanData, setRelawanData] = useState([]);
  const [relawanPesan, setRelawanPesan] = useState([]);
  const [isLoadingRelawan, setIsLoadingRelawan] = useState(false);
  const [inputRelawanChat, setInputRelawanChat] = useState('');
  const [joinedBencanaIds, setJoinedBencanaIds] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState('general');
  const [isTutupMode, setIsTutupMode] = useState(false);
  const [jalanTertutupList, setJalanTertutupList] = useState([]);
  const [hideOffline, setHideOffline] = useState(false);
  const [focusedLocation, setFocusedLocation] = useState(null);
  const markerRefs = useRef({});
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [targetBencanaForDispatch, setTargetBencanaForDispatch] = useState(null);
  const [incomingDispatch, setIncomingDispatch] = useState(null);

  const [sysSettings, setSysSettings] = useState({
    distanceUnit: 'km',
    mapQuality: 'standard',
    showLabels: false,
    animateRoute: true
  });

  const [animatedTruckPos, setAnimatedTruckPos] = useState(null);
  const [movingArmadaId, setMovingArmadaId] = useState(null);
  const animationRef = useRef(null);

  // Fungsi Global untuk Notifikasi (Toast)
  const addToast = (msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  
  // State Navigasi
  const [activeTab, setActiveTab] = useState('armada');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // State untuk pencarian dan filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [sortByArmada, setSortByArmada] = useState('default');
  
  const [searchFasilitas, setSearchFasilitas] = useState('');
  const [filterJenisFasilitas, setFilterJenisFasilitas] = useState('Semua');
  const [sortByFasilitas, setSortByFasilitas] = useState('default');
  const [hiddenArmadas, setHiddenArmadas] = useState({});
  const [activeStatusMenu, setActiveStatusMenu] = useState(null);
  const [armadaStatus, setArmadaStatus] = useState({});

  const center = [-5.7331, 105.5898]; // Kalianda, Lamsel

  useEffect(() => {
    Promise.all([
      fetch('http://127.0.0.1:8000/api/alat-berat').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/fasilitas').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/bencana').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/pesan-publik').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/logistik').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/jalan-tertutup').then(res => res.json()).catch(() => ({data: []}))
    ]).then(([resAlat, resFasilitas, resBencana, resPesan, resLogistik, resJalan]) => {
      const alatData = resAlat?.data || [];
      const fasData = resFasilitas?.data || [];
      setAlatBerat(alatData);
      setFasilitas(fasData);
      setBencana(resBencana?.data || []);
      setPesanPublik(resPesan?.data || []);
      setLogistik(resLogistik?.data || []);
      setJalanTertutupList(resJalan?.data || []);
      setIsLoadingList(false);
      addToast("Sistem tersinkronisasi dengan database satelit", "success");

      // Auto-focus location on login
      if (currentUser) {
        let lat, lon, focusId, focusType;
        if (currentUser.role === 'Satgas') {
          const myArmada = alatData.find(a => a.nama?.toLowerCase().includes(currentUser.username?.toLowerCase() || ''));
          if (myArmada && myArmada.geometry?.coordinates) {
            lat = myArmada.geometry.coordinates[1];
            lon = myArmada.geometry.coordinates[0];
            focusId = myArmada.id;
            focusType = 'armada';
          }
        } else if (currentUser.role === 'Instansi') {
          const myFas = fasData.find(f => f.nama === currentUser.instansi_name);
          if (myFas && myFas.geometry?.coordinates) {
            lat = myFas.geometry.coordinates[1];
            lon = myFas.geometry.coordinates[0];
            focusId = myFas.id;
            focusType = 'fasilitas';
          }
        }
        if (lat && lon) {
          setTimeout(() => {
            setFocusedLocation({ lat, lon, id: focusId, type: focusType });
          }, 1000);
        }
      }
    }).catch(err => {
      console.error(err);
      setIsLoadingList(false);
      addToast("Gagal menyinkronkan data", "error");
    });
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'Instansi') {
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/dispatch/me?instansi=${encodeURIComponent(currentUser.instansi_name)}`);
          const data = await res.json();
          if (data.status === 'success' && data.data) {
            setIncomingDispatch(data.data);
          } else {
            setIncomingDispatch(null);
          }
        } catch (e) {}
      }, 3000);
      return () => clearInterval(poll);
    }
  }, [currentUser]);

  const activeSatgasDispatchIdRef = useRef(null);

  useEffect(() => {
    if (currentUser && currentUser.role === 'Satgas') {
      // Use alatBerat directly to avoid ReferenceError, as safeAlatBerat is defined lower down
      const myArmada = (Array.isArray(alatBerat) ? alatBerat : []).find(a => a.nama?.toLowerCase().includes(currentUser.username?.toLowerCase() || ''));
      if (myArmada) {
        const poll = setInterval(async () => {
          try {
            const res = await fetch(`http://127.0.0.1:8000/api/dispatch/satgas/${myArmada.id}`);
            const data = await res.json();
            if (data.status === 'success' && data.data) {
              const dispatch = data.data;
              if (activeSatgasDispatchIdRef.current !== dispatch.id) {
                activeSatgasDispatchIdRef.current = dispatch.id;
                if (dispatch.lat && dispatch.lon) {
                  handleCariRute(dispatch.lat, dispatch.lon, true, myArmada.id);
                }
              }
            }
          } catch (e) {}
        }, 3000);
        return () => clearInterval(poll);
      }
    }
  }, [currentUser, alatBerat]);

  // Polling data Bencana agar update secara real-time di semua layar
  useEffect(() => {
    const pollBencana = setInterval(async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/bencana');
        const data = await res.json();
        if (data.status === 'success') {
          setBencana(data.data || []);
        }
      } catch (e) {}
    }, 5000);
    return () => clearInterval(pollBencana);
  }, []);

  // Polling data Alat Berat (Armada) agar status dan lokasi sinkron di semua layar
  useEffect(() => {
    const pollAlatBerat = setInterval(async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/alat-berat');
        const data = await res.json();
        if (data.status === 'success') {
          setAlatBerat(data.data || []);
        }
      } catch (e) {}
    }, 5000);
    return () => clearInterval(pollAlatBerat);
  }, []);

  const activeGlobalDispatchIdsRef = useRef(new Set());

  // Polling untuk mendeteksi penugasan aktif (dispatch) yang sedang berjalan agar animasi peta sinkron di semua user
  useEffect(() => {
    const pollActive = setInterval(async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/dispatch/active');
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          data.data.forEach(dispatch => {
            if (!activeGlobalDispatchIdsRef.current.has(dispatch.id)) {
              activeGlobalDispatchIdsRef.current.add(dispatch.id);
              if (dispatch.lat && dispatch.lon && dispatch.assigned_armada_id) {
                // Hindari memanggil handleCariRute ganda jika Satgas lokal sudah memanggilnya
                if (activeSatgasDispatchIdRef.current !== dispatch.id) {
                  // Panggil route menggunakan armada_id spesifik sebagai origin
                  handleCariRute(dispatch.lat, dispatch.lon, true, dispatch.assigned_armada_id);
                }
              }
            }
          });
        }
      } catch (e) {}
    }, 5000);
    return () => clearInterval(pollActive);
  }, []);

  const handleVerifyLaporan = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/laporan/${id}/verifikasi`, { method: 'PUT' });
      if (res.ok) {
        addToast("Laporan berhasil diverifikasi!", "success");
        setBencana(prev => prev.map(b => b.id === id ? { ...b, status: 'Aktif' } : b));
      } else {
        addToast("Gagal memverifikasi laporan", "error");
      }
    } catch (err) {
      addToast("Kesalahan server", "error");
    }
  };

  const handleDeleteLaporan = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/laporan/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast("Laporan berhasil dibatalkan/ditolak", "success");
        setBencana(prev => prev.filter(b => b.id !== id));
      } else {
        addToast("Gagal menghapus laporan", "error");
      }
    } catch (err) {
      addToast("Kesalahan server", "error");
    }
  };

  // === Handler Relawan ===
  const handleSelectBencanaRelawan = async (item) => {
    setSelectedBencanaRelawan(item);
    setRelawanSubTab('list');
    setIsLoadingRelawan(true);
    try {
      const resRel = await fetch(`http://127.0.0.1:8000/api/bencana/${item.id}/relawan`).then(r => r.json());
      setRelawanData(resRel?.data || []);
      const resPesan = await fetch(`http://127.0.0.1:8000/api/bencana/${item.id}/pesan`).then(r => r.json());
      setRelawanPesan(resPesan?.data || []);
    } catch (err) {
      console.error(err);
      addToast("Gagal mengambil data relawan", "error");
    } finally {
      setIsLoadingRelawan(false);
    }
  };

  const handleJoinRelawan = async () => {
    if (!selectedBencanaRelawan || !currentUser) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/bencana/${selectedBencanaRelawan.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: currentUser?.full_name || currentUser?.username,
          peran: currentUser?.role,
          instansi: currentUser?.instansi_name || 'Personal',
          img_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        })
      }).then(r => r.json());
      
      if (res.status === 'success') {
        setJoinedBencanaIds(prev => [...prev, selectedBencanaRelawan.id]);
        if (res.data) {
          setRelawanData(prev => [...prev, res.data]);
        }
        
        // Update local count so UI reflects the new member immediately
        setSelectedBencanaRelawan(prev => ({
          ...prev,
          relawan_count: parseInt(prev.relawan_count || 0) + 1
        }));
        setBencana(prev => prev.map(b => 
          b.id === selectedBencanaRelawan.id 
            ? { ...b, relawan_count: parseInt(b.relawan_count || 0) + 1 }
            : b
        ));

        addToast('Berhasil bergabung dengan grup tugas!', 'success');
      }
    } catch (error) {
      console.error(error);
      addToast('Gagal bergabung', 'error');
    }
  };

  const handleKirimPesanRelawan = async () => {
    if (!inputRelawanChat.trim() || !selectedBencanaRelawan) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/bencana/${selectedBencanaRelawan.id}/pesan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: currentUser ? (currentUser.full_name || currentUser.username) : "Anonim",
          sender_role: currentUser ? currentUser.role : "Sistem",
          sender_role_detail: currentUser?.instansi_name || "",
          message: inputRelawanChat,
          jarak_str: "0 m"
        })
      }).then(r => r.json());
      
      if (res.status === 'success') {
        setRelawanPesan(prev => [...prev, res.data]);
        setInputRelawanChat('');
        addToast('Instruksi terkirim ke regu', 'success');
      }
    } catch (error) {
      console.error(error);
      addToast("Gagal mengirim pesan", "error");
    }
  };

  const handleTutupJalanMapClick = async (lat, lon) => {
    addToast("Mencari ruas jalan terdekat untuk ditutup...", "info");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/tutup-jalan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon, radius: 50 })
      }).then(r => r.json());

      if (res.status === 'success') {
        addToast(res.message, "success");
        // Refetch closed roads
        const resJalan = await fetch('http://127.0.0.1:8000/api/jalan-tertutup').then(r => r.json());
        setJalanTertutupList(resJalan?.data || []);
      } else {
        addToast(res.detail || "Gagal menutup jalan", "error");
      }
    } catch (error) {
      console.error(error);
      addToast("Koneksi server gagal", "error");
    }
  };

  const handleBukaJalan = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/buka-jalan/${id}`, { method: 'POST' }).then(r => r.json());
      if (res.status === 'success') {
        addToast(res.message, "success");
        setJalanTertutupList(prev => prev.filter(j => j.id !== id));
      }
    } catch (error) {
      addToast("Gagal membuka jalan", "error");
    }
  };

  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  const alatBeratRef = useRef(alatBerat);
  useEffect(() => { alatBeratRef.current = alatBerat; }, [alatBerat]);

  const handleCariRute = async (lat, lon, isEvakuasi = false, customStartArmadaId = null) => {
    setLoading(true);
    
    let start_lat = -5.7330;
    let start_lon = 105.5897;
    let originLabel = "posko";

    if (customStartArmadaId) {
      const myArmada = alatBeratRef.current.find(a => a.id.toString() === customStartArmadaId.toString());
      if (myArmada && myArmada.geometry?.coordinates) {
        start_lon = myArmada.geometry.coordinates[0];
        start_lat = myArmada.geometry.coordinates[1];
        originLabel = myArmada.nama;
        setMovingArmadaId(myArmada.id);
      }
    } else if (currentUserRef.current?.role === 'Public') {
      start_lat = -5.7350;
      start_lon = 105.5900;
      originLabel = "lokasi Anda";
    } else if (currentUserRef.current && currentUserRef.current.instansi_name) {
      const instansiLower = currentUserRef.current.instansi_name.toLowerCase();
      const myArmada = alatBeratRef.current.find(a => 
        (a.instansi_pemilik && a.instansi_pemilik.toLowerCase().includes(instansiLower)) ||
        (a.nama && a.nama.toLowerCase().includes(instansiLower))
      );
      if (myArmada && myArmada.geometry?.coordinates) {
        start_lon = myArmada.geometry.coordinates[0];
        start_lat = myArmada.geometry.coordinates[1];
        originLabel = myArmada.nama;
        setMovingArmadaId(myArmada.id);
      } else {
        setMovingArmadaId(null);
      }
    }

    addToast(`Mengalkulasi rute dari ${originLabel}...`, "info");
    try {
      
      const res = await fetch(`http://127.0.0.1:8000/api/rute?start_lon=${start_lon}&start_lat=${start_lat}&end_lon=${lon}&end_lat=${lat}`);
      const data = await res.json();
      
      if(data.status === 'success') {
        if (data.data.length > 0) {
          const lines = data.data.map(d => {
            const coords = d.geometry.coordinates;
            return coords.map(c => [c[1], c[0]]);
          });
          setRute(lines);
          
          let cost = data.total_cost || 0;
          let unit = "km";
          if (sysSettings.distanceUnit === 'mi') {
             cost = (cost * 0.621371).toFixed(2);
             unit = "mil";
          }
          addToast(`Rute darurat ditemukan (${cost} ${unit})`, "success");

          if (sysSettings.animateRoute && isEvakuasi) {
            const flatPath = [];
            lines.forEach(segment => segment.forEach(pt => flatPath.push(pt)));
            if (flatPath.length > 0) {
              setAnimatedTruckPos(flatPath[0]);
              if (animationRef.current) clearInterval(animationRef.current);
              
              let currentIdx = 0;
              // 20ms interval, move 1 point at a time for smoothness
              animationRef.current = setInterval(() => {
                currentIdx += 1;
                if (currentIdx < flatPath.length) {
                  setAnimatedTruckPos(flatPath[currentIdx]);
                } else {
                  setAnimatedTruckPos(flatPath[flatPath.length - 1]);
                  clearInterval(animationRef.current);
                  addToast("Armada Utama telah tiba di lokasi insiden!", "success");
                }
              }, 25);
            }
          } else {
            setAnimatedTruckPos(null);
            setMovingArmadaId(null);
          }
        } else if (data.start_node === data.end_node) {
          setRute(null);
          setAnimatedTruckPos(null);
          setMovingArmadaId(null);
          if (animationRef.current) clearInterval(animationRef.current);
          addToast("Armada sudah berada sangat dekat dengan lokasi insiden!", "success");
        } else {
          setRute(null);
          setAnimatedTruckPos(null);
          setMovingArmadaId(null);
          if (animationRef.current) clearInterval(animationRef.current);
          addToast("Akses terputus! Tidak ada rute alternatif ke lokasi ini.", "error");
        }
      } else {
        setRute(null);
        setAnimatedTruckPos(null);
        setMovingArmadaId(null);
        if (animationRef.current) clearInterval(animationRef.current);
        addToast("Akses terputus! Tidak ada rute alternatif ke lokasi ini.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Gagal mengambil rute dari server", "error");
    } finally {
      setLoading(false);
    }
  };

  // Logika Filter Data dengan proteksi
  const safeAlatBerat = Array.isArray(alatBerat) ? alatBerat : [];
  
  const filteredAlatBerat = useMemo(() => {
    let result = safeAlatBerat.filter(item => {
      const nama = item?.nama || '';
      const jenis = item?.jenis || '';
      const matchSearch = nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = filterJenis === 'Semua' || jenis === filterJenis;
      return matchSearch && matchFilter;
    });

    if (sortByArmada === 'terdekat') {
      result = result.sort((a, b) => {
         const latA = a.geometry?.coordinates[1];
         const lonA = a.geometry?.coordinates[0];
         const latB = b.geometry?.coordinates[1];
         const lonB = b.geometry?.coordinates[0];
         const distA = getDistance(-5.7330, 105.5897, latA, lonA); // Posko Induk
         const distB = getDistance(-5.7330, 105.5897, latB, lonB);
         return distA - distB;
      });
    }
    return result;
  }, [safeAlatBerat, searchQuery, filterJenis, sortByArmada]);

  // Daftar unik jenis armada untuk filter dropdown
  const jenisUnik = ['Semua', ...new Set(safeAlatBerat.map(item => item?.jenis).filter(Boolean))];

  // Logika Filter Data Fasilitas dengan proteksi dan injeksi status "Tutup" untuk mockup
  const safeFasilitasRaw = Array.isArray(fasilitas) ? fasilitas : [];
  const safeFasilitas = safeFasilitasRaw.map((f, idx) => ({
    ...f,
    status: (idx % 4 === 0 && f.jenis !== 'Posko Utama') ? 'Tutup' : 'Siaga' // Simulasi sebagian tempat tutup
  }));
  
  const filteredFasilitas = useMemo(() => {
    let result = safeFasilitas.filter(item => {
      const nama = item?.nama || '';
      const jenis = item?.jenis || '';
      const matchSearch = nama.toLowerCase().includes(searchFasilitas.toLowerCase());
      const matchFilter = filterJenisFasilitas === 'Semua' || jenis === filterJenisFasilitas;
      return matchSearch && matchFilter;
    });

    if (sortByFasilitas === 'terdekat') {
      result = result.sort((a, b) => {
         const latA = a.geometry?.coordinates[1];
         const lonA = a.geometry?.coordinates[0];
         const latB = b.geometry?.coordinates[1];
         const lonB = b.geometry?.coordinates[0];
         const distA = getDistance(-5.7330, 105.5897, latA, lonA); // Posko Induk
         const distB = getDistance(-5.7330, 105.5897, latB, lonB);
         return distA - distB;
      });
    }
    return result;
  }, [safeFasilitas, searchFasilitas, filterJenisFasilitas, sortByFasilitas]);

  // Daftar unik jenis fasilitas untuk filter dropdown
  const jenisFasilitasUnik = ['Semua', ...new Set(safeFasilitas.map(item => item?.jenis).filter(Boolean))];

  // Handler klik mini navbar
  const handleNavClick = (tabName) => {
    if (tabName === 'map') {
      setIsSidebarOpen(false);
      setActiveTab('map');
      return;
    }
    
    if (activeTab === tabName) {
      setIsSidebarOpen(!isSidebarOpen); // Toggle tutup jika di-klik 2x
    } else {
      setActiveTab(tabName);
      setIsSidebarOpen(true); // Buka jika klik tab berbeda
    }
  };

  const filteredBencana = useMemo(() => {
    return bencana.filter(item => {
      if (currentUser?.role !== 'Public') return true;
      if (item.status !== 'Menunggu' && item.status !== 'Pending') return true;
      const currentUserName = currentUser?.full_name || currentUser?.username;
      return item.pelapor === currentUserName;
    });
  }, [bencana, currentUser]);

  // Authentication Check
  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background font-sans overflow-hidden">
      
      {/* GLOBAL TOP HEADER */}
      <header className="h-14 flex-shrink-0 bg-surface border-b border-border flex items-center justify-between px-5 z-[60] shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
            <ShieldAlert size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight leading-none">DARLAM <span className="text-primary font-black">GIS</span></h1>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-xs font-semibold text-muted">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
            </span>
            <span>Server Online</span>
          </div>

          <div className="px-3 py-1 bg-background rounded-md border border-border">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* TOASTS NOTIFICATION LAYER */}
      <div className="absolute top-16 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-floating border ${
                t.type === 'success' ? 'bg-success/10 border-success/20' : 
                t.type === 'error' ? 'bg-danger/10 border-danger/20' : 
                'bg-primary/10 border-primary/20'
              } backdrop-blur-md min-w-[280px] bg-white/90`}
            >
              {t.type === 'success' ? <CheckCircle size={20} className="text-success shrink-0" /> : 
               t.type === 'error' ? <XCircle size={20} className="text-danger shrink-0" /> : 
               <Info size={20} className="text-primary shrink-0" />}
               <p className="text-sm font-bold text-foreground">{t.msg}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative overflow-hidden bg-gray-100">

        {/* WADAH FLOATING SIDEBAR */}
        <div className="absolute top-4 left-4 bottom-4 z-[50] flex gap-3 pointer-events-none">
          
          {/* 1. PRIMARY MINI NAVBAR (Floating Glassmorphism) */}
          <nav className="w-16 bg-white/80 backdrop-blur-xl border border-white/60 shadow-floating rounded-3xl flex flex-col items-center py-5 pointer-events-auto overflow-hidden">
        {/* Menu Items */}
        <div className="flex flex-col gap-3 w-full px-2 mt-4 items-center">
          
          {/* Menu Peta (1) */}
          <button 
            onClick={() => handleNavClick('map')}
            className={`relative p-3 w-full flex justify-center rounded-2xl transition-colors duration-300 ${activeTab === 'map' ? 'text-white z-10' : 'text-slate-400 hover:text-primary hover:bg-slate-100/50'}`}
            title="Peta Utama"
          >
            {activeTab === 'map' && (
              <motion.div layoutId="active-nav-bg" className="absolute inset-0 bg-primary rounded-2xl shadow-lg shadow-primary/30 -z-10" initial={false} transition={{ type: "spring", stiffness: 350, damping: 25 }} />
            )}
            <Map size={22} strokeWidth={activeTab === 'map' ? 2.5 : 2} className="relative z-10" />
          </button>

          {/* Menu Infrastruktur (2) */}
          <button 
            onClick={() => handleNavClick('infrastruktur')}
            className={`relative p-3 w-full flex justify-center rounded-2xl transition-colors duration-300 ${activeTab === 'infrastruktur' ? 'text-white z-10' : 'text-slate-400 hover:text-primary hover:bg-slate-100/50'}`}
            title="Fasilitas Darurat"
          >
            {activeTab === 'infrastruktur' && (
              <motion.div layoutId="active-nav-bg" className="absolute inset-0 bg-primary rounded-2xl shadow-lg shadow-primary/30 -z-10" initial={false} transition={{ type: "spring", stiffness: 350, damping: 25 }} />
            )}
            <Building2 size={22} strokeWidth={activeTab === 'infrastruktur' ? 2.5 : 2} className="relative z-10" />
          </button>

          {/* Menu Armada (3) */}
          <button 
            onClick={() => handleNavClick('armada')}
            className={`relative p-3 w-full flex justify-center rounded-2xl transition-colors duration-300 ${activeTab === 'armada' ? 'text-white z-10' : 'text-slate-400 hover:text-primary hover:bg-slate-100/50'}`}
            title="Armada Darurat"
          >
            {activeTab === 'armada' && (
              <motion.div layoutId="active-nav-bg" className="absolute inset-0 bg-primary rounded-2xl shadow-lg shadow-primary/30 -z-10" initial={false} transition={{ type: "spring", stiffness: 350, damping: 25 }} />
            )}
            <Truck size={22} strokeWidth={activeTab === 'armada' ? 2.5 : 2} className="relative z-10" />
          </button>

          {/* Menu Logistik (4) */}
          <button 
            onClick={() => handleNavClick('logistik')}
            className={`hidden relative p-3 w-full justify-center rounded-2xl transition-colors duration-300 ${activeTab === 'logistik' ? 'text-white z-10' : 'text-slate-400 hover:text-primary hover:bg-slate-100/50'}`}
            title="Ketersediaan Logistik"
          >
            {activeTab === 'logistik' && (
              <motion.div layoutId="active-nav-bg" className="absolute inset-0 bg-primary rounded-2xl shadow-lg shadow-primary/30 -z-10" initial={false} transition={{ type: "spring", stiffness: 350, damping: 25 }} />
            )}
            <Package size={22} strokeWidth={activeTab === 'logistik' ? 2.5 : 2} className="relative z-10" />
          </button>

          {/* Menu Log Bencana (5, sebelumnya Laporan) */}
          <button 
            onClick={() => handleNavClick('laporan')}
            className={`relative p-3 w-full flex justify-center rounded-2xl transition-colors duration-300 ${activeTab === 'laporan' ? 'text-white z-10' : 'text-slate-400 hover:text-primary hover:bg-slate-100/50'}`}
            title="Laporan Masuk"
          >
            {activeTab === 'laporan' && (
              <motion.div layoutId="active-nav-bg" className="absolute inset-0 bg-primary rounded-2xl shadow-lg shadow-primary/30 -z-10" initial={false} transition={{ type: "spring", stiffness: 350, damping: 25 }} />
            )}
            <FileText size={22} strokeWidth={activeTab === 'laporan' ? 2.5 : 2} className="relative z-10" />
          </button>

          {/* Menu Chat Publik (6, sebelumnya Komunikasi) */}
          <button 
            onClick={() => handleNavClick('komunikasi')}
            className={`relative p-3 w-full flex justify-center rounded-2xl transition-colors duration-300 ${activeTab === 'komunikasi' ? 'text-white z-10' : 'text-slate-400 hover:text-primary hover:bg-slate-100/50'}`}
            title="Pusat Koordinasi"
          >
            {activeTab === 'komunikasi' && (
              <motion.div layoutId="active-nav-bg" className="absolute inset-0 bg-primary rounded-2xl shadow-lg shadow-primary/30 -z-10" initial={false} transition={{ type: "spring", stiffness: 350, damping: 25 }} />
            )}
            <MessageSquare size={22} strokeWidth={activeTab === 'komunikasi' ? 2.5 : 2} className="relative z-10" />
            {activeTab !== 'komunikasi' && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-white z-20"></span>}
          </button>

          {/* Menu Relawan (7) */}
          <button 
            onClick={() => handleNavClick('relawan')}
            className={`relative p-3 w-full flex justify-center rounded-2xl transition-colors duration-300 ${activeTab === 'relawan' ? 'text-white z-10' : 'text-slate-400 hover:text-primary hover:bg-slate-100/50'}`}
            title="Tim Relawan"
          >
            {activeTab === 'relawan' && (
              <motion.div layoutId="active-nav-bg" className="absolute inset-0 bg-primary rounded-2xl shadow-lg shadow-primary/30 -z-10" initial={false} transition={{ type: "spring", stiffness: 350, damping: 25 }} />
            )}
            <Users size={22} strokeWidth={activeTab === 'relawan' ? 2.5 : 2} className="relative z-10" />
          </button>

          {/* Menu Statistik (8) */}
          <button 
            onClick={() => handleNavClick('statistik')}
            className={`relative p-3 w-full flex justify-center rounded-2xl transition-colors duration-300 ${activeTab === 'statistik' ? 'text-white z-10' : 'text-slate-400 hover:text-primary hover:bg-slate-100/50'}`}
            title="Dashboard Analitik"
          >
            {activeTab === 'statistik' && (
              <motion.div layoutId="active-nav-bg" className="absolute inset-0 bg-primary rounded-2xl shadow-lg shadow-primary/30 -z-10" initial={false} transition={{ type: "spring", stiffness: 350, damping: 25 }} />
            )}
            <BarChart2 size={22} strokeWidth={activeTab === 'statistik' ? 2.5 : 2} className="relative z-10" />
          </button>


        </div>

        {/* Bottom Menu */}
        <div className="mt-auto flex flex-col gap-4 w-full px-2">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 w-full flex justify-center rounded-xl text-slate-500 hover:text-primary transition-colors hover:bg-primary/10"
            title="Pengaturan Sistem"
          >
            <Settings size={22} strokeWidth={2.5} />
          </button>
          
          <button 
            onClick={() => {
              setCurrentUser(null);
              setRute(null);
              setAnimatedTruckPos(null);
            }}
            className="p-3 w-full flex justify-center rounded-xl text-slate-500 hover:text-danger transition-colors hover:bg-danger/10 group"
            title="Keluar / Logout"
          >
            <LogOut size={22} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div 
            className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md flex items-center justify-center text-white font-bold text-xs ring-2 ring-white cursor-pointer"
            title={currentUser?.full_name}
          >
            {currentUser?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
        </div>
      </nav>

      {/* 2. SECONDARY SIDEBAR (Floating Panel Kaca) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0, x: -20 }}
            animate={{ width: 420, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-floating rounded-3xl flex flex-col overflow-hidden pointer-events-auto h-full"
          >
            <div className="w-[420px] h-full flex flex-col">
              {/* Header Secondary Sidebar */}
              <div className="p-7 border-b border-gray-100/50 bg-white/40">
                <div className="flex justify-between items-center">
                  <h1 className="text-xl font-bold text-foreground tracking-tight">
                    {activeTab === 'armada' && 'Armada Darurat'}
                    {activeTab === 'infrastruktur' && 'Fasilitas Darurat'}
                    {activeTab === 'logistik' && 'Ketersediaan Logistik'}
                    {activeTab === 'laporan' && 'Laporan Masuk'}
                    {activeTab === 'komunikasi' && 'Pusat Koordinasi'}
                    {activeTab === 'relawan' && 'Tim Relawan'}
                    {activeTab === 'statistik' && 'Dashboard Analitik'}
                  </h1>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                
                {/* KONTEN ARMADA */}
                {activeTab === 'armada' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 pb-10"
                  >
                    {/* Panel Pencarian & Filter */}
                    <div className="bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm mb-5 space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="Cari armada..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-white/80 border border-white/50 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-slate-400"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100/80 rounded-xl text-slate-500 shrink-0">
                          <Filter size={16} />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden scroll-smooth">
                          {jenisUnik.map(jenis => (
                            <button
                              key={jenis}
                              onClick={() => setFilterJenis(jenis)}
                              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${filterJenis === jenis ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' : 'bg-white/80 border border-white/50 text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                            >
                              {jenis}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Filter Jarak */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100/80 rounded-xl text-slate-500 shrink-0">
                          <Map size={16} />
                        </div>
                        <div className="flex gap-2 w-full">
                          <button onClick={() => setSortByArmada('default')} className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${sortByArmada === 'default' ? 'bg-slate-700 text-white shadow-md' : 'bg-white/80 border border-white/50 text-slate-500 hover:bg-white'}`}>Urutan Default</button>
                          <button onClick={() => setSortByArmada('terdekat')} className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${sortByArmada === 'terdekat' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white/80 border border-white/50 text-slate-500 hover:bg-white'}`}>Terdekat dari Posko</button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3 px-1">
                      <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        {filterJenis !== 'Semua' ? `List ${filterJenis}` : 'Semua Armada'}
                      </h2>
                      <span className="bg-primary/10 text-primary text-[11px] font-black px-2.5 py-1 rounded-lg border border-primary/20">{filteredAlatBerat.length} UNIT</span>
                    </div>

                    {isLoadingList ? (
                      Array(4).fill(0).map((_, i) => (
                        <div key={i} className="bg-white/60 p-4 rounded-3xl border border-white shadow-sm flex items-start gap-4 animate-pulse">
                           <div className="w-12 h-12 bg-slate-200/60 rounded-2xl shrink-0"></div>
                           <div className="flex-1 space-y-2 mt-1">
                             <div className="h-4 bg-slate-200/60 rounded-full w-2/3"></div>
                             <div className="h-3 bg-slate-200/60 rounded-full w-1/3"></div>
                           </div>
                        </div>
                      ))
                    ) : filteredAlatBerat.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-sm font-medium border-2 border-dashed border-white/60 rounded-3xl bg-white/20">
                        Unit tidak ditemukan.
                      </div>
                    ) : (
                      filteredAlatBerat.map((item, idx) => {
                        const currentStatus = armadaStatus[item.id] || { label: 'Standby' };
                        let style = { bg: 'bg-success/10', border: 'border-success/20', text: 'text-success', dot: 'bg-success' };
                        switch (currentStatus.label) {
                          case 'Standby': style = { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600', dot: 'bg-blue-500' }; break;
                          case 'Menuju Lokasi': style = { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-600', dot: 'bg-amber-500' }; break;
                          case 'Proses Evakuasi': style = { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600', dot: 'bg-red-500' }; break;
                          case 'Kembali ke Pos': style = { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-600', dot: 'bg-purple-500' }; break;
                          case 'Maintenance': style = { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-600', dot: 'bg-slate-500' }; break;
                        }
                        
                        return (
                        <motion.div 
                          onClick={() => {
                            const lat = item?.geometry?.coordinates?.[1];
                            const lon = item?.geometry?.coordinates?.[0];
                            if(lat && lon) setFocusedLocation({ lat, lon, id: item.id, type: 'armada' });
                          }}
                          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, ease: "easeOut" }}
                          key={item.id} 
                          className="group bg-white/70 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer flex flex-col gap-3"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                              <img 
                                src={dummyImagesArmada[item.jenis] || dummyImagesArmada['default']} 
                                alt={item.jenis} 
                                className="w-[68px] h-[68px] rounded-2xl object-cover shadow-sm border border-slate-200/50 group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-lg shadow-md text-primary border border-slate-100">
                                <Truck size={14} strokeWidth={3} />
                              </div>
                            </div>
                            <div className="flex-1 pt-1 ml-1">
                              <h3 className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">{item.nama}</h3>
                              <p className="text-[11px] text-slate-500 font-semibold mt-1.5">{item.jenis}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100/80 mt-1">
                             <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                               <Map size={14} className="text-slate-400" />
                               Status: <span className="text-slate-800 font-black">Siap Operasi</span>
                             </div>
                             <div className={`flex items-center gap-1.5 ${style.bg} px-2.5 py-1 rounded-lg border ${style.border}`}>
                               <span className="relative flex h-1.5 w-1.5">
                                 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-75`}></span>
                                 <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.dot}`}></span>
                               </span>
                               <span className={`text-[10px] font-black ${style.text} uppercase tracking-wider`}>{currentStatus.label}</span>
                             </div>
                          </div>
                        </motion.div>
                      );
                    })
                    )}
                  </motion.div>
                )}

                {/* KONTEN INFRASTRUKTUR */}
                {activeTab === 'infrastruktur' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 pb-10"
                  >
                    {/* Panel Pencarian & Filter */}
                    <div className="bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm mb-5 space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="Cari fasilitas..." 
                          value={searchFasilitas}
                          onChange={(e) => setSearchFasilitas(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-white/80 border border-white/50 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-slate-400"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100/80 rounded-xl text-slate-500 shrink-0">
                          <Filter size={16} />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden scroll-smooth">
                          {jenisFasilitasUnik.map(jenis => (
                            <button
                              key={jenis}
                              onClick={() => setFilterJenisFasilitas(jenis)}
                              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${filterJenisFasilitas === jenis ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' : 'bg-white/80 border border-white/50 text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                            >
                              {jenis}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filter Jarak */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100/80 rounded-xl text-slate-500 shrink-0">
                          <Map size={16} />
                        </div>
                        <div className="flex gap-2 w-full">
                          <button onClick={() => setSortByFasilitas('default')} className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${sortByFasilitas === 'default' ? 'bg-slate-700 text-white shadow-md' : 'bg-white/80 border border-white/50 text-slate-500 hover:bg-white'}`}>Urutan Default</button>
                          <button onClick={() => setSortByFasilitas('terdekat')} className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${sortByFasilitas === 'terdekat' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white/80 border border-white/50 text-slate-500 hover:bg-white'}`}>Terdekat dari Posko</button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3 px-1">
                      <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        {filterJenisFasilitas !== 'Semua' ? `List ${filterJenisFasilitas}` : 'Semua Fasilitas'}
                      </h2>
                      <span className="bg-primary/10 text-primary text-[11px] font-black px-2.5 py-1 rounded-lg border border-primary/20">{filteredFasilitas.length} LOKASI</span>
                    </div>

                    {isLoadingList ? (
                      Array(4).fill(0).map((_, i) => (
                        <div key={i} className="bg-white/60 p-4 rounded-3xl border border-white shadow-sm flex items-start gap-4 animate-pulse">
                           <div className="w-12 h-12 bg-slate-200/60 rounded-2xl shrink-0"></div>
                           <div className="flex-1 space-y-2 mt-1">
                             <div className="h-4 bg-slate-200/60 rounded-full w-2/3"></div>
                             <div className="h-3 bg-slate-200/60 rounded-full w-1/3"></div>
                           </div>
                        </div>
                      ))
                    ) : filteredFasilitas.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-sm font-medium border-2 border-dashed border-white/60 rounded-3xl bg-white/20">
                        Fasilitas tidak ditemukan.
                      </div>
                    ) : (
                      filteredFasilitas.map((f, idx) => (
                        <motion.div 
                          onClick={() => {
                            const lat = f?.geometry?.coordinates?.[1];
                            const lon = f?.geometry?.coordinates?.[0];
                            if(lat && lon) setFocusedLocation({ lat, lon, id: f.id, type: 'fasilitas' });
                          }}
                          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, ease: "easeOut" }}
                          key={f.id} 
                          className="group bg-white/70 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer flex flex-col gap-3"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                              <img 
                                src={dummyImagesFasilitas[f.jenis] || dummyImagesFasilitas['default']} 
                                alt={f.jenis} 
                                className="w-[68px] h-[68px] rounded-2xl object-cover shadow-sm border border-slate-200/50 group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-lg shadow-md text-primary border border-slate-100">
                                <Building2 size={14} strokeWidth={3} />
                              </div>
                            </div>
                            <div className="flex-1 pt-1 ml-1">
                              <h3 className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">{f?.nama}</h3>
                              <p className="text-[11px] text-slate-500 font-semibold mt-1.5">{f?.jenis}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100/80 mt-1">
                             <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                               <Users size={14} className="text-slate-400" />
                               Kapasitas: <span className="text-slate-800 font-black">{f?.kapasitas} org</span>
                             </div>
                             <div className="flex items-center gap-1.5 bg-success/10 px-2.5 py-1 rounded-lg border border-success/20">
                               <span className="relative flex h-1.5 w-1.5">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                               </span>
                               <span className="text-[10px] font-black text-success uppercase tracking-wider">Siaga</span>
                             </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* KONTEN STATISTIK */}
                {activeTab === 'statistik' && (() => {
                  const safeBencana = bencana || [];
                  const safeAlat = alatBerat || [];
                  const safeRelawan = relawanData || [];

                  const totalLaporan = safeBencana.length;
                  const laporanAktif = safeBencana.filter(b => b.status === 'Aktif').length;
                  const laporanMenunggu = safeBencana.filter(b => b.status === 'Menunggu').length;
                  const totalArmada = safeAlat.length;
                  const armadaSiaga = safeAlat.filter(a => a.status === 'Siaga' || a.status === 'Tersedia').length;
                  const armadaAktif = totalArmada - armadaSiaga;
                  
                  const instansiStats = {};
                  safeAlat.forEach(a => {
                    if (a.instansi_pemilik) {
                      if(!instansiStats[a.instansi_pemilik]) instansiStats[a.instansi_pemilik] = { armada: 0, relawan: 0 };
                      instansiStats[a.instansi_pemilik].armada += 1;
                    }
                  });
                  safeRelawan.forEach(r => {
                    if (r.instansi) {
                      if(!instansiStats[r.instansi]) instansiStats[r.instansi] = { armada: 0, relawan: 0 };
                      instansiStats[r.instansi].relawan += 1;
                    }
                  });
                  const topInstansi = Object.entries(instansiStats)
                    .map(([nama, counts]) => ({ nama, total: counts.armada + counts.relawan, ...counts }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 4);

                  return (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      {/* Laporan Overview */}
                      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
                        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Activity size={16} className="text-primary"/> Data Analisis Laporan</h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <h4 className="text-xl font-black text-slate-700">{totalLaporan}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Total</p>
                          </div>
                          <div className="p-2 bg-danger/5 rounded-lg border border-danger/10">
                            <h4 className="text-xl font-black text-danger">{laporanAktif}</h4>
                            <p className="text-[10px] font-bold text-danger/70 uppercase mt-1">Aktif</p>
                          </div>
                          <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                            <h4 className="text-xl font-black text-amber-600">{laporanMenunggu}</h4>
                            <p className="text-[10px] font-bold text-amber-600/70 uppercase mt-1">Menunggu</p>
                          </div>
                        </div>
                      </div>

                      {/* Armada & Personel */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                          <p className="text-xs text-muted font-bold uppercase flex items-center gap-1.5"><Truck size={14}/> Armada</p>
                          <div className="mt-2 flex items-end justify-between">
                            <h3 className="text-2xl font-black text-foreground leading-none">{totalArmada}</h3>
                            <div className="text-right">
                              <p className="text-[10px] text-success font-bold">{armadaSiaga} Siaga</p>
                              <p className="text-[10px] text-blue-500 font-bold">{armadaAktif} Jalan</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                          <p className="text-xs text-muted font-bold uppercase flex items-center gap-1.5"><Users size={14}/> Relawan</p>
                          <div className="mt-2 flex items-end justify-between">
                            <h3 className="text-2xl font-black text-foreground leading-none">{safeRelawan.length}</h3>
                            <div className="text-right">
                              <p className="text-[10px] text-success font-bold">{safeRelawan.filter(r=>r.status==='Siaga').length} Siaga</p>
                              <p className="text-[10px] text-primary font-bold">{safeRelawan.filter(r=>r.status==='Di Lapangan').length} Aktif</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Keaktifan Instansi */}
                      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
                        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Target size={16} className="text-emerald-500"/> Keaktifan Instansi (Top 4)</h3>
                        <div className="space-y-2.5">
                          {topInstansi.length === 0 ? (
                            <p className="text-xs text-muted text-center py-2">Belum ada data instansi aktif</p>
                          ) : (
                            topInstansi.map((inst, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    #{idx + 1}
                                  </div>
                                  <span className="text-xs font-bold text-slate-700">{inst.nama}</span>
                                </div>
                                <div className="flex gap-2 text-[10px] font-bold">
                                  {inst.armada > 0 && <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600">{inst.armada} Armada</span>}
                                  {inst.relawan > 0 && <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600">{inst.relawan} Relawan</span>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* KONTEN LAPORAN */}
                {activeTab === 'laporan' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="space-y-5 pb-10 relative"
                  >
                    {!isFormLaporanOpen ? (
                      <>
                        <button 
                          onClick={() => setIsFormLaporanOpen(true)}
                          className="w-full py-4 bg-primary text-white font-bold rounded-3xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group border border-primary/50"
                        >
                          <div className="p-1 bg-white/20 rounded-full group-hover:rotate-90 transition-transform">
                            <Plus size={18} strokeWidth={3} />
                          </div>
                          Buat Laporan Darurat
                        </button>
                        
                        <div className="space-y-4">
                          {filteredBencana.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm font-medium border-2 border-dashed border-white/60 rounded-3xl bg-white/20">
                              Tidak ada log bencana masuk.
                            </div>
                          ) : (
                            filteredBencana.map((item, idx) => {
                              const lat = item?.geometry?.coordinates?.[1];
                              const lon = item?.geometry?.coordinates?.[0];
                              const isKritis = item.status === 'Kritis' || item.status === 'Tinggi';
                              return (
                              <motion.div 
                                onClick={() => {
                                  if(lat && lon) setFocusedLocation({ lat, lon, id: item.id, type: 'bencana' });
                                }}
                                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, ease: "easeOut" }}
                                key={idx} 
                                className={`group relative overflow-hidden bg-white/70 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col gap-3 ${isKritis ? 'hover:shadow-danger/5 hover:border-danger/20' : 'hover:shadow-warning/5 hover:border-warning/20'}`}
                              >
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isKritis ? 'bg-danger' : 'bg-warning'}`}></div>
                                
                                <div className="flex items-start gap-4 pl-2">
                                  <div className="relative shrink-0">
                                    <div className={`w-[68px] h-[68px] rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/50 group-hover:scale-105 transition-transform duration-500 ${isKritis ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                                      <ShieldAlert size={32} />
                                    </div>
                                  </div>
                                  <div className="flex-1 pt-1 ml-1">
                                    <div className="flex justify-between items-start">
                                      <h3 className="font-extrabold text-slate-800 text-sm leading-tight pr-2 line-clamp-2">{item.jenis_bencana}</h3>
                                      <span className="text-[9px] font-bold text-slate-500 border border-slate-200 px-2 py-0.5 rounded-lg bg-white/50 whitespace-nowrap shadow-sm">{item.waktu_laporan || 'Baru'}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-semibold mt-2 flex items-center gap-1.5">
                                      <Map size={12} className={isKritis ? 'text-danger' : 'text-warning'} /> <span className="line-clamp-1">{item.deskripsi}</span>
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )})
                          )}
                        </div>
                      </>
                    ) : (
                      // FORM VIEW
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-white shadow-xl flex flex-col gap-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                           <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                             <ShieldAlert className="text-danger" size={20} /> Form Lapor Darurat
                           </h3>
                           <button 
                             onClick={() => setIsFormLaporanOpen(false)}
                             className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors"
                           >
                             <XCircle size={18} />
                           </button>
                        </div>

                        <div className="space-y-4">
                           <div>
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Jenis Insiden</label>
                             <select id="select-jenis-bencana" className="w-full bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-danger/10 focus:border-danger/30 font-bold text-slate-700 shadow-sm appearance-none">
                               <option>Tanah Longsor</option>
                               <option>Banjir Bandang</option>
                               <option>Pohon Tumbang</option>
                               <option>Kecelakaan Berat</option>
                               <option>Kebakaran</option>
                             </select>
                           </div>

                           <div>
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Lokasi Detail</label>
                             <div className="relative">
                               <input 
                                 id="input-lokasi-darurat"
                                 type="text" 
                                 placeholder="Cth: Jl. Lintas Sumatera Km 40..." 
                                 className="w-full bg-white/80 border border-slate-200/80 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-danger/10 focus:border-danger/30 font-medium text-slate-700 shadow-sm placeholder:text-slate-400" 
                               />
                               <button 
                                 onClick={() => {
                                   document.getElementById('input-lokasi-darurat').value = '-5.7330, 105.5897 (Posko GPS)';
                                   addToast('Satelit: Lokasi saat ini ditemukan.', 'info');
                                 }}
                                 className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                 title="Gunakan Lokasi Saat Ini"
                               >
                                 <Target size={16} strokeWidth={2.5} />
                               </button>
                             </div>
                           </div>

                           <div>
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Deskripsi Singkat</label>
                             <textarea id="input-deskripsi-bencana" rows="3" placeholder="Gambarkan situasi di lapangan..." className="w-full bg-white/80 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-danger/10 focus:border-danger/30 font-medium text-slate-700 shadow-sm placeholder:text-slate-400 resize-none"></textarea>
                           </div>

                           <div className="pt-2">
                             <button 
                               onClick={async () => {
                                 const jenis = document.getElementById('select-jenis-bencana').value;
                                 const lokasi = document.getElementById('input-lokasi-darurat').value;
                                 const deskripsi = document.getElementById('input-deskripsi-bencana').value;
                                 
                                 if (!lokasi || !deskripsi) {
                                   addToast('Harap isi semua kolom formulir.', 'error');
                                   return;
                                 }
                                 
                                 try {
                                   const res = await fetch('http://127.0.0.1:8000/api/laporan', {
                                     method: 'POST',
                                     headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({
                                       jenis_bencana: jenis,
                                       kecamatan: lokasi,
                                       deskripsi: deskripsi,
                                       pelapor: currentUser?.full_name || currentUser?.username || 'Anonim',
                                       kontak: '-',
                                       lat: -5.7330,
                                       lon: 105.5897
                                     })
                                   });
                                   const data = await res.json();
                                   if (data.status === 'success') {
                                     addToast("Laporan Darurat berhasil dikirim ke Database!", "success");
                                     setIsFormLaporanOpen(false);
                                     // Refresh data bencana di peta
                                     const resBencana = await fetch('http://127.0.0.1:8000/api/bencana').then(r => r.json());
                                     setBencana(resBencana?.data || []);
                                   }
                                 } catch (err) {
                                   console.error(err);
                                   addToast("Gagal mengirim laporan ke server.", "error");
                                 }
                               }}
                               className="w-full py-4 bg-gradient-to-r from-danger to-rose-600 hover:opacity-90 text-white font-black rounded-2xl shadow-lg shadow-danger/30 transition-all flex justify-center items-center gap-2"
                             >
                               <ShieldAlert size={18} strokeWidth={3} />
                               KIRIM LAPORAN SEKARANG
                             </button>
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* KONTEN KOMUNIKASI / CHAT PUBLIK */}
                {activeTab === 'komunikasi' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col bg-slate-50/80 backdrop-blur-md rounded-3xl border border-white shadow-sm h-[calc(100vh-210px)] min-h-[500px] overflow-hidden relative"
                  >
                    {/* Header Chat */}
                    <div className="bg-white/95 p-3.5 px-4 border-b border-slate-100 flex justify-between items-center z-10 shadow-sm shrink-0">
                      <div className="flex flex-col">
                        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                          <MessageSquare size={16} className="text-primary" /> Jalur Komunikasi Publik
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1.5"><span className="text-success animate-pulse text-[12px]">●</span> 142 Pengguna Aktif</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 cursor-pointer transition-colors shadow-inner">
                        <Search size={14} strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                      
                      {/* Sistem Notification */}
                      <div className="flex justify-center mb-2">
                         <span className="bg-primary/10 border border-primary/20 text-primary text-[9px] font-black px-3 py-1 rounded-full shadow-sm">
                           HARI INI
                         </span>
                      </div>

                      {pesanPublik.map((msg) => {
                        const currentUserName = currentUser?.username || currentUser?.full_name;
                        const isMe = msg.sender_name === currentUserName;
                        let IconComp = Users;
                        let colorStr = 'bg-slate-200 text-slate-600';
                        let badgeStyle = '';
                        let isPublic = msg.sender_role === 'Public';
                        
                        if (msg.sender_role === 'Armada') {
                          IconComp = Truck; colorStr = 'bg-blue-100 text-blue-600'; badgeStyle = 'bg-blue-100 text-blue-700 border-blue-200';
                        } else if (msg.sender_role === 'Infrastruktur' || msg.sender_role === 'Instansi') {
                          IconComp = Building2; colorStr = 'bg-emerald-100 text-emerald-600'; badgeStyle = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                        } else if (msg.sender_role === 'Posko Induk' || msg.sender_role === 'Satgas') {
                          IconComp = ShieldAlert; colorStr = 'bg-danger text-white'; badgeStyle = 'bg-danger/10 text-danger border-danger/20';
                        } else if (isPublic) {
                          IconComp = User; colorStr = 'bg-slate-100 text-slate-500';
                        }
                        
                        return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ease: "easeOut" }}
                          key={msg.id} 
                          className={`flex items-start gap-2.5 w-full ${isMe ? 'flex-row-reverse' : ''}`}
                        >
                           
                           {/* Avatar Container */}
                           {isPublic ? (
                             <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-200 mt-1 bg-slate-100 text-slate-500 font-black text-[10px] tracking-wider uppercase">
                               {msg.sender_name.substring(0, 2)}
                             </div>
                           ) : (
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white mt-1 ${colorStr}`}>
                                <IconComp size={14} strokeWidth={2.5} />
                             </div>
                           )}

                           <div className={`flex flex-col gap-1 w-full max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                              {/* Meta Info */}
                              <div className={`flex flex-wrap items-center gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                 <span className="font-extrabold text-slate-800 text-[11px]">{msg.sender_name}</span>
                                 {msg.sender_role_detail && !isPublic && (
                                   <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap ${badgeStyle}`}>
                                     {msg.sender_role_detail}
                                   </span>
                                 )}
                                 {!isMe && msg.jarak_str && (
                                   <span className="text-[9px] text-slate-500 font-bold flex items-center gap-0.5 bg-slate-100/80 px-1.5 py-0.5 rounded-md border border-slate-200 whitespace-nowrap">
                                     <Map size={9} className="text-primary"/> {msg.jarak_str}
                                   </span>
                                 )}
                              </div>

                              {/* Message Bubble */}
                              <div className={`p-3 shadow-sm text-xs font-medium leading-relaxed break-words w-auto ${
                                isMe 
                                  ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-2xl rounded-tr-sm border border-primary/50' 
                                  : 'bg-white text-slate-700 rounded-2xl rounded-tl-sm border border-slate-100'
                              }`}>
                                 {msg.message}
                              </div>

                              {/* Time */}
                              <span className={`text-[9px] text-slate-400 font-bold px-1`}>{msg.time_sent}</span>
                           </div>

                        </motion.div>
                        );
                      })}
                    </div>

                    {/* Chat Input Area (Fixed inside container) */}
                    <div className="shrink-0 p-3 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
                        <div className="relative flex items-center gap-2">
                          <button className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors shadow-inner shrink-0" title="Lampirkan Lokasi / Foto">
                            <Plus size={18} strokeWidth={3} />
                          </button>
                          <input 
                            id="input-chat-publik"
                            type="text" 
                            placeholder="Ketik instruksi..." 
                            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 shadow-sm font-medium text-slate-700 placeholder:text-slate-400"
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                const inputEl = document.getElementById('input-chat-publik');
                                const msg = inputEl.value.trim();
                                if (!msg) return;
                                try {
                                  const res = await fetch('http://127.0.0.1:8000/api/pesan-publik', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      sender_name: currentUser?.username || 'Anonim',
                                      sender_role: currentUser?.role || 'Public',
                                      sender_role_detail: currentUser?.role === 'Satgas' ? `Satgas ${currentUser?.instansi_name || ''}` : (currentUser?.instansi_name || ''),
                                      message: msg,
                                      jarak_str: currentUser?.role === 'Public' ? '' : '0 m'
                                    })
                                  });
                                  const data = await res.json();
                                  if (data.status === 'success') {
                                    setPesanPublik(prev => [...prev, data.data]);
                                    inputEl.value = '';
                                  }
                                } catch (err) {
                                  addToast('Gagal mengirim pesan.', 'error');
                                }
                              }
                            }}
                          />
                          <button 
                            onClick={async () => {
                              const inputEl = document.getElementById('input-chat-publik');
                              const msg = inputEl.value.trim();
                              if (!msg) { addToast('Tulis pesan terlebih dahulu.', 'error'); return; }
                              try {
                                const res = await fetch('http://127.0.0.1:8000/api/pesan-publik', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    sender_name: currentUser?.username || 'Anonim',
                                    sender_role: currentUser?.role || 'Public',
                                    sender_role_detail: currentUser?.role === 'Satgas' ? `Satgas ${currentUser?.instansi_name || ''}` : (currentUser?.instansi_name || ''),
                                    message: msg,
                                    jarak_str: currentUser?.role === 'Public' ? '' : '0 m'
                                  })
                                });
                                const data = await res.json();
                                if (data.status === 'success') {
                                  setPesanPublik(prev => [...prev, data.data]);
                                  inputEl.value = '';
                                  addToast('Pesan Broadcast berhasil dikirim.', 'success');
                                }
                              } catch (err) {
                                addToast('Gagal mengirim pesan.', 'error');
                              }
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg flex items-center justify-center hover:scale-105 hover:shadow-md transition-all shadow-sm"
                          >
                             <Navigation size={14} strokeWidth={2.5} className="rotate-90 ml-[-2px]" />
                          </button>
                        </div>
                     </div>
                  </motion.div>
                )}

                {/* KONTEN LOGISTIK */}
                {activeTab === 'logistik' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="space-y-5 pb-10"
                  >
                    {/* Header Card Premium */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 p-6 rounded-3xl shadow-lg shadow-emerald-500/30 border border-emerald-400/50">
                      <div className="absolute -right-6 -top-6 text-white/10 pointer-events-none">
                        <Package size={140} strokeWidth={1} />
                      </div>
                      
                      <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest mb-1">Status Gudang Pusat</p>
                            <h3 className="text-3xl font-black text-white flex items-center gap-2">
                              Aman <span className="text-emerald-200 text-lg font-bold">(76%)</span>
                            </h3>
                          </div>
                          <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/30 text-white">
                            <ShieldAlert size={24} />
                          </div>
                        </div>

                        {/* Progress Bar Glow */}
                        <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden mt-1 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: '76%' }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                            className="h-full bg-white rounded-full relative"
                          >
                            <div className="absolute inset-0 bg-white/50 animate-pulse rounded-full"></div>
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ketersediaan Kategori</h2>
                      <span className="bg-primary/10 text-primary text-[11px] font-black px-2.5 py-1 rounded-lg border border-primary/20">{logistik.length} KATEGORI</span>
                    </div>

                    <div className="space-y-4">
                      {logistik.map((item, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, ease: "easeOut" }}
                          key={item.id || idx} 
                          className="group bg-white/70 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer flex flex-col gap-3"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                              <img 
                                src={item.img_url} 
                                alt={item.nama} 
                                className="w-[68px] h-[68px] rounded-2xl object-cover shadow-sm border border-slate-200/50 group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className={`absolute -bottom-2 -right-2 p-1.5 bg-white rounded-lg shadow-md border border-slate-100 ${item.status === 'Kritis' ? 'text-danger' : 'text-success'}`}>
                                <Package size={14} strokeWidth={3} />
                              </div>
                            </div>
                            <div className="flex-1 pt-1 ml-1">
                              <h3 className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-primary transition-colors">{item.nama}</h3>
                              <p className="text-xs text-slate-500 font-semibold mt-1">Sisa Stok: <span className="text-slate-800 font-black">{item.stok}</span></p>
                              
                              <div className="mt-2.5">
                                <div className="flex justify-between text-[10px] font-bold mb-1">
                                  <span className={item.status === 'Kritis' ? 'text-danger' : 'text-slate-400'}>Kapasitas Gudang</span>
                                  <span className="text-slate-700">{item.percent}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${item.status === 'Kritis' ? 'bg-danger' : 'bg-success'}`} style={{ width: `${item.percent}%` }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* KONTEN RELAWAN */}
                {activeTab === 'relawan' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col h-full pb-6 relative"
                  >
                     {!selectedBencanaRelawan ? (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between mb-2 px-1">
                              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Grup Tugas Berdasarkan Insiden</h2>
                           </div>
                           {filteredBencana.map(grup => (
                              <motion.div 
                                 key={grup.id}
                                 whileHover={{ scale: 1.02 }}
                                 onClick={() => handleSelectBencanaRelawan(grup)}
                                 className="group bg-white/70 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer flex items-center gap-4"
                              >
                                 <img 
                                   src={
                                      grup.jenis_bencana.toLowerCase().includes('banjir') 
                                        ? 'https://images.unsplash.com/photo-1542031121-698f1d394bd0?auto=format&fit=crop&w=150&q=80' 
                                        : grup.jenis_bencana.toLowerCase().includes('longsor') 
                                        ? 'https://images.unsplash.com/photo-1623941490212-01dc9d8412ee?auto=format&fit=crop&w=150&q=80'
                                        : 'https://images.unsplash.com/photo-1515526978082-901b0f513d2f?auto=format&fit=crop&w=150&q=80'
                                   } 
                                   alt={grup.jenis_bencana} 
                                   className="w-[60px] h-[60px] rounded-2xl object-cover shadow-sm border border-slate-200/50" 
                                 />
                                 <div className="flex-1">
                                    <h3 className="font-extrabold text-slate-800 text-sm">{grup.jenis_bencana} {grup.kecamatan}</h3>
                                    <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1">
                                       <Users size={12} className="text-primary"/> {grup.relawan_count || 0} Relawan Tergabung
                                    </p>
                                 </div>
                                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                                    <Navigation size={14} className="rotate-90 ml-[-2px]" />
                                 </div>
                              </motion.div>
                           ))}
                        </div>
                     ) : (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col bg-slate-50/80 backdrop-blur-md rounded-3xl border border-white shadow-sm h-[calc(100vh-210px)] min-h-[500px] overflow-hidden relative -mx-2 mt-[-10px]"
                        >
                           {/* Detail Header */}
                           <div className="bg-white/95 pt-5 pb-4 px-4 border-b border-slate-100 flex flex-col gap-4 shadow-sm z-10 shrink-0 relative">
                              <button 
                                 onClick={() => setSelectedBencanaRelawan(null)}
                                 className="absolute left-4 top-4 p-1.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors shadow-inner"
                              >
                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                              </button>
                              <div className="text-center px-10">
                                 <h3 className="font-black text-slate-800 text-[13px] truncate">{selectedBencanaRelawan.jenis_bencana} {selectedBencanaRelawan.kecamatan}</h3>
                                 <p className="text-[10px] text-slate-500 font-bold mt-0.5">{selectedBencanaRelawan.relawan_count || 0} Relawan Bertugas</p>
                              </div>
                              <div className="flex bg-slate-100/80 p-1.5 rounded-xl shadow-inner">
                                 <button onClick={() => setRelawanSubTab('list')} className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${relawanSubTab==='list'?'bg-white text-primary shadow-sm':'text-slate-500 hover:text-slate-700'}`}>Tim</button>
                                 <button onClick={() => setRelawanSubTab('chat')} className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${relawanSubTab==='chat'?'bg-white text-primary shadow-sm':'text-slate-500 hover:text-slate-700'}`}>Koordinasi <span className="bg-danger text-white text-[9px] px-1.5 py-0.5 rounded-md leading-none">{relawanPesan.length}</span></button>
                              </div>
                           </div>

                           {/* Content SubTab */}
                           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                              {isLoadingRelawan ? (
                                <div className="text-center text-xs text-slate-400 mt-10">Memuat data...</div>
                              ) : relawanSubTab === 'list' ? (
                                 relawanData.map((rel, i) => (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                      key={rel.id || i} 
                                      className="bg-white/80 p-3 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                    >
                                       <img src={rel.img_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} className="w-[42px] h-[42px] rounded-xl object-cover shadow-sm border border-slate-200" />
                                       <div className="flex-1">
                                          <h4 className="font-extrabold text-slate-800 text-[13px] leading-tight">{rel.nama}</h4>
                                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{rel.peran} &bull; {rel.instansi}</p>
                                       </div>
                                       <span className={`text-[9px] font-black px-2 py-1 rounded-lg border flex items-center gap-1.5 ${rel.status==='Siaga'?'bg-success/10 text-success border-success/20':'bg-warning/10 text-warning border-warning/20'}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${rel.status==='Siaga'?'bg-success':'bg-warning animate-pulse'}`}></span>
                                          {rel.status}
                                       </span>
                                    </motion.div>
                                 ))
                              ) : (
                                 <div className="space-y-5 pb-20">
                                    <div className="flex justify-center"><span className="bg-primary/10 border border-primary/20 text-primary text-[9px] font-black px-3 py-1 rounded-full">Grup Koordinasi Khusus</span></div>
                                    {relawanPesan.map((msg, idx) => {
                                       const isMe = msg.sender_name === (currentUser?.full_name || currentUser?.username) || msg.sender_name === 'Anda';
                                       const displayName = isMe ? 'Anda' : msg.sender_name;
                                       return (
                                       <div key={msg.id || idx} className={`flex gap-2 w-full ${isMe ? 'flex-row-reverse' : ''}`}>
                                          {isMe ? (
                                              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center border border-white shadow-sm shrink-0"><ShieldAlert size={14}/></div>
                                          ) : (
                                              <img src={'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80'} className="w-8 h-8 rounded-full border border-white shadow-sm shrink-0" />
                                          )}
                                          
                                          <div className={`flex flex-col gap-1 w-full max-w-[85%] ${isMe ? 'items-end' : ''}`}>
                                             <span className={`text-[10px] font-bold text-slate-800 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                                {displayName} 
                                                <span className={`px-1 py-0.5 rounded ml-1 text-[8px] border ${isMe ? 'text-danger bg-danger/10 border-danger/20' : 'text-primary bg-primary/10 border-primary/20'}`}>
                                                   {msg.sender_role} {msg.sender_role_detail ? `- ${msg.sender_role_detail}` : ''}
                                                </span>
                                             </span>
                                             <div className={`${isMe ? 'bg-gradient-to-br from-primary to-indigo-600 text-white border-primary/50 rounded-tr-sm' : 'bg-white text-slate-700 border-slate-100 rounded-tl-sm'} p-3 rounded-2xl text-xs font-medium shadow-sm border break-words`}>
                                                {msg.message}
                                             </div>
                                             <span className={`text-[9px] text-slate-400 font-bold ${isMe ? 'mr-1' : 'ml-1'}`}>{msg.time_sent}</span>
                                          </div>
                                       </div>
                                       );
                                    })}
                                 </div>
                              )}
                           </div>
                           
                           {/* Chat Input if SubTab is chat */}
                           {relawanSubTab === 'chat' && (
                             currentUser?.role === 'Public' ? (
                               <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-10 flex justify-center items-center">
                                 <span className="text-[11px] font-bold text-slate-400">Mode Pantau Aktif. Hanya relawan yang dapat membalas.</span>
                               </div>
                             ) : (currentUser?.role !== 'Super Admin' && !joinedBencanaIds.includes(selectedBencanaRelawan.id) && !relawanData.some(r => r.nama === (currentUser?.full_name || currentUser?.username))) ? (
                               <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-10 flex justify-center items-center">
                                  <button onClick={handleJoinRelawan} className="w-full py-2.5 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors">
                                    Bergabung ke Grup Tugas
                                  </button>
                               </div>
                             ) : (
                               <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-10">
                                  <div className="relative flex items-center">
                                     <input 
                                       type="text" 
                                       value={inputRelawanChat}
                                       onChange={(e) => setInputRelawanChat(e.target.value)}
                                       onKeyDown={(e) => e.key === 'Enter' && handleKirimPesanRelawan()}
                                       placeholder="Ketik instruksi regu..." 
                                       className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 font-medium text-slate-700 placeholder:text-slate-400" 
                                     />
                                     <button 
                                       onClick={handleKirimPesanRelawan} 
                                       className="absolute right-1 p-2 bg-primary text-white rounded-lg hover:scale-105 shadow-sm transition-all"
                                     >
                                       <Navigation size={14} strokeWidth={2.5} className="rotate-90 ml-[-2px]"/>
                                     </button>
                                  </div>
                               </div>
                             )
                           )}
                        </motion.div>
                     )}
                  </motion.div>
                )}



              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* 3. MAP AREA (Sekarang full background) */}
      <div className="absolute inset-0 z-0">
        
        {/* Tombol Lapor Darurat (Kanan Tengah) */}
        <div className="absolute top-1/2 right-6 -translate-y-1/2 z-[1000] pointer-events-auto">
          <button 
            onClick={() => setIsDaruratModalOpen(true)}
            className="w-12 h-12 bg-danger text-white rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.4)] flex items-center justify-center transition-all group hover:scale-105 active:scale-95 border border-white/20"
            title="Lapor Bencana Darurat"
          >
            <ShieldAlert size={24} className="group-hover:scale-110 transition-transform animate-pulse" />
          </button>
        </div>

        <MapContainer center={center} zoom={14} maxZoom={24} className="w-full h-full z-0" zoomControl={false} attributionControl={false} cursor={isTutupMode ? 'crosshair' : 'grab'} ref={mapRef}>
          
          <MapZoomSetup />
          <MapEventsSetup isTutupMode={isTutupMode} onMapClick={handleTutupJalanMapClick} />
          
          {/* Zoom Control dipindah ke bawah kanan agar rapi */}
          <ScaleControl position="bottomleft" imperial={false} />
          <FocusButton center={center} currentUser={currentUser} alatBerat={safeAlatBerat} fasilitas={safeFasilitas} markerRefs={markerRefs} />
          <ToggleOfflineButton hideOffline={hideOffline} setHideOffline={setHideOffline} />
          <MapFlyTo focus={focusedLocation} markerRefs={markerRefs} />

          {/* Layers Control (Ganti Mode Peta) */}
          <LayersControl position="topright">
            
            <LayersControl.BaseLayer checked name="Citra Satelit (Esri)">
              <TileLayer
                key={`esri-${sysSettings.mapQuality}`}
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                maxNativeZoom={18}
                maxZoom={24}
                detectRetina={sysSettings.mapQuality === 'hd'}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Jalan Raya (OSM)">
              <TileLayer
                key={`osm-${sysSettings.mapQuality}`}
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
                maxNativeZoom={19}
                maxZoom={24}
                detectRetina={sysSettings.mapQuality === 'hd'}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Topografi (OpenTopo)">
              <TileLayer
                key={`topo-${sysSettings.mapQuality}`}
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution='Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
                maxNativeZoom={17}
                maxZoom={24}
                detectRetina={sysSettings.mapQuality === 'hd'}
              />
            </LayersControl.BaseLayer>

          </LayersControl>

          {/* Marker Lokasi User (Live GPS) */}
          {currentUser?.role === 'Public' && (
            <Marker position={[-5.7350, 105.5900]} icon={poskoIcon} zIndexOffset={1000}>
              <Popup>
                <div className="bg-white p-4 rounded-2xl shadow-floating border border-border text-center min-w-[160px] mb-4 pointer-events-auto">
                  <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                    <ShieldAlert size={24} />
                  </div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Lokasi Anda</p>
                  <h3 className="font-bold text-foreground text-sm leading-tight">{currentUser?.full_name || currentUser?.username}</h3>
                  <p className="text-[10px] text-muted mt-2 border-t border-border pt-2">{currentUser?.role}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {safeAlatBerat.map((item) => {
            const lat = item?.geometry?.coordinates?.[1];
            const lon = item?.geometry?.coordinates?.[0];
            if (!lat || !lon) return null;
            
            let finalLat = lat;
            let finalLon = lon;
            
            if (movingArmadaId === item.id && animatedTruckPos) {
              finalLat = animatedTruckPos[0];
              finalLon = animatedTruckPos[1];
            }
            
            const currentStatus = armadaStatus[item.id] || { label: 'Standby', color: 'bg-blue-500', badgeColor: 'bg-blue-600/90' };

            
            return (
            <Marker key={`alat-${item.id}`} position={[finalLat, finalLon]} icon={getTruckIcon(item.nama, item.jenis)} ref={(r) => { if (r) markerRefs.current[`armada-${item.id}`] = r; }}>
              {movingArmadaId === item.id && animatedTruckPos && (
                <Tooltip direction="top" offset={[0, -20]} permanent className="font-bold text-xs bg-warning text-white border-0 shadow-xl px-3 py-1 rounded-full">🚨 Sedang Menuju Lokasi</Tooltip>
              )}
              {sysSettings.showLabels && !(movingArmadaId === item.id && animatedTruckPos) && <Tooltip direction="bottom" offset={[0, 10]} opacity={1} permanent className="font-bold text-xs bg-white text-slate-800 shadow-sm border-0">{item.nama}{item.nama?.toLowerCase().includes(currentUser?.username?.toLowerCase() || '') ? ' (Anda)' : ''}</Tooltip>}
              <Popup>
                <div className="bg-white rounded-3xl shadow-floating border border-border w-[260px] overflow-hidden mb-4 pointer-events-auto flex flex-col">
                  {/* Image Banner */}
                  <div className="h-32 w-full relative">
                    <img src={dummyImagesArmada[item.jenis] || dummyImagesArmada['default']} alt={item.nama} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[9px] font-black text-white uppercase tracking-wider mb-1 border border-white/20">{item.jenis}</span>
                      <h3 className="font-black text-white text-base leading-tight drop-shadow-md">{item.nama}</h3>
                    </div>
                    
                    <div className={`absolute top-3 right-3 flex items-center gap-1.5 ${currentStatus.badgeColor} backdrop-blur-md px-2 py-1 rounded-full border border-white/20 shadow-sm`}>
                       <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                       <span className="text-[9px] font-bold text-white uppercase tracking-widest">{currentStatus.label}</span>
                    </div>
                  </div>
                  
                  {/* Info Detail */}
                  <div className="p-4 bg-white space-y-3">
                    <div className="flex justify-between items-center bg-blue-50 rounded-2xl p-3 border border-blue-100">
                      <div className="flex items-center gap-2">
                         <Activity size={16} className="text-primary" />
                         <span className="text-xs text-primary font-bold">Status Bensin</span>
                      </div>
                      <span className="text-sm font-black text-blue-800">85%</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col gap-1 items-center justify-center text-center">
                         <Map size={14} className="text-slate-500" />
                         <span className="text-[9px] font-bold text-slate-600 uppercase">GPS Aktif</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col gap-1 items-center justify-center text-center">
                         <Users size={14} className="text-slate-500" />
                         <span className="text-[9px] font-bold text-slate-600 uppercase">2 Operator</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 flex gap-2">
                      {currentUser?.role === 'Satgas' && item.nama?.toLowerCase().includes(currentUser?.username?.toLowerCase() || '') ? (
                        <>
                          <button 
                            onClick={() => {
                              const isHidden = hiddenArmadas[item.id];
                              setHiddenArmadas(prev => ({ ...prev, [item.id]: !isHidden }));
                              addToast(`Visibilitas ${item.nama} ${isHidden ? 'ditampilkan ke' : 'disembunyikan dari'} Publik.`, 'success');
                            }}
                            className={`flex-1 py-2 ${hiddenArmadas[item.id] ? 'bg-slate-500 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'} text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm`}
                          >
                            {hiddenArmadas[item.id] ? <Eye size={12} /> : <EyeOff size={12} />} 
                            {hiddenArmadas[item.id] ? 'Tampilkan' : 'Sembunyikan'}
                          </button>
                          <div className="relative flex-1">
                            <button 
                              onClick={() => setActiveStatusMenu(activeStatusMenu === item.id ? null : item.id)}
                              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Activity size={12} /> Set Status
                            </button>
                            {activeStatusMenu === item.id && (
                              <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-200 rounded-xl shadow-floating overflow-hidden z-50 flex flex-col">
                                {[
                                  { label: 'Standby', color: 'bg-blue-500', badgeColor: 'bg-blue-600/90' },
                                  { label: 'Menuju Lokasi', color: 'bg-amber-500', badgeColor: 'bg-amber-500/90' },
                                  { label: 'Proses Evakuasi', color: 'bg-red-500', badgeColor: 'bg-red-500/90' },
                                  { label: 'Kembali ke Pos', color: 'bg-purple-500', badgeColor: 'bg-purple-500/90' },
                                  { label: 'Maintenance', color: 'bg-slate-500', badgeColor: 'bg-slate-500/90' }
                                ].map((opt, idx) => (
                                  <button 
                                    key={idx}
                                    onClick={() => {
                                      setArmadaStatus(prev => ({ ...prev, [item.id]: opt }));
                                      addToast(`Status ${item.nama} diperbarui menjadi ${opt.label}.`, 'success');
                                      setActiveStatusMenu(null);
                                    }}
                                    className="px-3 py-2 text-left text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-b border-slate-100 last:border-0 flex items-center gap-2"
                                  >
                                    <span className={`w-2 h-2 rounded-full ${opt.color}`}></span>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleCariRute(lat, lon)}
                            disabled={loading}
                            className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {loading ? <Navigation size={12} className="animate-spin"/> : <Target size={12} />}
                            Rute
                          </button>
                          {currentUser?.role !== 'Public' && (
                            <button 
                              onClick={() => addToast(`Memanggil operator ${item.nama} via Radio...`, 'info')}
                              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200"
                            >
                              <Radio size={12} className="text-primary"/> Panggil
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
            );
          })}

          {/* Render Fasilitas (Rumah Sakit, Posko, dll) */}
          {safeFasilitas.filter(f => (!hideOffline || f.status !== 'Tutup')).map((item) => {
            const lat = item?.geometry?.coordinates?.[1];
            const lon = item?.geometry?.coordinates?.[0];
            if (!lat || !lon) return null;
            
            const isTutup = item.status === 'Tutup';
            
            return (
            <Marker key={`fasilitas-${item.id}`} position={[lat, lon]} icon={getBuildingIcon(item.nama, item.jenis)} ref={(r) => { if (r) markerRefs.current[`fasilitas-${item.id}`] = r; }}>
              {sysSettings.showLabels && <Tooltip direction="bottom" offset={[0, 10]} opacity={1} permanent className="font-bold text-xs bg-white text-slate-800 shadow-sm border-0">{item.nama} {isTutup ? '(TUTUP)' : ''}{currentUser?.instansi_name === item.nama ? ' (Anda)' : ''}</Tooltip>}
              <Popup>
                <div className="bg-white rounded-3xl shadow-floating border border-border w-[260px] overflow-hidden mb-4 pointer-events-auto flex flex-col">
                  {/* Image Banner */}
                  <div className="h-32 w-full relative">
                    <img src={dummyImagesFasilitas[item.jenis] || dummyImagesFasilitas['Posko']} alt={item.nama} className={`w-full h-full object-cover ${isTutup ? 'grayscale brightness-50' : ''}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    <div className="absolute bottom-3 left-4 right-4">
                      <span className={`inline-block px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[9px] font-black text-white uppercase tracking-wider mb-1 border border-white/20 ${isTutup ? 'bg-danger/50 border-danger/50' : ''}`}>{item.jenis}</span>
                      <h3 className={`font-black text-white text-base leading-tight drop-shadow-md ${isTutup ? 'line-through text-slate-300' : ''}`}>{item.nama}</h3>
                    </div>
                    
                    <div className={`absolute top-3 right-3 flex items-center gap-1.5 backdrop-blur-md px-2 py-1 rounded-full border shadow-sm ${isTutup ? 'bg-danger/90 border-danger/50' : 'bg-success/90 border-success/50'}`}>
                       {!isTutup && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                       <span className="text-[9px] font-bold text-white uppercase tracking-widest">{isTutup ? 'OFFLINE' : 'Siaga'}</span>
                    </div>
                  </div>
                  
                  {/* Info Detail */}
                  <div className="p-4 bg-white space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <div className="flex items-center gap-2">
                         <Users size={16} className="text-slate-400" />
                         <span className="text-xs text-slate-500 font-semibold">Kapasitas</span>
                      </div>
                      <span className="text-sm font-black text-slate-800">{item.kapasitas} <span className="text-[10px] font-semibold text-slate-400">org</span></span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col gap-1 items-center justify-center text-center">
                         <Radio size={14} className="text-primary" />
                         <span className="text-[9px] font-bold text-slate-600 uppercase">Radio VHF Ch.12</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col gap-1 items-center justify-center text-center">
                         <Clock size={14} className="text-warning" />
                         <span className="text-[9px] font-bold text-slate-600 uppercase">Operasional 24 Jam</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 flex gap-2">
                      <button 
                        onClick={() => handleCariRute(lat, lon)}
                        disabled={loading}
                        className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {loading ? <Navigation size={12} className="animate-spin"/> : <Navigation size={12} />}
                        Rute Tercepat
                      </button>
                      {currentUser?.role !== 'Public' && (
                        <button 
                          onClick={() => addToast(`Memanggil ${item.nama} via Radio VHF Ch.12...`, 'info')}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <Radio size={12} className="text-primary"/> Kontak
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
            );
          })}

          {/* Render Bencana (Titik Bahaya) */}
          {filteredBencana.map((item) => {
            const lat = item?.geometry?.coordinates?.[1];
            const lon = item?.geometry?.coordinates?.[0];
            if (!lat || !lon) return null;
            
            const isPending = item.status === 'Menunggu' || item.status === 'Pending';
            


            return (
            <Marker key={`bencana-${item.id}`} position={[lat, lon]} icon={isPending ? bencanaPendingIcon : bencanaIcon} ref={(r) => { if (r) markerRefs.current[`bencana-${item.id}`] = r; }}>
              <Popup>
                <div className="bg-white p-4 rounded-2xl shadow-floating border border-border min-w-[220px] mb-4 pointer-events-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isPending ? 'bg-warning' : 'bg-danger'}`}></span>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isPending ? 'text-warning' : 'text-danger'}`}>{item.status}</p>
                  </div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight mb-2">{item.jenis_bencana}</h3>
                  <p className="text-sm text-slate-600 mb-3">{item.deskripsi}</p>
                  <div className="flex justify-between items-center bg-red-50 rounded-xl p-3 mt-3 border border-red-100 mb-4">
                    <span className="text-xs text-red-700 font-bold">Waktu:</span>
                    <span className="text-sm font-black text-red-800">{item.waktu_laporan || 'Baru Saja'}</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3 border-t pt-2 border-slate-100">
                    Pelapor: <span className="font-bold">{item.pelapor}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {isPending ? (
                      currentUser?.role !== 'Public' ? (
                        <div className="flex gap-2 mt-1">
                          <button 
                            onClick={() => handleVerifyLaporan(item.id)}
                            className="flex-1 py-2 bg-success hover:bg-success/90 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle size={12} /> Verifikasi
                          </button>
                          <button 
                            onClick={() => handleDeleteLaporan(item.id)}
                            className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <XCircle size={12} /> Tolak
                          </button>
                        </div>
                      ) : (
                        item.pelapor === (currentUser?.full_name || currentUser?.username) && (
                          <button 
                            onClick={() => handleDeleteLaporan(item.id)}
                            className="w-full mt-1 py-2 bg-danger hover:bg-danger/90 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <Trash2 size={12} /> Batalkan Laporan
                          </button>
                        )
                      )
                    ) : (
                      <div className="flex gap-2">
                        {currentUser?.role !== 'Public' && (
                          <>
                            <button 
                              onClick={() => handleCariRute(lat, lon, true)}
                              disabled={loading}
                              className="flex-1 py-2 bg-danger hover:bg-danger/90 text-white text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 disabled:opacity-50 shadow-md shadow-danger/20 px-1"
                            >
                              {loading ? <Navigation size={12} className="animate-spin"/> : <Target size={12} />}
                              Evakuasi
                            </button>
                            {['Satgas', 'Super Admin'].includes(currentUser?.role) && (
                              <button 
                                onClick={() => {
                                  setTargetBencanaForDispatch(item);
                                  setIsDispatchModalOpen(true);
                                }}
                                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 border border-slate-200 px-1"
                              >
                                <Truck size={12} className="text-danger"/> {currentUser?.role === 'Satgas' ? 'Minta Armada' : 'Kirim Tim'}
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteLaporan(item.id)}
                              className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-md px-1"
                            >
                              <Trash2 size={12} /> Hapus
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
            );
          })}

          {rute && (
            <>
              {/* Layer 1: Outer Glow (Lebar & Transparan) */}
              <Polyline 
                positions={rute} 
                pathOptions={{ color: '#818cf8', weight: 14, opacity: 0.35, lineCap: 'round', lineJoin: 'round' }} 
              />
              {/* Layer 2: Main Solid Line */}
              <Polyline 
                positions={rute} 
                pathOptions={{ color: '#4f46e5', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} 
              />
              {/* Layer 3: Animated Dashed Line (Techy feel) */}
              <Polyline 
                positions={rute} 
                className={sysSettings.animateRoute ? "animated-route" : ""}
                pathOptions={{ color: '#ffffff', weight: 2, opacity: 0.9, dashArray: '10, 15', lineCap: 'round', lineJoin: 'round' }} 
              />
            </>
          )}

          {animatedTruckPos && !movingArmadaId && (
             <Marker position={animatedTruckPos} icon={getTruckIcon('', 'Ambulans')} zIndexOffset={1000}>
               <Tooltip direction="top" offset={[0, -20]} permanent className="font-bold text-xs bg-warning text-white border-0 shadow-xl px-3 py-1 rounded-full">🚨 Armada Sedang Menuju Lokasi</Tooltip>
             </Marker>
          )}

          {jalanTertutupList.map(jalan => {
            if (jalan.geometry && jalan.geometry.type === 'LineString') {
              const positions = jalan.geometry.coordinates.map(coord => [coord[1], coord[0]]);
              return (
                <Polyline 
                  key={`tutup-${jalan.id}`}
                  positions={positions} 
                  pathOptions={{ color: '#ef4444', weight: 8, opacity: 0.8, dashArray: '10, 10' }} 
                >
                  <Popup>
                    <div className="p-2 min-w-[150px]">
                      <h4 className="font-bold text-slate-800 text-sm mb-1">{jalan.name || jalan.highway || 'Jalan Tertutup'}</h4>
                      <p className="text-xs text-danger mb-3 font-semibold"><ShieldAlert size={12} className="inline mr-1 mb-0.5" />{jalan.alasan}</p>
                      <button 
                        onClick={() => handleBukaJalan(jalan.id)}
                        className="w-full py-1.5 bg-success text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition"
                      >
                        Buka Akses Jalan
                      </button>
                    </div>
                  </Popup>
                </Polyline>
              );
            }
            return null;
          })}
        </MapContainer>
        

      </div>

      </div>

      {/* MODAL LAPOR DARURAT */}
      <AnimatePresence>
        {isDaruratModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDaruratModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white/95 backdrop-blur-xl rounded-3xl w-[450px] shadow-2xl relative z-10 border border-white/60 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-danger/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-danger/10 text-danger rounded-xl">
                    <ShieldAlert size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800 text-lg">Siarkan Bencana Baru</h2>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Penambahan Marker Darurat ke Peta</p>
                  </div>
                </div>
                <button onClick={() => setIsDaruratModalOpen(false)} className="p-2 bg-slate-100 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                 <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Kategori Bencana</label>
                   <select id="modal-jenis-bencana" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger/40 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer">
                     <option>Tanah Longsor</option>
                     <option>Banjir Bandang</option>
                     <option>Pohon Tumbang</option>
                     <option>Kecelakaan Berat</option>
                     <option>Kebakaran</option>
                   </select>
                 </div>
                 
                 <div className="flex gap-4">
                   <div className="flex-1">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Kecamatan / Lokasi Spesifik</label>
                     <input id="modal-lokasi-bencana" type="text" placeholder="Cth: Desa Sukamaju..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger/40 font-medium text-slate-700 shadow-sm" />
                   </div>
                   <div className="w-[140px]">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Titik Koordinat</label>
                     <button onClick={() => {
                       const cLat = mapRef.current ? mapRef.current.getCenter().lat.toFixed(5) : '-5.73300';
                       const cLng = mapRef.current ? mapRef.current.getCenter().lng.toFixed(5) : '105.58970';
                       document.getElementById('modal-lokasi-bencana').value = `${cLat}, ${cLng}`;
                       document.getElementById('modal-koordinat-bencana').value = `${cLat}, ${cLng}`;
                       addToast('Koordinat tengah peta berhasil di-capture!', 'success');
                     }} className="w-full h-[50px] bg-primary/10 text-primary font-black tracking-wide text-xs rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5 border border-primary/20">
                       <Target size={14} /> Lokasi saat Ini
                     </button>
                     <input type="hidden" id="modal-koordinat-bencana" defaultValue="-5.7330, 105.5897" />
                   </div>
                 </div>

                 <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">Deskripsi Lapangan (Tingkat Keparahan)</label>
                   <textarea id="modal-deskripsi-bencana" rows="3" placeholder="Gambarkan situasi untuk satgas lapangan..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger/40 font-medium text-slate-700 shadow-sm resize-none"></textarea>
                 </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                 <button onClick={async () => {
                   const jenis = document.getElementById('modal-jenis-bencana').value;
                   const lokasi = document.getElementById('modal-lokasi-bencana').value;
                   const deskripsi = document.getElementById('modal-deskripsi-bencana').value;
                   const coordsStr = document.getElementById('modal-koordinat-bencana').value;
                   const coords = coordsStr.split(',').map(s=>parseFloat(s.trim()));
                   
                   if(!lokasi || !deskripsi) { addToast("Harap lengkapi lokasi dan deskripsi!", "error"); return; }
                   
                   try {
                     const res = await fetch('http://127.0.0.1:8000/api/laporan', {
                       method: 'POST',
                       headers: {'Content-Type': 'application/json'},
                       body: JSON.stringify({
                         jenis_bencana: jenis,
                         kecamatan: lokasi,
                         deskripsi: deskripsi,
                         pelapor: currentUser?.full_name || currentUser?.username || 'Anonim',
                         kontak: 'Sistem Terpadu',
                         lat: coords[0] || -5.7330,
                         lon: coords[1] || 105.5897
                       })
                     });
                     if (res.ok) {
                       addToast("Laporan Darurat Disiarkan! Mengupdate Peta...", "success");
                       setIsDaruratModalOpen(false);
                       const resBencana = await fetch('http://127.0.0.1:8000/api/bencana').then(r => r.json());
                       setBencana(resBencana?.data || []);
                     } else {
                        try {
                          const errorData = await res.json();
                          addToast(errorData?.detail || "Gagal menyiarkan ke server DB.", "error");
                        } catch(e) {
                          addToast("Gagal menyiarkan ke server DB.", "error");
                        }
                     }
                   } catch (err) {
                     addToast("Gagal koneksi ke server DARLAM.", "error");
                   }
                 }} className="w-full py-4 bg-gradient-to-r from-danger to-rose-600 hover:scale-[1.02] active:scale-[0.98] text-white font-black tracking-widest rounded-2xl shadow-lg shadow-danger/30 transition-all flex items-center justify-center gap-2 border border-danger/50">
                   SIARKAN PERINGATAN DARURAT
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MODAL PENGATURAN (SETTINGS) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* Modal Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-[850px] h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex border border-white/20"
            >
              {/* Tombol Tutup (Kanan Atas) */}
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors z-20"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              {/* Sidebar Kiri */}
              <div className="w-[260px] bg-slate-50 border-r border-border p-6 flex flex-col h-full relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
                    <Settings size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground text-lg">Pengaturan</h2>
                    <p className="text-xs text-muted">Preferensi Sistem</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {[
                    { id: 'general', label: 'Sistem Umum', icon: Globe },
                    { id: 'map', label: 'Tampilan Peta', icon: Map },
                    { id: 'notifications', label: 'Notifikasi', icon: Bell },
                    { id: 'account', label: 'Akun & Keamanan', icon: ShieldAlert },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsActiveTab(tab.id)}
                      className={`relative w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-300 ${
                        settingsActiveTab === tab.id 
                          ? 'text-primary font-semibold' 
                          : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 font-medium'
                      }`}
                    >
                      {settingsActiveTab === tab.id && (
                        <motion.div 
                          layoutId="settings-tab-bg" 
                          className="absolute inset-0 bg-white border border-border shadow-sm rounded-xl -z-10" 
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                      <tab.icon size={18} strokeWidth={settingsActiveTab === tab.id ? 2.5 : 2} className="relative z-10" />
                      <span className="relative z-10 text-sm">{tab.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="mt-auto pt-6 border-t border-border">
                  <p className="text-xs text-slate-400 font-medium text-center">DARLAM Engine v2.1.0</p>
                </div>
              </div>

              {/* Konten Kanan */}
              <div className="flex-1 p-8 bg-white h-full overflow-y-auto relative z-10">
                <AnimatePresence mode="wait">
                  {settingsActiveTab === 'general' && (
                    <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                      <div>
                        <h3 className="font-bold text-xl text-foreground mb-1">Pengaturan Umum</h3>
                        <p className="text-sm text-muted mb-6">Sesuaikan preferensi operasional dashboard DARLAM.</p>
                      </div>

                      <div className="space-y-5">
                        {/* Option 1 */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-border">
                          <div>
                            <p className="font-semibold text-sm text-foreground">Sistem Satuan Jarak</p>
                            <p className="text-xs text-muted mt-0.5">Metrik (Km) atau Imperial (Mil)</p>
                          </div>
                          <select 
                            value={sysSettings.distanceUnit}
                            onChange={(e) => setSysSettings(s => ({...s, distanceUnit: e.target.value}))}
                            className="bg-white border border-border text-sm font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="km">Metrik (Kilometer)</option>
                            <option value="mi">Imperial (Miles)</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {settingsActiveTab === 'map' && (
                    <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                      <div>
                        <h3 className="font-bold text-xl text-foreground mb-1">Tampilan Peta</h3>
                        <p className="text-sm text-muted mb-6">Konfigurasi visualisasi peta spasial.</p>
                      </div>

                      <div className="space-y-5">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-border">
                          <div>
                            <p className="font-semibold text-sm text-foreground">Kualitas Render Peta</p>
                            <p className="text-xs text-muted mt-0.5">Kualitas HD memakan lebih banyak kuota data</p>
                          </div>
                          <div className="flex bg-slate-200/50 p-1 rounded-lg">
                            <button onClick={() => setSysSettings(s => ({...s, mapQuality: 'standard'}))} className={`px-3 py-1.5 text-xs font-semibold rounded ${sysSettings.mapQuality === 'standard' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}>Standar</button>
                            <button onClick={() => setSysSettings(s => ({...s, mapQuality: 'hd'}))} className={`px-3 py-1.5 text-xs font-semibold rounded ${sysSettings.mapQuality === 'hd' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}>HD (Retina)</button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-border">
                          <div>
                            <p className="font-semibold text-sm text-foreground">Tampilkan Label Infrastruktur</p>
                            <p className="text-xs text-muted mt-0.5">Menampilkan teks nama di atas ikon marker</p>
                          </div>
                          <div onClick={() => setSysSettings(s => ({...s, showLabels: !s.showLabels}))} className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors ${sysSettings.showLabels ? 'bg-primary' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${sysSettings.showLabels ? 'right-0.5' : 'left-0.5'}`}></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-border">
                          <div>
                            <p className="font-semibold text-sm text-foreground">Animasi Rute Evakuasi</p>
                            <p className="text-xs text-muted mt-0.5">Efek garis berjalan untuk algoritma Dijkstra</p>
                          </div>
                          <div onClick={() => setSysSettings(s => ({...s, animateRoute: !s.animateRoute}))} className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors ${sysSettings.animateRoute ? 'bg-primary' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${sysSettings.animateRoute ? 'right-0.5' : 'left-0.5'}`}></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Tabs lain bisa ditambahkan nanti, untuk sekarang kita tampilkan pesan placeholder */}
                  {(settingsActiveTab === 'notifications' || settingsActiveTab === 'account') && (
                     <motion.div key="others" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col items-center justify-center text-center opacity-50">
                       <ShieldAlert size={48} className="text-slate-300 mb-4" />
                       <h3 className="font-bold text-lg text-slate-500">Fitur Sedang Dikembangkan</h3>
                       <p className="text-sm text-slate-400">Modul ini akan tersedia pada pembaruan DARLAM berikutnya.</p>
                     </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Dispatch untuk Admin */}
      <AnimatePresence>
        {isDispatchModalOpen && targetBencanaForDispatch && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Minta Armada Darurat</h3>
                  <p className="text-xs text-slate-500 mt-1">Lokasi: {targetBencanaForDispatch.jenis_bencana}</p>
                </div>
                <button onClick={() => setIsDispatchModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[50vh] flex flex-col gap-2">
                <div className="text-sm font-semibold text-slate-600 mb-2">Pilih Satgas / Instansi:</div>
                <button 
                  onClick={async () => {
                    try {
                      await fetch('http://127.0.0.1:8000/api/dispatch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          laporan_id: targetBencanaForDispatch.id,
                          target_instansi: 'RSUD Bob Bazar',
                          sender_username: currentUser.username
                        })
                      });
                      addToast('Permintaan armada berhasil dikirim ke RSUD Bob Bazar!', 'success');
                      setIsDispatchModalOpen(false);
                    } catch (e) {
                      addToast('Gagal mengirim panggilan', 'error');
                    }
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger group-hover:scale-110 transition-transform">
                      <Truck size={18} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800 text-sm">RSUD Bob Bazar</h4>
                      <p className="text-[11px] font-semibold text-slate-500">Ambulans - Standby</p>
                    </div>
                  </div>
                  <Navigation size={14} className="text-primary rotate-90" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Panggilan Masuk untuk Instansi */}
      <AnimatePresence>
        {incomingDispatch && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-danger/20 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border-2 border-danger relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-danger animate-pulse"></div>
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <AlertTriangle size={40} className="text-danger" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">PERMINTAAN ARMADA!</h2>
                <p className="text-sm font-semibold text-slate-600 mb-1">Dari: Satgas Lapangan ({incomingDispatch.sender_username})</p>
                <div className="bg-slate-50 rounded-xl p-3 mb-6 border border-slate-100">
                  <p className="font-bold text-danger">{incomingDispatch.jenis_bencana}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">{incomingDispatch.kecamatan}</p>
                </div>
                
                <div className="mb-6 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Pilih Satgas / Armada untuk Dikerahkan</label>
                  <select id="select-armada" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger/40 font-medium text-slate-700 shadow-sm cursor-pointer">
                    {(() => {
                       const instansiLower = currentUser?.instansi_name?.toLowerCase() || '';
                       const myArmadas = safeAlatBerat.filter(a => 
                         (a.instansi_pemilik && a.instansi_pemilik.toLowerCase() === instansiLower) ||
                         (a.instansi_pemilik && a.instansi_pemilik.toLowerCase().includes(instansiLower)) ||
                         (a.nama && a.nama.toLowerCase().includes(instansiLower))
                       );
                       if (myArmadas.length === 0) {
                         return <option value="">-- Tidak ada armada tersedia --</option>;
                       }
                       return myArmadas.map(a => (
                         <option key={a.id} value={a.id}>
                           {a.nama} ({a.jenis}) - {armadaStatus[a.id]?.label || 'Standby'}
                         </option>
                       ));
                    })()}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={async () => {
                      try {
                        await fetch(`http://127.0.0.1:8000/api/dispatch/${incomingDispatch.id}/respond`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'Ditolak' })
                        });
                        setIncomingDispatch(null);
                      } catch (e) {}
                    }}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors"
                  >
                    TOLAK
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const selectedArmadaId = document.getElementById('select-armada')?.value;
                        if (!selectedArmadaId) {
                           addToast('Pilih satgas/armada terlebih dahulu!', 'error');
                           return;
                        }

                        await fetch(`http://127.0.0.1:8000/api/dispatch/${incomingDispatch.id}/respond`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'Diterima', armada_id: parseInt(selectedArmadaId) })
                        });
                        addToast('Armada Segera Diberangkatkan!', 'success');
                        
                        setArmadaStatus(prev => ({ 
                           ...prev, 
                           [selectedArmadaId]: { label: 'Menuju Lokasi', color: 'bg-amber-500', badgeColor: 'bg-amber-500/90' } 
                        }));

                        // Otomatis mencari rute untuk mengirimkan armada ke lokasi
                        if (incomingDispatch.lat && incomingDispatch.lon) {
                          handleCariRute(incomingDispatch.lat, incomingDispatch.lon, true, parseInt(selectedArmadaId));
                        }
                        setIncomingDispatch(null);
                      } catch (e) {}
                    }}
                    className="flex-1 py-3.5 bg-danger hover:bg-danger/90 text-white font-bold rounded-2xl transition-all shadow-md shadow-danger/30"
                  >
                    TERIMA & KIRIM ARMADA
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
