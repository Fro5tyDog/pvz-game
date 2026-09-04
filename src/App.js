

Pvz game · JSX
import React, { useEffect, useRef, useState, useCallback } from 'react';
 
const PvZGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  const [sun, setSun] = useState(100);
  const [wave, setWave] = useState(1);
  
  const gameRef = useRef({
    plants: [],
    zombies: [],
    selectedPlant: null,
    sun: 100,
    wave: 1,
    waveTimer: 0,
    zombieSpawned: 0,
    gameState: 'playing',
    sunDrops: [],
    sunDropTimer: 0,
  });
 
  const COLS = 5;
  const ROWS = 3;
  const CELL_WIDTH = 80;
  const CELL_HEIGHT = 100;
  const CANVAS_WIDTH = COLS * CELL_WIDTH + 20;
  const CANVAS_HEIGHT = ROWS * CELL_HEIGHT + 40;
 
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
 
    // Draw grid
    ctx.strokeStyle = '#0d2818';
    ctx.lineWidth = 1;
    for (let col = 0; col <= COLS; col++) {
      ctx.beginPath();
      ctx.moveTo(col * CELL_WIDTH + 10, 40);
      ctx.lineTo(col * CELL_WIDTH + 10, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let row = 0; row <= ROWS; row++) {
      ctx.beginPath();
      ctx.moveTo(10, row * CELL_HEIGHT + 40);
      ctx.lineTo(CANVAS_WIDTH - 10, row * CELL_HEIGHT + 40);
      ctx.stroke();
    }
 
    // Draw plants
    gameRef.current.plants.forEach((plant) => {
      ctx.fillStyle = plant.type === 'shooter' ? '#90EE90' : '#FFB6C1';
      const x = plant.col * CELL_WIDTH + CELL_WIDTH / 2 + 10;
      const y = plant.row * CELL_HEIGHT + CELL_HEIGHT / 2 + 40;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw type indicator
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(plant.type === 'shooter' ? '→' : '○', x, y);
    });
 
    // Draw zombies
    gameRef.current.zombies.forEach((zombie) => {
      ctx.fillStyle = '#8B4513';
      const y = zombie.row * CELL_HEIGHT + CELL_HEIGHT / 2 + 40;
      ctx.fillRect(zombie.x - 15, y - 20, 30, 40);
      
      // Eyes
      ctx.fillStyle = '#FFF';
      ctx.fillRect(zombie.x - 8, y - 12, 6, 6);
      ctx.fillRect(zombie.x + 2, y - 12, 6, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(zombie.x - 7, y - 11, 3, 3);
      ctx.fillRect(zombie.x + 3, y - 11, 3, 3);
    });
 
    // Draw sun drops
    gameRef.current.sunDrops.forEach((drop) => {
      if (!drop.collected) {
        // Glow effect (larger for visibility)
        const gradient = ctx.createRadialGradient(drop.x, drop.y, 0, drop.x, drop.y, 35);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(drop.x - 35, drop.y - 35, 70, 70);
 
        // Sun orb
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine
        ctx.fillStyle = '#FFFF99';
        ctx.beginPath();
        ctx.arc(drop.x - 5, drop.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
 
    // Draw projectiles
    gameRef.current.plants.forEach((plant) => {
      if (plant.projectiles) {
        plant.projectiles.forEach((proj) => {
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(proj.x - 3, proj.y - 3, 6, 6);
        });
      }
    });
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, COLS, ROWS, CELL_WIDTH, CELL_HEIGHT]);
 
  const updateGame = useCallback(() => {
    const g = gameRef.current;
    
    // Spawn sun drops
    g.sunDropTimer++;
    if (g.sunDropTimer > Math.random() * 100 + 120) {
      const col = Math.floor(Math.random() * COLS);
      g.sunDrops.push({
        x: col * CELL_WIDTH + CELL_WIDTH / 2 + 10,
        y: 50,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.833, // ~2 seconds per tile (100px per 120 frames)
        life: 600, // frames until disappears
        collected: false,
      });
      g.sunDropTimer = 0;
    }
 
    // Update sun drops
    g.sunDrops.forEach((drop) => {
      if (!drop.collected) {
        drop.y += drop.vy;
        drop.x += drop.vx;
        // Stop sun at bottom of grid
        if (drop.y > CANVAS_HEIGHT - 60) {
          drop.y = CANVAS_HEIGHT - 60;
          drop.vy = 0; // stop falling
        }
        drop.life--;
      }
    });
    g.sunDrops = g.sunDrops.filter(d => d.life > 0);
 
    // Spawn zombies
    g.waveTimer++;
    const zombiesPerWave = 3 + g.wave;
    if (g.waveTimer > 120 && g.zombieSpawned < zombiesPerWave) {
      const row = Math.floor(Math.random() * ROWS);
      g.zombies.push({
        x: CANVAS_WIDTH - 20,
        row: row,
        health: 2,
        speed: 0.4 + (g.wave * 0.05),
      });
      g.zombieSpawned++;
      g.waveTimer = 0;
    }
 
    // Move zombies
    g.zombies.forEach((zombie) => {
      zombie.x -= zombie.speed;
    });
 
    // Remove dead zombies
    g.zombies = g.zombies.filter(z => z.health > 0 && z.x > 0);
 
    // Plant shooting
    g.plants.forEach((plant) => {
      if (plant.type !== 'shooter') return;
      plant.shootTimer = (plant.shootTimer || 0) + 1;
      
      if (plant.shootTimer > 30) {
        const zombiesInLane = g.zombies.filter(z => z.row === plant.row);
        if (zombiesInLane.length > 0) {
          if (!plant.projectiles) plant.projectiles = [];
          const target = zombiesInLane[0];
          plant.projectiles.push({
            x: plant.col * CELL_WIDTH + CELL_WIDTH / 2 + 10,
            y: plant.row * CELL_HEIGHT + CELL_HEIGHT / 2 + 40,
            targetX: target.x,
            targetY: target.row * CELL_HEIGHT + CELL_HEIGHT / 2 + 40,
            speed: 5,
          });
          plant.shootTimer = 0;
        }
      }
    });
 
    // Move projectiles
    g.plants.forEach((plant) => {
      if (!plant.projectiles) return;
      plant.projectiles.forEach((proj, idx) => {
        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < proj.speed) {
          plant.projectiles.splice(idx, 1);
          // Check collision
          g.zombies.forEach((zombie) => {
            if (Math.abs(zombie.x - proj.targetX) < 20 && zombie.row === Math.round((proj.targetY - 40) / CELL_HEIGHT)) {
              zombie.health--;
            }
          });
        } else {
          proj.x += (dx / dist) * proj.speed;
          proj.y += (dy / dist) * proj.speed;
        }
      });
    });
 
    // Check win/lose
    if (g.zombieSpawned >= zombiesPerWave && g.zombies.length === 0) {
      g.wave++;
      g.zombieSpawned = 0;
      g.waveTimer = 0;
      setWave(g.wave);
    }
 
    if (g.zombies.some(z => z.x < 10)) {
      g.gameState = 'lost';
      setGameState('lost');
    }
 
    setSun(g.sun);
  }, [ROWS, CELL_HEIGHT, CANVAS_WIDTH, CELL_WIDTH]);
 
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
 
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
 
      // Check for sun drop clicks (larger hitbox for easier tapping)
      for (let drop of gameRef.current.sunDrops) {
        const dist = Math.sqrt((drop.x - x) ** 2 + (drop.y - y) ** 2);
        if (dist < 30 && !drop.collected) {
          drop.collected = true;
          gameRef.current.sun += 25;
          setSun(gameRef.current.sun);
          return;
        }
      }
 
      const col = Math.floor((x - 10) / CELL_WIDTH);
      const row = Math.floor((y - 40) / CELL_HEIGHT);
 
      if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
        const existing = gameRef.current.plants.find(p => p.col === col && p.row === row);
        if (!existing) {
          if (gameRef.current.selectedPlant === 'shooter' && gameRef.current.sun >= 100) {
            gameRef.current.plants.push({ col, row, type: 'shooter', health: 1, shootTimer: 0 });
            gameRef.current.sun -= 100;
            setSun(gameRef.current.sun);
          } else if (gameRef.current.selectedPlant === 'slowmo' && gameRef.current.sun >= 75) {
            gameRef.current.plants.push({ col, row, type: 'slowmo', health: 1 });
            gameRef.current.sun -= 75;
            setSun(gameRef.current.sun);
          }
        }
      }
    };
 
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, []);
 
  useEffect(() => {
    const gameLoop = setInterval(() => {
      updateGame();
      drawGame();
    }, 1000 / 60);
 
    return () => clearInterval(gameLoop);
  }, [updateGame, drawGame]);
 
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#0a1f14', color: '#fff', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>Plants vs Zombies</h1>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
          <div>☀️ Sun: {sun}</div>
          <div>🌊 Wave: {wave}</div>
          <div>🧟 Zombies: {gameRef.current.zombies.length}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              gameRef.current.selectedPlant = gameRef.current.selectedPlant === 'shooter' ? null : 'shooter';
              setGameState(gameState);
            }}
            style={{
              padding: '10px 15px',
              backgroundColor: gameRef.current.selectedPlant === 'shooter' ? '#90EE90' : '#333',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🌻 Shooter (100)
          </button>
          <button
            onClick={() => {
              gameRef.current.selectedPlant = gameRef.current.selectedPlant === 'slowmo' ? null : 'slowmo';
              setGameState(gameState);
            }}
            style={{
              padding: '10px 15px',
              backgroundColor: gameRef.current.selectedPlant === 'slowmo' ? '#FFB6C1' : '#333',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🌹 Slowmo (75)
          </button>
        </div>
      </div>
 
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '2px solid #444',
          backgroundColor: '#1a472a',
          display: 'block',
          marginBottom: '20px',
        }}
      />
 
      {gameState === 'lost' && (
        <div style={{ fontSize: '20px', color: '#ff6b6b', fontWeight: 'bold' }}>
          Game Over! Zombies reached your house.
          <button onClick={() => window.location.reload()} style={{ marginLeft: '10px', padding: '10px' }}>
            Restart
          </button>
        </div>
      )}
 
      <p style={{ fontSize: '12px', color: '#aaa' }}>
        Click a plant button to select it, then click on the grid to place. Shooter plants shoot zombies; slowmo plants slow them down (coming soon!).
      </p>
    </div>
  );
};
 
export default PvZGame;
 
