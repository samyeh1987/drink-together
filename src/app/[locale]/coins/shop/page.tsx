'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Coins,
  ShoppingBag,
  Loader2,
  Check,
  QrCode,
  Ticket,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useCoinStore } from '@/store/coin-store';
import type { ShopItemCategory, ShopItem, ShopOrder } from '@/types';

const SHOP_CATEGORIES: Array<ShopItemCategory | 'all'> = [
  'all', 'food', 'drink', 'entertainment', 'spa', 'other',
];

const CATEGORY_ICONS: Record<string, string> = {
  all: '🏪',
  food: '🍽️',
  drink: '🍹',
  entertainment: '🎮',
  spa: '💆',
  other: '🎁',
};

type TabType = 'shop' | 'orders';

export default function CoinShopPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const {
    totalCoins,
    shopItems,
    shopCategory,
    orders,
    isLoading,
    fetchShopItems,
    setShopCategory,
    redeemItem,
    fetchOrders,
  } = useCoinStore();

  const [activeTab, setActiveTab] = useState<TabType>('shop');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchShopItems();
    fetchOrders();
  }, [fetchShopItems, fetchOrders]);

  const handleRedeem = async () => {
    if (!selectedItem) return;
    setRedeemResult(null);

    const result = await redeemItem(selectedItem.id);
    if (result.success) {
      setRedeemResult({ success: true, message: t('coins.item.redeemSuccess') });
      setShowConfirm(false);
      setSelectedItem(null);
      setTimeout(() => setRedeemResult(null), 3000);
    } else {
      let msg = t('coins.item.redeemFail');
      if (result.error === 'BALANCE') msg = t('coins.item.redeemFailBalance');
      else if (result.error === 'STOCK') msg = t('coins.item.soldOut');
      setRedeemResult({ success: false, message: msg });
    }
  };

  const getItemName = (item: ShopItem) => {
    if (locale === 'th') return item.name_th;
    if (locale === 'zh-CN') return item.name_zh;
    return item.name_en;
  };

  const getItemDesc = (item: ShopItem) => {
    if (locale === 'th') return item.description_th;
    if (locale === 'zh-CN') return item.description_zh;
    return item.description_en;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-mint bg-mint/10';
      case 'redeemed': return 'text-primary bg-primary/10';
      case 'expired': return 'text-gray bg-gray/10';
      case 'refunded': return 'text-coral bg-coral/10';
      default: return 'text-gray bg-gray/10';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      locale === 'zh-CN' ? 'zh-CN' : locale === 'th' ? 'th' : 'en',
      { month: 'short', day: 'numeric', year: 'numeric' }
    );
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="glass sticky top-0 z-30">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-lg bg-dark/50 flex items-center justify-center hover:bg-dark/70 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold text-white flex-1"
            >
              {t('coins.shop')}
            </motion.h1>
            {/* Coin balance */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20">
              <Coins className="w-3.5 h-3.5 text-gold" />
              <span className="text-sm font-bold text-gold">{totalCoins.toLocaleString()}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-dark/50 rounded-xl">
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'shop'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-light hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('coins.shop')}</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'orders'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-light hover:text-white'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>{t('coins.myOrders')}</span>
              {orders.length > 0 && (
                <span className="w-5 h-5 bg-gold text-dark rounded-full flex items-center justify-center text-[10px] font-bold">
                  {orders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {redeemResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-4 right-4 z-50 px-4 py-3 rounded-xl flex items-center gap-2 ${
              redeemResult.success
                ? 'bg-mint/20 border border-mint/30 text-mint'
                : 'bg-coral/20 border border-coral/30 text-coral'
            }`}
          >
            {redeemResult.success ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{redeemResult.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-4">
        {activeTab === 'shop' ? (
          <>
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
              {SHOP_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setShopCategory(cat)}
                  className={`tag flex-shrink-0 text-xs transition-all duration-200 ${
                    shopCategory === cat
                      ? 'bg-gold/20 text-gold border-gold/30'
                      : 'bg-dark/50 text-gray-light'
                  }`}
                >
                  {CATEGORY_ICONS[cat]} {t(`coins.shopCategory.${cat}`)}
                </button>
              ))}
            </div>

            {/* Items grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                <p className="text-sm text-gray-light">{t('common.loading')}</p>
              </div>
            ) : shopItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-dark/50 rounded-2xl flex items-center justify-center mb-4">
                  <ShoppingBag className="w-7 h-7 text-gray/40" />
                </div>
                <p className="text-sm text-gray-light">{t('common.noResults')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {shopItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    layout
                  >
                    <div className="card p-0 overflow-hidden group hover:border-gold/50 transition-all">
                      {/* Image */}
                      <div className="relative h-32 bg-gradient-to-br from-gold/10 to-dark overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={getItemName(item)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl opacity-30">
                              {CATEGORY_ICONS[item.category] || '🎁'}
                            </span>
                          </div>
                        )}
                        {/* Featured badge */}
                        {item.is_featured && (
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 rounded-full bg-gold text-dark text-[10px] font-bold">
                              {t('coins.item.featured')}
                            </span>
                          </div>
                        )}
                        {/* Stock indicator */}
                        {item.stock === 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-sm font-bold text-coral">{t('coins.item.soldOut')}</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-white truncate mb-0.5">
                          {getItemName(item)}
                        </h3>
                        <p className="text-[11px] text-gray-light line-clamp-2 mb-2.5 min-h-[28px]">
                          {getItemDesc(item)}
                        </p>

                        {/* Price + Redeem */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-gold" />
                            <span className="text-sm font-bold text-gold">{item.coin_price}</span>
                          </div>
                          {item.stock === 0 ? (
                            <span className="text-xs text-gray/50">{t('coins.item.soldOut')}</span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setShowConfirm(true);
                              }}
                              disabled={totalCoins < item.coin_price}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                totalCoins < item.coin_price
                                  ? 'bg-dark/50 text-gray/50 cursor-not-allowed'
                                  : 'bg-gold text-dark hover:bg-gold-light active:scale-95'
                              }`}
                            >
                              {t('coins.item.redeem')}
                            </button>
                          )}
                        </div>

                        {/* Stock info */}
                        {item.stock > 0 && item.stock !== -1 && (
                          <p className="text-[10px] text-gray/50 mt-1.5">
                            {t('coins.item.stock', { count: item.stock })}
                          </p>
                        )}
                        {item.stock === -1 && (
                          <p className="text-[10px] text-mint/60 mt-1.5">
                            {t('coins.item.unlimited')}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Orders tab */
          orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-dark/50 rounded-2xl flex items-center justify-center mb-4">
                <Ticket className="w-7 h-7 text-gray/40" />
              </div>
              <p className="text-sm text-gray-light">{t('coins.order.noOrders')}</p>
              <p className="text-xs text-gray/50 mt-1">{t('coins.order.noOrdersDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="card p-4">
                    <div className="flex items-start gap-3">
                      {/* Item image */}
                      <div className="w-14 h-14 rounded-xl bg-dark/50 overflow-hidden flex-shrink-0">
                        {order.item?.image_url ? (
                          <img src={order.item.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🎁
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-white truncate">
                              {order.item
                                ? (locale === 'th' ? order.item.name_th : locale === 'zh-CN' ? order.item.name_zh : order.item.name_en)
                                : t('coins.order.item')}
                            </h3>
                            <p className="text-[11px] text-gray-light mt-0.5">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${getStatusColor(order.status)}`}>
                            {t(`coins.order.status.${order.status}`)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-light">
                            <Coins className="w-3 h-3 text-coral" />
                            <span>-{order.coins_spent}</span>
                          </div>
                          {order.status === 'active' && (
                            <div className="flex items-center gap-1 text-xs text-gold">
                              <Clock className="w-3 h-3" />
                              <span>{t('coins.order.expiresAt')}: {formatDate(order.expires_at)}</span>
                            </div>
                          )}
                        </div>

                        {/* QR Code button for active orders */}
                        {order.status === 'active' && (
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="mt-2.5 flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary-light transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{t('coins.order.showQR')}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded QR Code */}
                    <AnimatePresence>
                      {expandedOrder === order.id && order.status === 'active' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-gray/10">
                            {/* QR Code placeholder (actual QR would be generated from order.qr_code) */}
                            <div className="bg-white rounded-xl p-4 flex flex-col items-center">
                              <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                                <QrCode className="w-24 h-24 text-gray-300" />
                              </div>
                              <p className="text-xs text-gray-500 text-center mt-1">
                                {t('coins.order.qrInstructions')}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                ID: {order.id.slice(0, 8).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Confirm Redeem Modal */}
      <AnimatePresence>
        {showConfirm && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-md bg-dark border border-gray/20 rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray/40 rounded-full mx-auto mb-5" />

              {/* Item preview */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-16 h-16 rounded-xl bg-gold/10 overflow-hidden flex-shrink-0">
                  {selectedItem.image_url ? (
                    <img src={selectedItem.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      {CATEGORY_ICONS[selectedItem.category] || '🎁'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{getItemName(selectedItem)}</h3>
                  <p className="text-xs text-gray-light mt-0.5">{getItemDesc(selectedItem)}</p>
                </div>
              </div>

              {/* Cost */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-dark/50 border border-gray/10 mb-4">
                <span className="text-sm text-gray-light">{t('coins.item.coins')}</span>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-gold" />
                  <span className="text-lg font-bold text-gold">{selectedItem.coin_price}</span>
                </div>
              </div>

              {/* Balance after */}
              <div className="flex items-center justify-between px-1 mb-5">
                <span className="text-xs text-gray-light">{t('coins.balance')}</span>
                <span className="text-xs text-gray-light">
                  {totalCoins.toLocaleString()} →{' '}
                  <span className={totalCoins - selectedItem.coin_price < 0 ? 'text-coral' : 'text-mint'}>
                    {(totalCoins - selectedItem.coin_price).toLocaleString()}
                  </span>
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-dark/50 text-gray-light border border-gray/20 hover:bg-dark/70 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleRedeem}
                  disabled={isLoading || totalCoins < selectedItem.coin_price}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    totalCoins < selectedItem.coin_price
                      ? 'bg-dark/30 text-gray/50 cursor-not-allowed'
                      : 'bg-gold text-dark hover:bg-gold-light active:scale-95'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    t('coins.item.redeem')
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
