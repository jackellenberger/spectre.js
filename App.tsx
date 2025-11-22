import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Controls } from './components/Controls';
import { TileSystem, TileType, ColorTheme, Matrix, ColorScheme } from './types';
import { 
  buildSpectreBase, 
  buildHatTurtleBase, 
  buildHexBase, 
  buildSupertiles 
} from './utils/spectre';
import { 
  COL_MAP_PRIDE, 
  COL_MAP_MYSTICS, 
  COL_MAP_53, 
  COL_MAP_ORIG 
} from './constants';
import { IDENTITY, mul, ttrans, inv, transPt, mag } from './utils/geometry';

export default function App() {
  // State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sys, setSys] = useState<TileSystem | null>(null);
  const [tileType, setTileType] = useState<TileType>('Spectres');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('Pride');
  const [activeTile, setActiveTile] = useState<string>('Delta');
  const [subLevel, setSubLevel] = useState(0);

  // Viewport State (Refs for performance during render loop)
  const transformRef = useRef<Matrix>([20, 0, 0, 0, -20, 0]); // Initial transform
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  
  // --- Initialization & Logic ---

  const initSystem = useCallback((type: TileType) => {
    let newSys: TileSystem;
    if (type === 'Hexagons') newSys = buildHexBase();
    else if (type === 'Turtles in Hats') newSys = buildHatTurtleBase(true);
    else if (type === 'Hats in Turtles') newSys = buildHatTurtleBase(false);
    else if (type === 'Spectres') newSys = buildSpectreBase(true);
    else newSys = buildSpectreBase(false); // Tile(1,1)
    
    setSys(newSys);
    setSubLevel(0);
    
    // Reset view slightly
    transformRef.current = [20, 0, 0, 0, -20, 0]; 
  }, []);

  useEffect(() => {
    initSystem(tileType);
  }, [tileType, initSystem]);

  const handleSubstitute = () => {
    if (!sys) return;
    const newSys = buildSupertiles(sys);
    setSys(newSys);
    setSubLevel(prev => prev + 1);
    
    // Zoom out slightly to fit the larger pattern
    const scaleFactor = 0.4; 
    const current = transformRef.current;
    // Simple scale around center roughly
    transformRef.current = [
        current[0] * scaleFactor, current[1] * scaleFactor, current[2],
        current[3] * scaleFactor, current[4] * scaleFactor, current[5]
    ];
  };

  const handleReset = () => {
    initSystem(tileType);
  };

  const getColorMap = (): ColorScheme => {
    switch (colorTheme) {
      case 'Figure 5.3': return COL_MAP_53;
      case 'Bright': return COL_MAP_ORIG;
      case 'Mystics': return COL_MAP_MYSTICS;
      default: return COL_MAP_PRIDE;
    }
  };

  // --- Rendering Loop ---

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sys) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      if (!canvas || !ctx || !sys) return;
      
      // Handle High DPI
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // Only resize if strictly necessary to avoid flicker/perf hit
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
      }

      // Clear background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Setup coordinate system (center origin + transform)
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      const mat = transformRef.current;
      ctx.transform(mat[0], mat[1], mat[3], mat[4], mat[2], mat[5]);

      // Draw active tile
      if (sys[activeTile]) {
        sys[activeTile].draw(ctx, IDENTITY, getColorMap());
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [sys, activeTile, colorTheme]);

  // --- Interaction Handlers ---

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); // Prevent browser zoom
    const scale = e.deltaY > 0 ? 0.9 : 1.1;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    // Zoom towards mouse pointer logic
    // 1. Translate mouse to origin
    // 2. Scale
    // 3. Translate origin back
    
    // Simplified affine approach applied to current matrix
    // We want to scale 'around' the mouse point in screen space (relative to center)
    // But since we simply apply the matrix, we can just scale the matrix components
    // and adjust translation to compensate.
    
    const current = transformRef.current;
    
    // Inverse transform mouse to world
    const invMat = inv(current);
    const worldMouse = transPt(invMat, {x: mouseX, y: mouseY});

    // New matrix with scaled basis vectors
    const newMat: Matrix = [
        current[0] * scale, current[1] * scale, current[2],
        current[3] * scale, current[4] * scale, current[5]
    ];

    // Calculate new translation so that worldMouse is still at mouseX, mouseY
    const newWorldMouseProjected = transPt(newMat, worldMouse);
    newMat[2] += (mouseX - newWorldMouseProjected.x);
    newMat[5] += (mouseY - newWorldMouseProjected.y);

    transformRef.current = newMat;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    
    // Apply panning directly to the matrix translation components
    // Note: Since we render with `ctx.translate(width/2, height/2)` first,
    // the matrix translation [2] and [5] are added to that center offset.
    // We can simply add dx, dy to the translation part of the matrix because
    // the matrix represents the "World to Screen(Centered)" transform.
    
    transformRef.current[2] += dx;
    transformRef.current[5] += dy;

    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  // --- Export ---

  const exportPNG = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `spectre-tiling-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const exportSVG = () => {
    if (!sys) return;
    const svgContent = sys[activeTile].getSVG(transformRef.current, getColorMap());
    const w = canvasRef.current?.width || 800;
    const h = canvasRef.current?.height || 600;
    
    const svgFile = `
      <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(${w/2},${h/2})">
           ${svgContent}
        </g>
      </svg>
    `;
    
    const blob = new Blob([svgFile], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spectre-tiling-${Date.now()}.svg`;
    link.click();
  };

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden font-sans">
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none cursor-move"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      <Controls 
        tileType={tileType}
        onTileTypeChange={setTileType}
        colorTheme={colorTheme}
        onColorThemeChange={setColorTheme}
        activeTile={activeTile}
        onActiveTileChange={setActiveTile}
        substitutionLevel={subLevel}
        onSubstitute={handleSubstitute}
        onReset={handleReset}
        onExportPNG={exportPNG}
        onExportSVG={exportSVG}
      />
    </div>
  );
}
