import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coffee, 
  User, 
  ShoppingBag, 
  Plus, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Copy, 
  Check, 
  DollarSign, 
  AlertCircle, 
  Search, 
  Filter, 
  CheckCircle,
  FileText,
  HelpCircle,
  TrendingUp,
  Milk
} from 'lucide-react';

// API Endpoint 
const API_URL = "https://script.google.com/macros/s/AKfycbwO-gydKHKtvkQn9NNmh1fFop3QUjGUH04gKDC0051oHBsDldtobW-DSie50s_9NySX/exec";

// 飲品型別定義
interface MenuItem {
  name: string;
  price: number;
  category: string;
  description: string;
}

// 訂單型別定義
interface Order {
  orderId: string;
  timestamp: string;
  name: string;
  drink: string;
  sugar: string;
  ice: string;
  quantity: number;
  totalPrice: number;
}

// 預設經典菜單 (當 API 尚未回傳，或加載中時作為優雅的備用方案)
const DEFAULT_MENU: MenuItem[] = [
  { name: "茉莉綠茶", price: 35, category: "原味茶類", description: "選用新鮮茉莉花與優質綠茶窨製而成，茶香清雅，回甘怡人。" },
  { name: "阿薩姆紅茶", price: 35, category: "原味茶類", description: "琥珀色茶湯，帶有獨特麥芽香氣，口感醇厚扎實。" },
  { name: "炭焙烏龍茶", price: 40, category: "原味茶類", description: "深烘焙烏龍茶，焙火茶香濃郁持久，回甘甘甜。" },
  { name: "珍珠奶茶", price: 50, category: "咀嚼系最愛", description: "Q 彈手作黑糖珍珠，搭配經典香醇奶茶，辦公室萬年不敗款。" },
  { name: "椰果鮮奶茶", price: 55, category: "咀嚼系最愛", description: "香純紐西蘭牛乳融入斯里蘭卡紅茶，加上爽脆椰果，雙重層次。" },
  { name: "烏龍拿鐵", price: 55, category: "嚴選鮮奶茶", description: "炭焙烏龍與濃郁鮮乳的黃金比例結合，茶乳交融，絲滑順口。" },
  { name: "鮮葡萄柚綠茶", price: 60, category: "鮮果特調", description: "高山綠茶搭配手剝新鮮葡萄柚果肉，每一口都喝得到飽滿果粒。" },
  { name: "荔枝蘆薈冰沙", price: 65, category: "鮮果特調", description: "清甜荔枝冰沙與極富口感的蘆薈果肉，消暑沁涼首選。" },
  { name: "海鹽芝芝莓莓", price: 75, category: "特調奶蓋", description: "鮮甜草莓雪沙與海鹽芝士奶蓋的奢華結合，濃郁酸甜層次多變。" }
];

