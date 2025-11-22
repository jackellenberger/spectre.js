import React from 'react';
import { TileType, ColorTheme } from '../types';
import { TILE_NAMES } from '../constants';

interface ControlsProps {
  tileType: TileType;
  onTileTypeChange: (t: TileType) => void;
  
  colorTheme: ColorTheme;
  onColorThemeChange: (c: ColorTheme) => void;
  
  activeTile: string;
  onActiveTileChange: (t: string) => void;

  substitutionLevel: number;
  onSubstitute: () => void;
  onReset: () => void;

  onExportPNG: () => void;
  onExportSVG: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  tileType,
  onTileTypeChange,
  colorTheme,
  onColorThemeChange,
  activeTile,
  onActiveTileChange,
  substitutionLevel,
  onSubstitute,
  onReset,
  onExportPNG,
  onExportSVG
}) => {
  return (
    <div className="absolute top-4 left-4 w-80 bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-gray-200 flex flex-col gap-5 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Spectre Explorer</h1>
        <p className="text-xs text-gray-500 mt-1">Visualization of chiral aperiodic monotiles</p>
      </div>

      {/* Shape Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Shape</label>
        <select 
          className="w-full p-2 rounded-lg bg-gray-50 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={tileType}
          onChange={(e) => onTileTypeChange(e.target.value as TileType)}
        >
          <option value="Spectres">Spectres (Curved)</option>
          <option value="Tile(1,1)">Tile(1,1) (Polygonal)</option>
          <option value="Hexagons">Hexagons</option>
          <option value="Turtles in Hats">Turtles in Hats</option>
          <option value="Hats in Turtles">Hats in Turtles</option>
        </select>
      </div>

      {/* Substitution Control */}
      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-900">Iteration Level</span>
          <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded-full">{substitutionLevel}</span>
        </div>
        <button 
          onClick={onSubstitute}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md transition-colors"
        >
          Grow Pattern (Substitute)
        </button>
        <button 
          onClick={onReset}
          className="w-full py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Appearance */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Appearance</label>
        <div className="grid grid-cols-2 gap-2">
           <div className="flex flex-col gap-1">
             <span className="text-xs text-gray-400">Active Group</span>
             <select 
              className="w-full p-2 rounded-lg bg-gray-50 border border-gray-300 text-sm"
              value={activeTile}
              onChange={(e) => onActiveTileChange(e.target.value)}
            >
              {TILE_NAMES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
           </div>
           <div className="flex flex-col gap-1">
             <span className="text-xs text-gray-400">Theme</span>
             <select 
              className="w-full p-2 rounded-lg bg-gray-50 border border-gray-300 text-sm"
              value={colorTheme}
              onChange={(e) => onColorThemeChange(e.target.value as ColorTheme)}
            >
              <option value="Pride">Pride</option>
              <option value="Mystics">Mystics</option>
              <option value="Figure 5.3">Earth Tones</option>
              <option value="Bright">Bright</option>
            </select>
           </div>
        </div>
      </div>

      {/* Export */}
      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
         <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Export</label>
         <div className="grid grid-cols-2 gap-2">
            <button onClick={onExportPNG} className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
              Save PNG
            </button>
            <button onClick={onExportSVG} className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
              Save SVG
            </button>
         </div>
      </div>

      <div className="text-[10px] text-gray-400 text-center mt-2">
        Scroll/Pinch to Zoom • Drag to Pan
      </div>
    </div>
  );
};
