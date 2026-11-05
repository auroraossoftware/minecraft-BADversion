import React from 'react';
import { inventory, hotbar } from '../state.js';
import { GREEN_COIN_ITEM_ID } from '../villagers/villagerTradeCatalog.js';

export default function EmeraldHUDOverlay() {
  // Count Green Coins (Emerald Item ID = 152) across inventory & hotbar
  const getGreenCoinCount = () => {
    let count = 0;
    if (inventory) {
      for (const slot in inventory) {
        if (inventory[slot]?.id === GREEN_COIN_ITEM_ID) {
          count += inventory[slot].count || 0;
        }
      }
    }
    if (hotbar) {
      for (let i = 0; i < hotbar.length; i++) {
        if (hotbar[i] === GREEN_COIN_ITEM_ID) {
          count += 1;
        }
      }
    }
    return count;
  };

  const coinCount = getGreenCoinCount();

  return (
    <div style={{
      position: 'fixed',
      top: '36px',
      right: '240px',
      background: '#ffff00',
      borderTop: '3px solid #ffffff',
      borderLeft: '3px solid #ffffff',
      borderRight: '3px solid #000000',
      borderBottom: '3px solid #000000',
      boxShadow: '4px 4px 0px #000000',
      borderRadius: '0px',
      padding: '4px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      zIndex: 99,
      color: '#ff0000',
      fontWeight: '900',
      fontSize: '13px',
      userSelect: 'none',
      pointerEvents: 'none'
    }}>
      <span style={{ fontSize: '18px' }}>🪙</span>
      <span style={{ color: '#000080', letterSpacing: '0.5px' }}>GARY-BUCKS:</span>
      <span style={{ color: '#ff0000', fontSize: '14px', fontWeight: 900 }}>{coinCount} Green Coins</span>
    </div>
  );
}
