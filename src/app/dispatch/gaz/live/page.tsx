import React, { useState, useMemo, useEffect } from 'react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { 
  Map as MapIcon, Truck, Building2, Navigation, Filter, Calendar, 
  TrendingUp, Target, MousePointer2, X, Search, Utensils, Info,
  AlertTriangle, Bell, Maximize2, Minimize2, Activity, Clock
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server';
import { HeatmapLayer } from '../../../../components/HeatmapLayer';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
  });
  return null;
}

interface Prospect {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isClient: boolean;
  turnover?: number;
}

export default function DispatchLivePage() {
  const { truckLocations, locationHistory, drivers, clients, sales, brands, alerts, stockDispatches } = useDispatchGazStore();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'driver' | 'performance' | 'prospecting' | 'alerts'>('driver');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('all');
  
  // Map Highlight Tool
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightCircle, setHighlightCircle] = useState<{ lat: number, lng: number, radius: number } | null>(null);

  // History tracking state
  const [isHistoryMode, setIsHistoryMode] = useState(false);
  const [historyDate, setHistoryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [historyTimeMinutes, setHistoryTimeMinutes] = useState<number>(600); // 10:00 default

  const formatMinutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const targetTime = useMemo(() => {
    const [yr, mo, dy] = historyDate.split('-');
    const target = new Date(Number(yr), Number(mo) - 1, Number(dy));
    const h = Math.floor(historyTimeMinutes / 60);
    const m = historyTimeMinutes % 60;
    target.setHours(h, m, 0, 0);
    return target;
  }, [historyDate, historyTimeMinutes]);

  const selectedDriver = useMemo(() => {
    return drivers.find(d => d.id === selectedDriverId);
  }, [drivers, selectedDriverId]);

  const driverHistoryPointsForDate = useMemo(() => {
    if (!selectedDriverId) return [];
    return (locationHistory || []).filter(item => {
      if (item.driverId !== selectedDriverId) return false;
      const itemDateStr = new Date(item.timestamp).toISOString().split('T')[0];
      return itemDateStr === historyDate;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [locationHistory, selectedDriverId, historyDate]);

  const pathPoints = useMemo(() => {
    return driverHistoryPointsForDate.filter(item => {
      return new Date(item.timestamp).getTime() <= targetTime.getTime();
    });
  }, [driverHistoryPointsForDate, targetTime]);

  const activeHistoryPoint = useMemo(() => {
    if (driverHistoryPointsForDate.length === 0) return null;
    let closest = driverHistoryPointsForDate[0];
    let minDiff = Math.abs(new Date(closest.timestamp).getTime() - targetTime.getTime());
    
    for (const pt of driverHistoryPointsForDate) {
      const diff = Math.abs(new Date(pt.timestamp).getTime() - targetTime.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }
    return closest;
  }, [driverHistoryPointsForDate, targetTime]);

  // Prospecting
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isSearchingProspects, setIsSearchingProspects] = useState(false);
  const [prospectError, setProspectError] = useState<string | null>(null);
  const [prospectCategory, setProspectCategory] = useState<string>('restaurant');
  const [showDriverHeatmap, setShowDriverHeatmap] = useState(false);
  const [showClientSegmentHeatmap, setShowClientSegmentHeatmap] = useState(false);

  const center: [number, number] = [33.8935, -5.5473]; // Meknes

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const searchNearbyProspects = async (lat: number, lng: number) => {
    setIsSearchingProspects(true);
    setProspectError(null);
    setActiveTab('prospecting');
    try {
      // Map internal category to OSM tags
      let osmTag = 'restaurant';
      let mainKey = 'amenity';
      
      if (prospectCategory === 'hotel') {
        osmTag = 'hotel|guest_house|hostel';
        mainKey = 'tourism';
      } else if (prospectCategory === 'cafe') osmTag = 'cafe';
      else if (prospectCategory === 'fast_food') osmTag = 'fast_food';
      else if (prospectCategory === 'bakery') osmTag = 'bakery';

      // Reduced radius to 2000m and simplified query to avoid 504 timeouts
      const query = `[out:json][timeout:15];
        (
          node["${mainKey}"~"${osmTag}"](around:2000,${lat},${lng});
          way["${mainKey}"~"${osmTag}"](around:2000,${lat},${lng});
        );
        out center;`;

      // Try multiple Overpass instances if one fails
      const instances = [
        'https://overpass-api.de/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
        'https://z.overpass-api.de/api/interpreter'
      ];

      let response;
      let lastError = '';

      for (const instance of instances) {
        try {
          response = await fetch(`${instance}?data=${encodeURIComponent(query)}`);
          if (response.ok) break;
          lastError = `Instance ${instance} returned ${response.status}`;
        } catch (e) {
          lastError = `Instance ${instance} failed: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(response ? `Erreur serveur Overpass: ${response.status}` : `Impossible de contacter les serveurs de cartographie. ${lastError}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Le serveur a renvoyé un format invalide. Veuillez réessayer.");
      }

      const data = await response.json();
      
      if (!data.elements || data.elements.length === 0) {
        setProspects([]);
        if (data.remark && data.remark.includes("timeout")) {
          setProspectError("La recherche a pris trop de temps. Essayez une zone moins dense.");
        }
        return;
      }

      const results: Prospect[] = data.elements.map((el: any) => {
        const name = el.tags?.name || "Établissement sans nom";
        const itemLat = el.lat || el.center?.lat;
        const itemLng = el.lon || el.center?.lon;

        if (!itemLat || !itemLng) return null;

        // Check if already a client
        const existingClient = clients.find(c => 
          c.name.toLowerCase().includes(name.toLowerCase()) || 
          name.toLowerCase().includes(c.name.toLowerCase())
        );
        
        let turnover = 0;
        if (existingClient) {
          turnover = sales.filter(s => s.clientId === existingClient.id).reduce((sum, s) => sum + s.totalPrice, 0);
        }

        return {
          id: el.id.toString(),
          name,
          lat: itemLat,
          lng: itemLng,
          isClient: !!existingClient,
          turnover
        };
      }).filter(Boolean) as Prospect[];

      setProspects(results);
    } catch (error) {
      console.error("Error fetching prospects:", error);
      setProspectError(error instanceof Error ? error.message : "Une erreur est survenue lors de la recherche.");
      setProspects([]);
    } finally {
      setIsSearchingProspects(false);
    }
  };

  // Filtered Sales
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const now = new Date();
      
      let dateMatch = true;
      if (dateFilter === 'today') {
        dateMatch = saleDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateMatch = saleDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateMatch = saleDate >= monthAgo;
      }

      const brandMatch = brandFilter === 'all' || sale.brandId === brandFilter;
      const categoryMatch = categoryFilter === 'all' || sale.category === categoryFilter;

      return dateMatch && brandMatch && categoryMatch;
    });
  }, [sales, dateFilter, brandFilter, categoryFilter]);

  // Highlighted Sales (within circle)
  const highlightedSales = useMemo(() => {
    if (!highlightCircle) return filteredSales;
    return filteredSales.filter(sale => {
      const client = clients.find(c => c.id === sale.clientId);
      if (!client || !client.lat || !client.lng) return false;
      
      const dist = L.latLng(highlightCircle.lat, highlightCircle.lng).distanceTo(L.latLng(client.lat, client.lng));
      return dist <= highlightCircle.radius;
    });
  }, [filteredSales, highlightCircle, clients]);

  // Performance Stats
  const stats = useMemo(() => {
    const totalRevenue = highlightedSales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalQty = highlightedSales.reduce((sum, s) => sum + s.quantity, 0);
    
    const brandCounts: Record<string, number> = {};
    const catCounts: Record<string, number> = {};
    
    highlightedSales.forEach(s => {
      brandCounts[s.brandId] = (brandCounts[s.brandId] || 0) + s.quantity;
      catCounts[s.category] = (catCounts[s.category] || 0) + s.quantity;
    });

    const topBrandId = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    
    return {
      totalRevenue,
      totalQty,
      topBrand: brands.find(b => b.id === topBrandId)?.name || 'N/A',
      topCat: topCat || 'N/A'
    };
  }, [highlightedSales, brands]);

  const selectedDriverSales = filteredSales.filter(s => s.driverId === selectedDriverId);
  const selectedDriverTotal = selectedDriverSales.reduce((sum, s) => sum + s.totalPrice, 0);
  const selectedDriverQty = selectedDriverSales.reduce((sum, s) => sum + s.quantity, 0);

  const driverHeatmapData = useMemo(() => {
    if (!showDriverHeatmap || !selectedDriverId) return [];
    const heatPoints: [number, number, number][] = [];
    selectedDriverSales.forEach(sale => {
       const client = clients.find(c => c.id === sale.clientId);
       if (client && client.lat && client.lng) {
          heatPoints.push([client.lat, client.lng, sale.quantity]);
       }
    });
    return heatPoints;
  }, [showDriverHeatmap, selectedDriverId, selectedDriverSales, clients]);

  const clientSegmentHeatmapData = useMemo(() => {
    if (!showClientSegmentHeatmap) return [];
    const heatPoints: [number, number, number][] = [];
    prospects.forEach(p => {
       heatPoints.push([p.lat, p.lng, p.isClient ? 1.0 : 0.5]);
    });
    return heatPoints;
  }, [showClientSegmentHeatmap, prospects]);

  const handleMapClick = (latlng: L.LatLng) => {
    if (highlightMode) {
      setHighlightCircle({ lat: latlng.lat, lng: latlng.lng, radius: 1000 });
      setHighlightMode(false);
      setActiveTab('performance');
    }
  };

  const createClientIcon = () => L.divIcon({
    className: 'custom-client-icon',
    html: `<div style="width: 16px; height: 16px; background-color: #6366f1; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });

  const createProspectIcon = (isClient: boolean) => L.divIcon({
    className: 'custom-prospect-icon',
    html: `<div style="width: 20px; height: 20px; background-color: ${isClient ? '#10b981' : '#f59e0b'}; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; items-center; justify-content: center;">
             <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });

  const createTruckIcon = (isSelected: boolean, isStuck: boolean, driverName: string) => {
    const truckSvg = renderToString(<Truck style={{ width: '16px', height: '16px', color: isSelected ? 'white' : (isStuck ? '#ef4444' : '#2563eb') }} />);
    return L.divIcon({
      className: 'custom-truck-icon',
      html: `<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
               <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid ${isSelected ? 'white' : (isStuck ? '#ef4444' : '#2563eb')}; background-color: ${isSelected ? (isStuck ? '#ef4444' : '#2563eb') : 'white'}; transform: scale(${isSelected ? 1.25 : 1}); transition: transform 0.2s; position: relative;">
                 ${truckSvg}
                 ${isStuck ? '<div style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background-color: #ef4444; border: 2px solid white; border-radius: 50%;" class="animate-pulse"></div>' : ''}
               </div>
               <div style="background-color: white; padding: 2px 8px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 10px; font-weight: 800; white-space: nowrap; color: #1e293b; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                 ${driverName}
               </div>
             </div>`,
      iconSize: [60, 50],
      iconAnchor: [30, 25],
      popupAnchor: [0, -25]
    });
  };

  const createSaleIcon = (driverName: string) => {
    return L.divIcon({
      className: 'custom-sale-icon',
      html: `<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
               <div class="animate-bounce" style="width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.15); border: 2px solid white; background-color: #10b981;">
                 <span style="color: white; font-size: 14px; font-weight: 900;">$</span>
               </div>
               <div style="background-color: #10b981; color: white; padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: 800; white-space: nowrap; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                 Vente${driverName ? `: ${driverName}` : ''}
               </div>
             </div>`,
      iconSize: [60, 45],
      iconAnchor: [30, 22],
      popupAnchor: [0, -22]
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MapIcon className="w-6 h-6 text-blue-600" />
          Live Dispatch
        </h1>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullScreen}
            className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-all text-slate-600"
            title={isFullScreen ? "Quitter plein écran" : "Plein écran"}
          >
            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          
          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select 
                value={dateFilter} 
                onChange={e => setDateFilter(e.target.value as any)}
                className="text-sm font-medium text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer"
              >
                <option value="today">Aujourd'hui</option>
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="all">Tout l'historique</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={brandFilter} 
                onChange={e => setBrandFilter(e.target.value)}
                className="text-sm font-medium text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer"
              >
                <option value="all">Toutes les marques</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3">
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-sm font-medium text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer"
              >
                <option value="all">Toutes les catégories</option>
                <option value="3Kg">3Kg</option>
                <option value="12Kg">12Kg</option>
                <option value="34Kg">34Kg</option>
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 border-l border-slate-100">
              <select 
                value={clientTypeFilter} 
                onChange={e => setClientTypeFilter(e.target.value)}
                className="text-sm font-medium text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer"
              >
                <option value="all">Tous les clients</option>
                <option value="entreprise">Entreprise</option>
                <option value="particulier">Particulier</option>
                <option value="foyer">Foyer</option>
                <option value="restaurant">Restaurant</option>
                <option value="industriel">Industriel</option>
                <option value="agriculture">Agriculture</option>
                <option value="colonie de vacances">Colonie de vacances</option>
                <option value="POS">POS</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 bg-slate-200 rounded-2xl border border-slate-300 relative overflow-hidden shadow-inner z-0">
          <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
            <button 
              onClick={() => setHighlightMode(!highlightMode)}
              className={`p-3 rounded-xl shadow-lg border transition-all flex items-center gap-2 ${
                highlightMode 
                  ? 'bg-blue-600 border-blue-700 text-white' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MousePointer2 className="w-5 h-5" />
              <span className="text-sm font-bold">{highlightMode ? 'Cliquez sur la carte' : 'Analyser zone'}</span>
            </button>
            {highlightCircle && (
              <button 
                onClick={() => setHighlightCircle(null)}
                className="p-3 bg-white border border-slate-200 text-red-600 rounded-xl shadow-lg hover:bg-red-50 transition-all flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                <span className="text-sm font-bold">Effacer zone</span>
              </button>
            )}
          </div>

          <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur p-3 rounded-xl border border-slate-200 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-600 uppercase">Chauffeurs ({truckLocations.length} actifs)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-600 uppercase">Clients</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-600 uppercase">Prospects</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-600 uppercase">Ventes</span>
              </div>
            </div>
          </div>

          <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={isFullScreen ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
            />
            
            <MapEvents onMapClick={handleMapClick} />

            {showDriverHeatmap && driverHeatmapData.length > 0 && (
              <HeatmapLayer 
                points={driverHeatmapData} 
                radius={35} 
                blur={20} 
                gradient={{ 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1: 'red' }} 
              />
            )}

            {showClientSegmentHeatmap && clientSegmentHeatmapData.length > 0 && (
              <HeatmapLayer 
                points={clientSegmentHeatmapData} 
                radius={40} 
                blur={25} 
                gradient={{ 0.4: 'blue', 0.6: 'purple', 0.8: 'orange', 1: 'pink' }} 
              />
            )}

            {highlightCircle && (
              <Circle 
                center={[highlightCircle.lat, highlightCircle.lng]} 
                radius={highlightCircle.radius}
                pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.1 }}
              />
            )}
            
            {prospects.map(prospect => (
              <Marker 
                key={prospect.id} 
                position={[prospect.lat, prospect.lng]} 
                icon={createProspectIcon(prospect.isClient)}
              >
                <Popup>
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Utensils className="w-4 h-4 text-orange-500" />
                      <span className="font-bold text-slate-900">{prospect.name}</span>
                    </div>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2 ${prospect.isClient ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {prospect.isClient ? 'Déjà Client' : 'Prospect Potentiel'}
                    </div>
                    {prospect.isClient && (
                      <div className="text-sm font-medium text-slate-700 border-t pt-2 mt-1">
                        CA généré: <span className="text-blue-600 font-bold">{prospect.turnover?.toLocaleString()} MAD</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {clients.map(client => {
              if (!client.lat || !client.lng) return null;
              if (clientTypeFilter !== 'all' && client.type !== clientTypeFilter) return null;
              
              let isHighlighted = true;
              if (highlightCircle) {
                const dist = L.latLng(highlightCircle.lat, highlightCircle.lng).distanceTo(L.latLng(client.lat, client.lng));
                isHighlighted = dist <= highlightCircle.radius;
              }

              return (
                <Marker 
                  key={client.id} 
                  position={[client.lat, client.lng]} 
                  icon={createClientIcon()}
                  opacity={isHighlighted ? 1 : 0.3}
                >
                  <Popup>
                    <div className="font-bold text-slate-900">{client.name}</div>
                    <div className="text-xs text-slate-500">{client.address}</div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Sales indicators showing exact location where driver made the sale */}
            {(sales || []).filter(sale => {
              if (!sale.lat || !sale.lng) return false;
              
              // Filter by Date: today or selected history date
              const saleDateStr = new Date(sale.date).toISOString().split('T')[0];
              const targetDateStr = isHistoryMode ? historyDate : new Date().toISOString().split('T')[0];
              if (saleDateStr !== targetDateStr) return false;
              
              // Filter by Selected Driver (if any)
              if (selectedDriverId && sale.driverId !== selectedDriverId) return false;
              
              return true;
            }).map((sale) => {
              const driver = drivers.find(d => d.id === sale.driverId);
              const client = clients.find(c => c.id === sale.clientId);
              const brand = brands.find(b => b.id === sale.brandId);
              const formattedTime = new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              
              return (
                <Marker
                  key={`map-sale-${sale.id}`}
                  position={[sale.lat!, sale.lng!]}
                  icon={createSaleIcon(driver ? driver.prenom : '')}
                >
                  <Popup>
                    <div className="p-2 space-y-1.5 max-w-xs bg-white rounded-xl">
                      <div className="flex items-center gap-1.5 font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase tracking-tight">
                        <span>💰</span> Vente Réalisée
                      </div>
                      <div className="font-extrabold text-slate-900 text-xs tracking-tight">
                        {client ? client.name : 'Client Temporaire / Comptoir'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Heure de vente : <span className="font-bold text-slate-800">{formattedTime}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-1 flex flex-col gap-0.5">
                        <div>Détails : <span className="font-extrabold text-slate-900">{sale.quantity} × {brand ? brand.name : 'Gaz'} ({sale.category})</span></div>
                        <div>Total : <span className="font-black text-emerald-600">{sale.totalPrice.toFixed(2)} DH</span> <span className="text-[8px] bg-slate-100 text-slate-700 font-bold px-1 rounded uppercase ml-1">{sale.paymentMethod}</span></div>
                      </div>
                      {driver && (
                        <div className="text-[9px] text-slate-400 border-t border-slate-100 pt-1 flex items-center gap-1 font-semibold">
                          🚚 Par {driver.prenom} {driver.nom}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {isHistoryMode && pathPoints.length > 0 && (
              <Polyline 
                positions={pathPoints.map(p => [p.lat, p.lng])} 
                color="#f59e0b" 
                weight={4} 
                dashArray="5, 10" 
              />
            )}

            {isHistoryMode && activeHistoryPoint && (
              <Marker 
                position={[activeHistoryPoint.lat, activeHistoryPoint.lng]} 
                icon={createTruckIcon(true, false, `${selectedDriver?.prenom} ${selectedDriver?.nom} (Hist: ${formatMinutesToTime(historyTimeMinutes)})`)}
              >
                <Popup>
                  <div className="font-bold text-slate-900">{selectedDriver?.prenom} {selectedDriver?.nom} (Historique)</div>
                  <div className="text-xs text-slate-500 font-bold mb-1">Passage à : {formatMinutesToTime(historyTimeMinutes)}</div>
                  <div className="text-xs text-slate-500">Heure log : {new Date(activeHistoryPoint.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  <div className="text-xs text-slate-500">Vitesse : {activeHistoryPoint.speed} km/h</div>
                </Popup>
              </Marker>
            )}

            {truckLocations.map(loc => {
              if (isHistoryMode && selectedDriverId === loc.driverId) {
                // Hide live marker in historical tracking mode for this driver
                return null;
              }
              const driver = drivers.find(d => d.id === loc.driverId);
              const isSelected = selectedDriverId === loc.driverId;
              const isStuck = !!loc.stoppedSince && (new Date().getTime() - new Date(loc.stoppedSince).getTime() > 15 * 60 * 1000);
              
              return (
                <Marker 
                  key={loc.driverId} 
                  position={[loc.lat, loc.lng]} 
                  icon={createTruckIcon(isSelected, isStuck, `${driver?.prenom} ${driver?.nom}`)}
                  eventHandlers={{
                    click: () => {
                      setSelectedDriverId(loc.driverId);
                      setActiveTab('driver');
                    },
                  }}
                >
                  <Popup>
                    <div className="font-bold text-slate-900">{driver?.prenom} {driver?.nom}</div>
                    <div className="text-xs text-slate-500">{isStuck ? 'Arrêt prolongé' : 'En mouvement'}</div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div className={`w-96 rounded-2xl border shadow-xl flex flex-col overflow-hidden shrink-0 z-10 ${isFullScreen ? 'bg-slate-900/90 backdrop-blur-xl border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex border-b ${isFullScreen ? 'border-slate-700' : 'border-slate-200'}`}>
            <button 
              onClick={() => setActiveTab('driver')}
              className={`flex-1 py-4 text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'driver' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <Truck className="w-4 h-4" />
              Chauffeur
            </button>
            <button 
              onClick={() => setActiveTab('performance')}
              className={`flex-1 py-4 text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'performance' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <TrendingUp className="w-4 h-4" />
              Performance
            </button>
            <button 
              onClick={() => setActiveTab('prospecting')}
              className={`flex-1 py-4 text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'prospecting' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <Target className="w-4 h-4" />
              Prospection
            </button>
            <button 
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 py-4 text-xs font-bold transition-all flex items-center justify-center gap-2 relative ${activeTab === 'alerts' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className={`absolute top-3 right-3 w-2 h-2 rounded-full border-2 border-slate-900 ${
                  alerts.some(a => a.type === 'critical' || a.type === 'warning') ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                }`}></span>
              )}
              Alertes
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'driver' ? (
              selectedDriverId ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-bold ${isFullScreen ? 'text-white' : 'text-slate-900'}`}>
                        {drivers.find(d => d.id === selectedDriverId)?.prenom} {drivers.find(d => d.id === selectedDriverId)?.nom}
                      </h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Navigation className="w-3 h-3" /> En mouvement • Meknès
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold border border-blue-500/20">
                      {drivers.find(d => d.id === selectedDriverId)?.prenom.charAt(0)}
                    </div>
                  </div>

                  {/* Driver Heatmap toggle */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${isFullScreen ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <h4 className={`text-sm font-bold ${isFullScreen ? 'text-white' : 'text-slate-900'}`}>Carte de chaleur (Activité)</h4>
                      <p className="text-xs text-slate-500">Visualiser la concentration de ventes du chauffeur.</p>
                    </div>
                    <button 
                      onClick={() => setShowDriverHeatmap(!showDriverHeatmap)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${showDriverHeatmap ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showDriverHeatmap ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Historique de Trajet Section */}
                  <div className={`p-4 rounded-2xl border ${isHistoryMode ? 'bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/10' : (isFullScreen ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200-gray border-slate-200')}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${isHistoryMode ? 'text-amber-600 font-extrabold' : (isFullScreen ? 'text-white' : 'text-slate-900')}`}>
                          <Calendar className="w-4 h-4 text-amber-500" />
                          Historique de Trajet
                        </h4>
                        <p className="text-xs text-slate-500">Suivre le parcours pour une date/heure.</p>
                      </div>
                      <button 
                        onClick={() => setIsHistoryMode(!isHistoryMode)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isHistoryMode ? 'bg-amber-500' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isHistoryMode ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    {isHistoryMode && (
                      <div className="space-y-4 pt-4 border-t border-dashed border-slate-300/30 animate-in fade-in duration-200">
                        {/* Date Picker */}
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isFullScreen ? 'text-slate-400' : 'text-slate-500'}`}>Date du trajet</label>
                          <input 
                            type="date"
                            value={historyDate}
                            onChange={(e) => setHistoryDate(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold outline-none border ${isFullScreen ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'}`}
                          />
                        </div>

                        {/* Slider time */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className={`block text-[10px] font-bold uppercase tracking-wider ${isFullScreen ? 'text-slate-400' : 'text-slate-500'}`}>Heure recherchée</label>
                            <span className="text-xs font-black text-amber-600 font-mono tracking-tight bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              {formatMinutesToTime(historyTimeMinutes)}
                            </span>
                          </div>
                          <input 
                            type="range"
                            min={0} // 00:00
                            max={1439} // 23:59
                            step={10} // 10-min intervals
                            value={historyTimeMinutes}
                            onChange={(e) => setHistoryTimeMinutes(Number(e.target.value))}
                            className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold mt-1">
                            <span>00:00</span>
                            <span>12:00</span>
                            <span>23:59</span>
                          </div>
                        </div>

                        {/* Point Status summary */}
                        <div className={`p-3 rounded-xl text-xs font-medium space-y-1.5 ${isFullScreen ? 'bg-slate-900/50 text-slate-300' : 'bg-white text-slate-700 border border-slate-100'}`}>
                          {driverHistoryPointsForDate.length === 0 ? (
                            <div className="text-slate-500 text-center py-2 italic font-normal text-xs">
                              Aucune position GPS sur ce jour.
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-[10px]">Position estimée :</span>
                                <span className="font-bold text-slate-800 font-mono">
                                  {activeHistoryPoint ? `${activeHistoryPoint.lat.toFixed(4)}, ${activeHistoryPoint.lng.toFixed(4)}` : 'Indéterminée'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-[10px]">Vitesse du camion :</span>
                                <span className={`font-bold ${activeHistoryPoint?.speed && activeHistoryPoint.speed > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                  {activeHistoryPoint?.speed || 0} km/h
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-[10px]">Points filtrés :</span>
                                <span className="text-slate-800 font-bold">
                                  {pathPoints.length} / {driverHistoryPointsForDate.length} points
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`${isFullScreen ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'} p-4 rounded-2xl border`}>
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">Ventes</p>
                      <p className={`text-xl font-black ${isFullScreen ? 'text-white' : 'text-blue-900'}`}>{selectedDriverTotal} MAD</p>
                    </div>
                    <div className={`${isFullScreen ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50 border-orange-100'} p-4 rounded-2xl border`}>
                      <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">Volume</p>
                      <p className={`text-xl font-black ${isFullScreen ? 'text-white' : 'text-orange-900'}`}>{selectedDriverQty}</p>
                    </div>
                    <div className={`${isFullScreen ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'} p-4 rounded-2xl border`}>
                      <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Vitesse</p>
                      <p className={`text-xl font-black ${isFullScreen ? 'text-white' : 'text-emerald-900'}`}>{drivers.find(d => d.id === selectedDriverId)?.speed || 0} km/h</p>
                    </div>
                    <div className={`${isFullScreen ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-100'} p-4 rounded-2xl border`}>
                      <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-1">Arrêts</p>
                      <p className={`text-xl font-black ${isFullScreen ? 'text-white' : 'text-purple-900'}`}>{drivers.find(d => d.id === selectedDriverId)?.stops || 0}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className={`font-bold mb-4 text-xs uppercase tracking-widest ${isFullScreen ? 'text-slate-500' : 'text-slate-400'}`}>Stock & Ventes (Aujourd'hui)</h4>
                    <div className="space-y-3">
                      {stockDispatches.filter(sd => sd.driverId === selectedDriverId && !sd.isValidated).map(sd => {
                        const brand = brands.find(b => b.id === sd.brandId);
                        const remaining = sd.quantity - sd.sold;
                        const percentage = sd.quantity > 0 ? (sd.sold / sd.quantity) * 100 : 0;
                        return (
                          <div key={sd.id} className={`p-4 rounded-2xl border ${isFullScreen ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className={`font-bold ${isFullScreen ? 'text-slate-200' : 'text-slate-900'}`}>{brand?.name} - {sd.category}</span>
                              <span className="text-xs font-bold text-slate-500">{sd.sold} / {sd.quantity} vendus</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <div className="text-xs text-slate-500 text-right">Reste: <span className="font-bold text-slate-700">{remaining}</span></div>
                          </div>
                        );
                      })}
                      {stockDispatches.filter(sd => sd.driverId === selectedDriverId && !sd.isValidated).length === 0 && (
                        <p className="text-sm text-slate-500 italic text-center">Aucun stock assigné en cours.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className={`font-bold mb-4 text-xs uppercase tracking-widest ${isFullScreen ? 'text-slate-500' : 'text-slate-400'}`}>Dernières Activités</h4>
                    <div className="space-y-3">
                      {selectedDriverSales.slice(-5).reverse().map(sale => {
                        const client = clients.find(c => c.id === sale.clientId);
                        return (
                          <div key={sale.id} className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${isFullScreen ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${isFullScreen ? 'text-slate-200' : 'text-slate-900'}`}>{client?.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{sale.quantity} unités • {sale.totalPrice} MAD</p>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                      {selectedDriverSales.length === 0 && (
                        <div className="py-8 text-center">
                          <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-slate-500 italic">Aucune activité récente.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-6">
                  <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 border border-slate-700">
                    <Truck className="w-10 h-10 text-slate-600" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-300 mb-2">Sélection requise</h4>
                  <p className="text-sm text-slate-500">Cliquez sur un véhicule sur la carte pour accéder aux données télémétriques et commerciales en temps réel.</p>
                </div>
              )
            ) : activeTab === 'performance' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h3 className={`font-bold ${isFullScreen ? 'text-white' : 'text-slate-900'}`}>Analyse de Zone</h3>
                </div>

                {highlightCircle && (
                  <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-xs text-blue-400 flex items-center gap-3">
                    <Target className="w-4 h-4" />
                    Rayon de 1km • Meknès Centre
                  </div>
                )}

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Chiffre d'affaires</p>
                    <p className="text-3xl font-black">{stats.totalRevenue.toLocaleString()} MAD</p>
                    <div className="mt-4 flex items-center gap-2 text-blue-100 text-xs font-medium">
                      <div className="px-2 py-0.5 bg-white/20 rounded-full">{stats.totalQty} unités</div>
                      <span>•</span>
                      <span>{highlightedSales.length} transactions</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className={`p-4 rounded-2xl border ${isFullScreen ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Top Marque</p>
                      <p className={`text-lg font-bold ${isFullScreen ? 'text-white' : 'text-slate-900'}`}>{stats.topBrand}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isFullScreen ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Top Catégorie</p>
                      <p className={`text-lg font-bold ${isFullScreen ? 'text-white' : 'text-slate-900'}`}>{stats.topCat}</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className={`font-bold text-xs uppercase tracking-widest mb-4 ${isFullScreen ? 'text-slate-500' : 'text-slate-400'}`}>Répartition Marché</h4>
                    <div className="space-y-4">
                      {brands.map(brand => {
                        const brandSales = highlightedSales.filter(s => s.brandId === brand.id);
                        const brandQty = brandSales.reduce((sum, s) => sum + s.quantity, 0);
                        const percentage = stats.totalQty > 0 ? (brandQty / stats.totalQty) * 100 : 0;
                        
                        return (
                          <div key={brand.id} className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                              <span className={isFullScreen ? 'text-slate-300' : 'text-slate-700'}>{brand.name}</span>
                              <span className="text-blue-500">{brandQty} unités ({Math.round(percentage)}%)</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'alerts' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-red-500" />
                    <h3 className={`font-bold ${isFullScreen ? 'text-white' : 'text-slate-900'}`}>Alertes Système</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">LIVE</span>
                </div>

                <div className="space-y-3">
                  {alerts.map((alert, aIdx) => (
                    <div key={`alert-${alert.id || aIdx}-${aIdx}`} className={`p-4 rounded-2xl border flex gap-4 transition-all ${
                      alert.type === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                      alert.type === 'warning' ? 'bg-orange-500/10 border-orange-500/30' :
                      'bg-blue-500/10 border-blue-500/30'
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        alert.type === 'critical' ? 'bg-red-500 text-white' :
                        alert.type === 'warning' ? 'bg-orange-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${isFullScreen ? 'text-slate-200' : 'text-slate-900'}`}>{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          <span className="text-slate-700">•</span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{alert.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="py-12 text-center text-slate-500 italic">
                      Aucune alerte en cours.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-5 h-5 text-orange-500" />
                  <h3 className={`font-bold ${isFullScreen ? 'text-white' : 'text-slate-900'}`}>Prospection Ciblée</h3>
                </div>

                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${isFullScreen ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div>
                      <h4 className={`text-sm font-bold ${isFullScreen ? 'text-white' : 'text-slate-900'}`}>Heatmap Segment</h4>
                      <p className="text-xs text-slate-500">Visualiser la densité de cette catégorie dans la ville.</p>
                    </div>
                    <button 
                      onClick={() => setShowClientSegmentHeatmap(!showClientSegmentHeatmap)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${showClientSegmentHeatmap ? 'bg-orange-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showClientSegmentHeatmap ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Catégorie</label>
                    <select 
                      value={prospectCategory}
                      onChange={(e) => setProspectCategory(e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl text-sm font-bold outline-none border transition-all ${isFullScreen ? 'bg-slate-800 border-slate-700 text-white focus:border-orange-500' : 'bg-slate-50 border-slate-200 focus:border-orange-500'}`}
                    >
                      <option value="restaurant">Restaurants</option>
                      <option value="hotel">Hôtels / Hébergement</option>
                      <option value="cafe">Cafés</option>
                      <option value="fast_food">Fast Food</option>
                      <option value="bakery">Boulangeries</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => searchNearbyProspects(center[0], center[1])}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black text-sm hover:shadow-lg hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Search className="w-5 h-5" />
                    LANCER LA RECHERCHE
                  </button>
                </div>

                {prospectError && (
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-xs text-red-400 flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4" />
                    {prospectError}
                  </div>
                )}

                {isSearchingProspects ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                    <div className="relative w-12 h-12 mb-4">
                      <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm font-bold animate-pulse">Scanning Meknès...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prospects.map(prospect => (
                      <div key={prospect.id} className={`p-4 rounded-2xl border transition-all ${isFullScreen ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-200 shadow-sm hover:border-orange-300'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-sm font-bold truncate ${isFullScreen ? 'text-slate-200' : 'text-slate-900'}`}>{prospect.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${prospect.isClient ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                {prospect.isClient ? 'Client' : 'Prospect'}
                              </span>
                            </div>
                          </div>
                          {prospect.isClient && (
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">CA Total</p>
                              <p className="text-xs font-black text-blue-500">{prospect.turnover?.toLocaleString()} MAD</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {prospects.length === 0 && (
                      <div className="py-12 text-center text-slate-600">
                        <Info className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="text-sm italic">Aucun prospect chargé.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