export default function App() {
  // 資料狀態
  const [menu, setMenu] = useState<MenuItem[]>(DEFAULT_MENU);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 表單狀態
  const [orderId, setOrderId] = useState<string | null>(null); // 若不為 null 代表正在編輯
  const [name, setName] = useState('');
  const [selectedDrink, setSelectedDrink] = useState<MenuItem | null>(DEFAULT_MENU[0]);
  const [sugar, setSugar] = useState('半糖');
  const [ice, setIce] = useState('少冰');
  const [quantity, setQuantity] = useState(1);
  
  // 搜尋與篩選狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');

  // UI 回饋狀態
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 糖度與冰塊選項
  const SUGAR_OPTIONS = ['正常糖', '七分糖', '半糖', '微糖', '無糖'];
  const ICE_OPTIONS = ['正常冰', '少冰', '微冰', '去冰', '溫熱'];

  // 取得最新菜單與訂單
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('無法與後端 GAS API 建立連線');
      }
      const data = await response.json();
      
      if (data.menu && data.menu.length > 0) {
        setMenu(data.menu);
        // 如果原本選擇的飲料不在新菜單中，預設選第一個
        const exists = data.menu.some((item: MenuItem) => item.name === selectedDrink?.name);
        if (!exists) {
          setSelectedDrink(data.menu[0]);
        }
      }
      
      if (data.orders) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error(err);
      setError('加載失敗。目前已載入離線備用菜單，您仍可在此探索款式。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 計算總金額
  const totalPrice = useMemo(() => {
    if (!selectedDrink) return 0;
    return selectedDrink.price * quantity;
  }, [selectedDrink, quantity]);

  // 提取所有的分類
  const categories = useMemo(() => {
    const list = menu.map(item => item.category).filter(Boolean);
    return ['全部', ...Array.from(new Set(list))];
  }, [menu]);

  // 篩選與搜尋後的飲料列表
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === '全部' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menu, searchTerm, selectedCategory]);

  // 今日訂單統計數據
  const stats = useMemo(() => {
    const totalCups = orders.reduce((sum, o) => sum + o.quantity, 0);
    const totalAmount = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const orderCount = orders.length;

    // 計算熱門第一名飲品
    const drinkCounts: { [key: string]: number } = {};
    orders.forEach(o => {
      drinkCounts[o.drink] = (drinkCounts[o.drink] || 0) + o.quantity;
    });
    
    let popularDrink = '無';
    let maxCount = 0;
    Object.entries(drinkCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        popularDrink = `${name} (${count} 杯)`;
      }
    });

    return { totalCups, totalAmount, orderCount, popularDrink };
  }, [orders]);

  // 提交表單 (新增 / 修改)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('請填寫訂購人姓名！');
      return;
    }
    if (!selectedDrink) {
      alert('請選擇飲品！');
      return;
    }

    setActionLoading(true);
    const payload = {
      action: orderId ? 'update' : 'create',
      data: {
        ...(orderId ? { orderId } : {}),
        name: name.trim(),
        drink: selectedDrink.name,
        sugar,
        ice,
        quantity,
        totalPrice
      }
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain' // 避開 preflight CORS
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.status === 'success') {
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
        
        // 重設表單狀態
        setOrderId(null);
        setName('');
        setSugar('半糖');
        setIce('少冰');
        setQuantity(1);
        
        // 重新拉取最新列表
        await fetchData();
      } else {
        alert('操作失敗：' + (result.message || '未知錯誤'));
      }
    } catch (err) {
      console.error(err);
      alert('送出訂單時發生錯誤，請稍後再試！ (可能原因：網路異常或 API 限流)');
    } finally {
      setActionLoading(false);
    }
  };

  // 刪除訂單
  const handleDelete = async (targetOrderId: string) => {
    if (!confirm('確認要刪除這筆訂單嗎？')) return;

    setActionLoading(true);
    const payload = {
      action: 'delete',
      data: { orderId: targetOrderId }
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.status === 'success') {
        await fetchData();
      } else {
        alert('刪除失敗：' + (result.message || '未知錯誤'));
      }
    } catch (err) {
      console.error(err);
      alert('刪除訂單時發生錯誤，請稍後重試！');
    } finally {
      setActionLoading(false);
    }
  };

  // 進入編輯狀態
  const handleEdit = (order: Order) => {
    // 找出對應的飲品資料
    const drinkItem = menu.find(item => item.name === order.drink) || {
      name: order.drink,
      price: order.totalPrice / order.quantity,
      category: '自選飲品',
      description: '原訂單點購品項。'
    };

    setOrderId(order.orderId);
    setName(order.name);
    setSelectedDrink(drinkItem);
    setSugar(order.sugar);
    setIce(order.ice);
    setQuantity(order.quantity);

    // 平滑滾動到頂部/表單區
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // 取消編輯狀態
  const cancelEdit = () => {
    setOrderId(null);
    setName('');
    setSugar('半糖');
    setIce('少冰');
    setQuantity(1);
  };

  // 一鍵複製 Line/Slack 整合清單
  const copyStatistics = () => {
    if (orders.length === 0) {
      alert('目前尚無任何訂單，無法產生清單！');
      return;
    }

    // 依飲料名稱合併統計
    const summaryMap: { [key: string]: { qty: number, specs: string[] } } = {};
    orders.forEach(o => {
      const key = o.drink;
      const specStr = `${o.sugar}/${o.ice} x${o.quantity} (${o.name})`;
      if (!summaryMap[key]) {
        summaryMap[key] = { qty: 0, specs: [] };
      }
      summaryMap[key].qty += o.quantity;
      summaryMap[key].specs.push(specStr);
    });

    let text = `📝 【今日辦公室飲料點單統計】\n`;
    text += `📅 日期：${new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    text += `🥤 總計：${stats.totalCups} 杯 / 共 NT$ ${stats.totalAmount} 元\n`;
    text += `===============================\n\n`;

    Object.entries(summaryMap).forEach(([drinkName, item], idx) => {
      text += `${idx + 1}. 🌟 【${drinkName}】 共 ${item.qty} 杯\n`;
      item.specs.forEach(spec => {
        text += `   * ${spec}\n`;
      });
      text += `\n`;
    });
    
    text += `===============================\n`;
    text += `💡 點單平台：辦公室飲料訂購系統（自動生成）`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('無法複製', err);
      alert('複製失敗，請手動複製！');
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased pb-20">
      {/* 頂部導覽列 Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#CBD5E1] px-4 py-3.5 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.4 bg-[#047857] rounded-xl text-white shadow-sm flex items-center justify-center">
              <Milk size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[#0F172A] flex items-center gap-2">
                辦公室飲料訂購系統
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-[#DCFCE7] text-[#047857] rounded-full uppercase border border-[#A7F3D0]">
                  v2.0 Stable
                </span>
              </h1>
              <p className="text-xs text-[#334155] font-semibold hidden sm:block">午茶小憩，今日事今日畢，今日單今日點 🥤</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden xs:flex items-center gap-1.5 px-3 py-1 bg-[#DCFCE7] text-[#047857] rounded-full text-xs font-bold border border-[#A7F3D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#047857] animate-ping"></span>
              <span>● 連線正常</span>
            </div>
            <button 
              onClick={fetchData} 
              disabled={loading || actionLoading}
              className="px-3.5 py-1.5 rounded-lg text-sm bg-white hover:bg-[#F1F5F9] border border-[#94A3B8] text-[#1E293B] font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={15} className={loading ? "animate-spin" : ""} />
              <span className="hidden xs:inline">同步更新</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主體看板 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 md:mt-8 space-y-6">
        {/* 精緻大氣的漸層色 Banner + 統計卡片 */}
        <section className="relative overflow-hidden bg-[#228b19] text-white rounded-[24px] p-6 sm:p-8 shadow-md border border-[#047857]/35">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-tr from-[#10B981]/20 to-[#047857]/0 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center space-x-2 bg-[#047857]/40 border border-[#34D399]/45 px-3 py-1 rounded-full text-xs text-[#E6FDF1] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-bounce"></span>
                <span>主揪最佳利器 ── 隨時同步試算表</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                今天的午後時光，來杯好茶吧！
              </h2>
              <p className="text-sm text-[#E6FDF1] font-medium leading-relaxed">
                系統與 Google 試算表保持即時連線。您只需在下方選擇規格、點擊送出，即可自動登記！主揪一鍵匯出，告別混亂。
              </p>
            </div>

            {/* 一鍵複製 Slack 資訊 */}
            {orders.length > 0 && (
              <div className="flex-shrink-0">
                <button
                  onClick={copyStatistics}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#047857] to-[#065F46] hover:from-[#065F46] hover:to-[#047857] text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group border border-[#10B981]/30"
                >
                  {copied ? <Check size={16} className="text-[#34D399]" /> : <Copy size={16} className="group-hover:scale-110 transition-transform" />}
                  <span>{copied ? '訂單清單已複製！' : '複製 Line / Slack 訂購格式'}</span>
                </button>
              </div>
            )}
          </div>

          {/* 今日點單統計數據 (Bento風格卡片組 - 獨立清透亮麗白卡) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
            <div className="bg-white/10 backdrop-blur-md p-4.5 rounded-2xl border border-white/20 transition-all">
              <span className="text-xs text-[#E6FDF1] font-bold block mb-1">今日訂購總數</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {loading ? '...' : stats.totalCups}
                </span>
                <span className="text-xs text-[#E6FDF1] font-bold">杯</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4.5 rounded-2xl border border-white/20 transition-all">
              <span className="text-xs text-[#E6FDF1] font-bold block mb-1">預估消費金額</span>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-xs text-[#E6FDF1] font-bold">NT$</span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {loading ? '...' : stats.totalAmount}
                </span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4.5 rounded-2xl border border-white/20 transition-all">
              <span className="text-xs text-[#E6FDF1] font-bold block mb-1">點單跟團人數</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {loading ? '...' : stats.orderCount}
                </span>
                <span className="text-xs text-[#E6FDF1] font-bold">筆紀錄</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4.5 rounded-2xl border border-white/20 transition-all col-span-2 md:col-span-1">
              <span className="text-xs text-[#E6FDF1] font-bold block mb-1 flex items-center gap-1">
                <TrendingUp size={12} className="text-[#34D399]" /> 今日熱門排行第一
              </span>
              <div className="text-sm font-black text-white truncate mt-1 bg-[#047857]/40 px-2.5 py-1 rounded-md border border-[#34D399]/20">
                {loading ? '載入中...' : stats.popularDrink}
              </div>
            </div>
          </div>
        </section>

        {/* 錯誤橫幅 */}
        {error && (
          <div className="bg-[#FEF2F2] border-2 border-[#FCA5A5] text-[#991B1B] p-4 rounded-2xl text-sm flex items-start gap-3 shadow-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-[#DC2626]" />
            <div>
              <span className="font-extrabold block mb-0.5">網路同步中斷</span>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* 訂購介面 - 雙欄分區佈局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 左欄：OrderForm 填單或修改表單 (佔 5 欄) */}
          <section className="lg:col-span-5 bg-white rounded-[24px] p-6 border border-[#CBD5E1] shadow-sm sticky top-[80px]">
            <div className="space-y-4">
              
              {/* 表單狀態標題 */}
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                    <ShoppingBag size={18} className="text-[#047857]" />
                    {orderId ? '修改訂購規格' : '填選飲料單'}
                  </h3>
                  <p className="text-xs text-[#334155] font-semibold">
                    {orderId ? '正在變更現存訂單資訊，如有遺漏請重新檢查' : '請設定您的專屬比例與分量'}
                  </p>
                </div>
                {orderId && (
                  <button 
                    onClick={cancelEdit}
                    className="text-xs text-[#047857] hover:text-[#065F46] hover:underline flex items-center gap-1 cursor-pointer font-extrabold"
                  >
                    取消修改
                  </button>
                )}
              </div>

              {/* 是否提交成功提示 */}
              {submitSuccess && (
                <div className="bg-[#DCFCE7] border border-[#A7F3D0] text-[#047857] p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in font-bold">
                  <CheckCircle size={16} className="text-[#047857] flex-shrink-0" />
                  <span>訂單已成功提交至資料庫！</span>
                </div>
              )}

              {/* 實際表單 */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. 訂購人姓名 */}
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User size={13} className="text-[#475569]" />
                    訂購人姓名 <span className="text-[#B91C1C] font-extrabold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="請輸入您的名字 (例：王小明)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#94A3B8] focus:border-[#047857] focus:ring-1 focus:ring-[#047857] text-sm font-semibold outline-none transition-all placeholder-[#475569] bg-white text-[#0F172A]"
                  />
                </div>

                {/* 2. 選擇飲品 (展示當前已選品項，點擊可以由下方列表改選) */}
                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#CBD5E1]">
                  <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-2.5">
                    當前選定飲品
                  </label>
                  {selectedDrink ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-sm text-[#0F172A]">{selectedDrink.name}</span>
                        <span className="font-mono text-sm font-extrabold text-[#047857] bg-[#DCFCE7] px-2.5 py-0.5 rounded-md border border-[#A7F3D0]">
                          NT$ {selectedDrink.price}
                        </span>
                      </div>
                      <p className="text-xs text-[#1E293B] font-medium leading-relaxed">
                        {selectedDrink.description || "暫無詳細描述，但本飲品甜爽怡人、口感極佳！"}
                      </p>
                      <span className="inline-block px-2 py-0.5 text-[10px] bg-[#E2E8F0] text-[#0F172A] border border-[#CBD5E1] rounded-md font-bold">
                        {selectedDrink.category || "經典特調"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-[#B91C1C] font-bold flex items-center gap-1.5">
                      <AlertCircle size={13} /> 請在右側或下方菜單中選擇一款飲料開點！
                    </p>
                  )}
                </div>

                {/* 3. 甜度調整 */}
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-2">
                    甜度設定
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {SUGAR_OPTIONS.map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setSugar(opt)}
                        className={`text-xs py-2 rounded-xl border font-black transition-all cursor-pointer ${
                          sugar === opt
                            ? 'bg-[#047857] text-white border-[#047857] shadow-sm'
                            : 'bg-white border-[#94A3B8] text-[#1E293B] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. 冰塊溫度調整 */}
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-2">
                    冰塊溫度
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ICE_OPTIONS.map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setIce(opt)}
                        className={`text-xs py-2 rounded-xl border font-black transition-all cursor-pointer ${
                          ice === opt
                            ? 'bg-[#047857] text-white border-[#047857] shadow-sm'
                            : 'bg-white border-[#94A3B8] text-[#1E293B] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. 數量選定 */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                    購買數量
                  </span>
                  
                  <div className="flex items-center space-x-1 border border-[#94A3B8] rounded-xl bg-white p-1">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg text-sm font-black flex items-center justify-center border border-[#CBD5E1] bg-[#F8FAFC] text-[#1E293B] hover:bg-[#E2E8F0] disabled:opacity-40 cursor-pointer select-none"
                    >
                      -
                    </button>
                    <span className="w-10 text-center text-sm font-black font-mono text-[#0F172A]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="w-8 h-8 rounded-lg text-sm font-black flex items-center justify-center border border-[#94A3B8] bg-[#F8FAFC] text-[#1E293B] hover:bg-[#E2E8F0] cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 6. 計算小計與送出 */}
                <div className="border-t border-[#E2E8F0] pt-4 mt-6">
                  <div className="flex justify-between items-baseline mb-4">
                    <span className="text-xs text-[#334155] font-bold">預估小計</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-[#334155] font-mono font-bold">NT$</span>
                      <span className="text-2xl font-black font-mono text-[#047857]">{totalPrice}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading || loading || !selectedDrink}
                    className="w-full py-3.5 rounded-xl bg-[#047857] hover:bg-[#065F46] disabled:bg-[#94A3B8] text-white font-extrabold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {actionLoading ? (
                      <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>{orderId ? '確認儲存點單修改' : '確認送出訂單'}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </section>

          {/* 右欄：OrderList 與 菜單選擇 (佔 7 欄) */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* 今日點購清單 */}
            <div className="bg-white rounded-[24px] p-6 border border-[#CBD5E1] shadow-sm">
              <div className="border-b border-[#CBD5E1] pb-4 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                    <Coffee size={18} className="text-[#047857]" />
                    今天大夥們點了啥
                  </h3>
                  <p className="text-xs text-[#334155] font-semibold">
                    以下是由 Google Sheet 撈取的即時訂購清單，可直接點擊卡片編輯
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-bold font-mono text-[#047857] bg-[#DCFCE7] rounded-full border border-[#A7F3D0]">
                  共計 {orders.length} 筆
                </span>
              </div>

              {/* 訂單卡片列表 */}
              {loading ? (
                /* 加載中骨架屏 Placeholder */
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border border-[#CBD5E1] rounded-2xl p-4 animate-pulse flex justify-between items-center">
                      <div className="space-y-2 w-2/3">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-10"></div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                /* 無訂單時的精美空狀態 */
                <div className="text-center py-12 px-4 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#94A3B8] space-y-4 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-[#DCFCE7] text-[#047857] rounded-full flex items-center justify-center shadow-inner border border-[#A7F3D0]">
                    <ShoppingBag size={28} className="animate-bounce" />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <h4 className="font-extrabold text-[#0F172A] text-sm">今日尚無人上車點單！</h4>
                    <p className="text-xs text-[#334155] font-semibold leading-relaxed">
                      好像還沒有人發起飲料哦。快找鄰座的同事一起，當今天的第一位破冰者吧！
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setName("貼心主揪");
                      setSugar("七分糖");
                      setIce("少冰");
                      setQuantity(1);
                      if (menu && menu.length > 0) {
                        setSelectedDrink(menu[0]);
                      }
                    }}
                    className="px-4 py-2 bg-white hover:bg-[#F1F5F9] border border-[#94A3B8] text-[#1E293B] rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
                  >
                    一鍵代入測試資料
                  </button>
                </div>
              ) : (
                /* 訂單列表 */
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {orders.map((o) => (
                    <div 
                      key={o.orderId}
                      className="group border border-[#CBD5E1] hover:border-[#94A3B8] rounded-2xl p-4 flex items-center justify-between transition-all bg-white hover:bg-[#F8FAFC] shadow-sm"
                    >
                      <div className="space-y-1.5 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#0F172A] text-sm truncate">{o.name}</span>
                          <span className="text-[10px] text-[#1E293B] font-bold whitespace-nowrap hidden xs:inline bg-[#E2E8F0] px-2 py-0.5 rounded border border-[#CBD5E1]">
                            {o.timestamp ? new Date(o.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : "剛才"}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-black text-[#1E293B]">{o.drink}</span>
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-black bg-[#E2E8F0] text-[#0F172A] rounded-full border border-[#CBD5E1]">
                            {o.sugar}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-black bg-[#E2E8F0] text-[#0F172A] rounded-full border border-[#CBD5E1]">
                            {o.ice}
                          </span>
                          <span className="text-xs text-[#0F172A] font-extrabold bg-[#DCFCE7] border border-[#A7F3D0] px-2 py-0.5 rounded-md">
                            {o.quantity} 杯
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-[#334155] font-bold block">總計</span>
                          <span className="font-extrabold font-mono text-sm text-[#047857]">
                            NT$ {o.totalPrice}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEdit(o)}
                            title="修改規格"
                            className="p-2 text-[#475569] hover:text-[#047857] hover:bg-[#DCFCE7] rounded-xl transition-all cursor-pointer border border-[#CBD5E1] hover:border-[#A7F3D0]"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(o.orderId)}
                            title="刪除項目"
                            className="p-2 text-[#475569] hover:text-[#B91C1C] hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-[#CBD5E1] hover:border-rose-200"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 辦公室飲料菜單 Menu (點擊一鍵帶入填單) */}
            <div className="bg-white rounded-[24px] p-6 border border-[#CBD5E1] shadow-sm">
              <div className="space-y-4 mb-5">
                <div>
                  <h3 className="text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
                    <Milk size={18} className="text-[#047857]" />
                    研選午後飲料菜單
                  </h3>
                  <p className="text-xs text-[#334155] font-semibold">
                    點擊任何品項卡片，可一鍵將品項選入填選表單進行規格選擇與下單。
                  </p>
                </div>

                {/* 搜尋 與 類別分類篩選 */}
                <div className="flex flex-col xs:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" />
                    <input
                      type="text"
                      placeholder="搜尋品項名稱或備註..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#94A3B8] focus:border-[#047857] focus:ring-1 focus:ring-[#047857] text-xs font-semibold outline-none transition-all placeholder-[#475569] bg-white text-[#0F172A]"
                    />
                  </div>
                  
                  {/* Category select dropdown */}
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="appearance-none w-full pl-3.5 pr-8 py-2 rounded-xl border border-[#94A3B8] text-xs font-extrabold text-[#1E293B] bg-white cursor-pointer outline-none focus:border-[#047857]"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#1E293B] font-bold">
                      <Filter size={11} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 飲料小卡列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredMenu.map((item) => (
                  <div
                    key={item.name}
                    onClick={() => {
                      setSelectedDrink(item);
                      // 同時輕微提醒
                      const targetForm = document.querySelector('form');
                      if (targetForm) {
                        targetForm.classList.add('ring-2', 'ring-[#A7F3D0]/60', 'transition-all');
                        setTimeout(() => {
                           targetForm.classList.remove('ring-2', 'ring-[#A7F3D0]/60');
                        }, 500);
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between hover:shadow-sm ${
                      selectedDrink?.name === item.name
                        ? 'bg-[#E8FBF0] border-[#047857] shadow-[#047857]/10'
                        : 'bg-white border-[#CBD5E1] hover:border-[#94A3B8]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-extrabold text-sm text-[#0F172A] line-clamp-1">
                          {item.name}
                        </span>
                        <span className="font-mono text-xs font-black text-[#047857] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#A7F3D0] whitespace-nowrap col-shrink-0">
                          ${item.price}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-[#1E293B] font-medium line-clamp-2 leading-relaxed h-[36px]">
                        {item.description || "精心特調，呈現經典茶韻，是下午茶不可多得的解渴良仙。"}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#E2E8F0]">
                      <span className="inline-block px-1.5 py-0.5 text-[9px] bg-[#E2E8F0] text-[#0F172A] rounded-md font-bold border border-[#CBD5E1]">
                        {item.category || "未分類"}
                      </span>
                      {selectedDrink?.name === item.name && (
                        <span className="text-[10px] text-[#047857] font-extrabold flex items-center gap-1">
                          已選定 <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {filteredMenu.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-xs text-[#1E293B] font-bold">
                    找不到與「{searchTerm}」相符的飲品選項。
                  </div>
                )}
              </div>
            </div>

            {/* 清點與教學小卡 */}
            <div className="bg-[#DCFCE7] rounded-2xl p-4 border border-[#A7F3D0] flex gap-3 text-xs leading-relaxed text-[#14532D]">
              <HelpCircle size={18} className="text-[#047857] flex-shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1">
                <span className="font-extrabold block text-[#064E3B] text-sm">💡 貼心主揪教學：</span>
                <p className="text-[#022D1A] font-semibold">
                  當大家點完喝的後，按頂部的「<strong>複製 Line / Slack 訂購格式</strong>」，系統會把杯數匯總和名單分類排版好並複製到剪貼簿。您只要直接貼在公司、部門對話視窗即可叫外送或收錢。
                </p>
              </div>
            </div>

          </section>

        </div>
      </main>
      
      {/* 頁尾資訊 */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 text-center text-xs text-[#475569] font-medium space-y-1">
        <p>© 2026 辦公室飲料點單系統（自動同步 Google Sheets 面板）</p>
        <p>優雅設計 ☕ 開發於 AI Studio Cloud Run 架構</p>
      </footer>
    </div>
  );
}

