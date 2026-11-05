import React from 'react';
import { thingName } from '../config.js';

export default function TradePromptModal({ trade, walletBalance, onBuy, onSell, onClose }) {
  if (!trade) return null;

  const canAfford = walletBalance >= (trade.priceInCoins || 1);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 60, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      color: '#000080',
    }}>
      <div style={{
        background: '#c0c0c0',
        borderTop: '4px solid #ffffff',
        borderLeft: '4px solid #ffffff',
        borderRight: '4px solid #000000',
        borderBottom: '4px solid #000000',
        boxShadow: '8px 8px 0px #000000',
        borderRadius: '0px',
        width: '440px',
        padding: '16px 20px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="retro-win-titlebar" style={{ margin: '0 0 10px 0' }}>
          <span>🛍️ C:\COMMERCE\FLEA_MARKET_TRADE_2004.EXE</span>
          <div className="retro-win-controls">
            <button className="retro-win-btn" onClick={onClose}>X</button>
          </div>
        </div>

        {/* Header */}
        <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#ff0000', fontWeight: 900, letterSpacing: '1px' }}>
          🛍️ FLEA MARKET &amp; YARD SALE STALL
        </h2>
        <p style={{ margin: '0 0 14px 0', fontSize: '11px', color: '#000080', fontWeight: 'bold', textTransform: 'uppercase' }}>
          Neighbor Trader: {trade.profession || 'Peddler'} (Cash Only)
        </p>

        {/* Item Showcase Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(57, 255, 20, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          margin: '0 0 20px 0'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#ffffff' }}>
            {trade.name || thingName(trade.itemId)}
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '14px 0' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#888' }}>PRICE</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#39ff14' }}>
                🪙 {trade.priceInCoins || 1} Green Coins
              </div>
            </div>
            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: '12px', color: '#888' }}>YOUR WALLET</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: canAfford ? '#88ff88' : '#ff5555' }}>
                🪙 {walletBalance} Coins
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {trade.type === 'buy_from_player' ? (
            <button
              onClick={onSell}
              style={{
                flex: 1,
                padding: '12px 18px',
                background: 'linear-gradient(135deg, #2e8b57, #1e5b37)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(46,139,87,0.4)'
              }}
            >
              🌾 Sell Crop (🪙 +{trade.rewardCoins || 1})
            </button>
          ) : (
            <button
              onClick={onBuy}
              disabled={!canAfford}
              style={{
                flex: 1,
                padding: '12px 18px',
                background: canAfford
                  ? 'linear-gradient(135deg, #39ff14, #28a80d)'
                  : 'rgba(100, 100, 100, 0.4)',
                border: 'none',
                borderRadius: '8px',
                color: canAfford ? '#051805' : '#888888',
                fontWeight: '800',
                fontSize: '14px',
                cursor: canAfford ? 'pointer' : 'not-allowed',
                boxShadow: canAfford ? '0 4px 14px rgba(57,255,20,0.4)' : 'none'
              }}
            >
              🛒 {canAfford ? 'Buy Item (Enter)' : 'Not Enough Coins'}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '12px 18px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: '#ccc',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ❌ Close
          </button>
        </div>
      </div>
    </div>
  );
}
