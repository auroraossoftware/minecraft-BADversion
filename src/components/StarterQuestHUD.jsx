import React, { useState, useEffect } from 'react';
import { toast } from '../ui.js';

export const STARTER_QUESTS = [
  { id: 'logs', title: '🪵 Harvest Wood', desc: 'Punch trees to collect 4 Wood Planks', target: 4, icon: '🪵' },
  { id: 'crafting', title: '🛠️ Craft Worktable', desc: 'Open Crafting Menu [C] & make a Crafting Table', target: 1, icon: '🛠️' },
  { id: 'stone', title: '⛏️ Mine Cobblestone', desc: 'Mine 5 Stone blocks with a pickaxe', target: 5, icon: '⛏️' },
  { id: 'shelter', title: '🏠 Build Starter Shelter', desc: 'Place 10 solid blocks to build a basic house', target: 10, icon: '🏠' },
  { id: 'food', title: '🍎 Restore Hunger', desc: 'Eat any food item to restore health & stamina', target: 1, icon: '🍎' }
];

export default function StarterQuestHUD({ questState, onUpdateQuest }) {
  const [minimized, setMinimized] = useState(false);
  const [completedAnim, setCompletedAnim] = useState(null);

  const activeIndex = questState.currentIndex || 0;
  const currentQuest = STARTER_QUESTS[activeIndex];
  const isAllComplete = activeIndex >= STARTER_QUESTS.length;

  if (isAllComplete) {
    return (
      <div style={{
        position: 'fixed', top: '36px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 140, background: '#ffff00', border: '3px outset #ffffff',
        borderRadius: '0px', padding: '6px 18px', color: '#ff0000',
        fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: '4px 4px 0px #000000'
      }}>
        <span>🎉 ALL SUNDAY CHORES COMPLETED! GARY CAN SLEEP IN! +50 GOLD COINS</span>
      </div>
    );
  }

  const currentProgress = questState.progress?.[currentQuest.id] || 0;
  const pct = Math.min(100, Math.floor((currentProgress / currentQuest.target) * 100));

  return (
    <div style={{
      position: 'fixed', top: '36px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 140, width: '380px', maxWidth: '92vw',
      background: '#ffffa5', borderTop: '3px solid #ffffff', borderLeft: '3px solid #ffffff',
      borderRight: '3px solid #000000', borderBottom: '3px solid #000000',
      borderRadius: '0px', padding: '10px 14px', color: '#000080',
      boxShadow: '4px 4px 0px #000000',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>{currentQuest.icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#ff0000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📋 CHERYL'S SUNDAY CHORES ({activeIndex + 1}/{STARTER_QUESTS.length})
          </span>
        </div>
        <button
          onClick={() => setMinimized(!minimized)}
          style={{ background: '#c0c0c0', border: '1px outset #fff', color: '#000', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', padding: '1px 6px' }}
        >
          {minimized ? '▼ Show' : '▲ Hide'}
        </button>
      </div>

      {!minimized && (
        <>
          <div style={{ fontSize: '12px', fontWeight: 900, color: '#000080', marginBottom: '2px' }}>
            {currentQuest.title}
          </div>
          <div style={{ fontSize: '10px', color: '#444444', marginBottom: '8px', fontWeight: 'bold' }}>
            {currentQuest.desc}
          </div>

          {/* Progress Bar */}
          <div style={{
            background: '#ffffff', borderRadius: '0px', height: '14px',
            overflow: 'hidden', borderTop: '2px solid #000', borderLeft: '2px solid #000',
            borderRight: '2px solid #fff', borderBottom: '2px solid #fff', position: 'relative'
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: 'repeating-linear-gradient(90deg, #000080, #000080 8px, #ffffff 8px, #ffffff 10px)',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '9px', color: 'var(--gold-bright)', fontWeight: 'bold' }}>
            <span>Progress: {currentProgress} / {currentQuest.target}</span>
            <span>{pct}%</span>
          </div>
        </>
      )}
    </div>
  );
}
