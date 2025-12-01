
import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface MenuItem {
  label?: string;
  action?: string;
  shortcut?: string;
  disabled?: boolean;
  type?: 'separator';
  submenu?: MenuItem[];
}

interface MenuBarProps {
  onAction: (action: string) => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({ onAction }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null); // Track open submenus by label
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setActiveSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New Project', action: 'file-new', shortcut: 'Ctrl+N' },
      { 
        label: 'Export As', 
        submenu: [
          { label: 'PNG Image (*.png)', action: 'file-export-png' },
          { label: 'JPEG Image (*.jpg)', action: 'file-export-jpg' },
          { label: 'Bitmap (*.bmp)', action: 'file-export-bmp' },
          { label: 'GIF Image (*.gif)', action: 'file-export-gif' },
          { label: 'Raw Pixel Data (*.raw)', action: 'file-export-raw' },
        ] 
      },
      { type: 'separator' },
      { label: 'Exit', action: 'file-exit' }
    ],
    Edit: [
      { label: 'Undo', action: 'edit-undo', disabled: true },
      { label: 'Redo', action: 'edit-redo', disabled: true },
      { type: 'separator' },
      { label: 'Delete Selected Layer', action: 'edit-delete-layer' },
      { label: 'Clear All Layers', action: 'edit-clear' }
    ],
    Module: [
      { label: 'Model: Gemini Flash', action: 'module-flash' },
      { label: 'Model: Gemini Pro', action: 'module-pro' },
      { label: 'Model: Custom (Stable Diffusion)', action: 'module-custom' },
      { type: 'separator' },
      { label: 'AI Training Profile', action: 'module-training' }
    ],
    Actions: [
      { label: 'Merge Visible Layers', action: 'action-merge' },
      { label: 'Generate Material', action: 'action-material' },
      { label: 'Add AI Filter', action: 'action-ai-filter' }
    ],
    Help: [
      { label: 'About Diffusion Studio', action: 'help-about' }
    ]
  };

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item, idx) => {
      if (item.type === 'separator') {
        return <div key={idx} className="h-px bg-slate-600 my-1 mx-2"></div>;
      }
      
      const hasSubmenu = item.submenu && item.submenu.length > 0;
      const isSubmenuOpen = activeSubmenu === item.label;

      return (
        <div 
          key={idx} 
          className="relative group/item"
          onMouseEnter={() => hasSubmenu && setActiveSubmenu(item.label || null)}
          onMouseLeave={() => hasSubmenu && setActiveSubmenu(null)}
        >
          <button
            className={`w-full text-left px-4 py-1.5 hover:bg-brand-600 hover:text-white flex justify-between items-center ${item.disabled ? 'opacity-50 cursor-default hover:bg-transparent hover:text-slate-400' : 'text-slate-200'}`}
            onClick={(e) => {
              if (item.disabled) return;
              if (hasSubmenu) {
                 e.stopPropagation(); // Keep menu open
                 return;
              }
              onAction(item.action || '');
              setActiveMenu(null);
              setActiveSubmenu(null);
            }}
          >
            <span className="flex items-center gap-2">
               {item.label}
            </span>
            {item.shortcut && <span className="text-[10px] text-slate-500 group-hover:text-slate-300 ml-4">{item.shortcut}</span>}
            {hasSubmenu && <ChevronRight className="w-3 h-3 ml-2 text-slate-400" />}
          </button>

          {/* Submenu Dropdown */}
          {hasSubmenu && isSubmenuOpen && (
            <div className="absolute left-full top-0 w-48 bg-[#2d3748] shadow-xl border border-slate-600 rounded-sm py-1 ml-0.5 z-[60]">
               {renderMenuItems(item.submenu!)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-8 bg-[#1e293b] flex items-center px-2 text-xs select-none border-b border-black" ref={menuRef}>
      {Object.entries(menus).map(([name, items]) => (
        <div key={name} className="relative">
          <button
            className={`px-3 py-1.5 hover:bg-slate-700 rounded-sm transition-colors text-slate-300 ${activeMenu === name ? 'bg-slate-700 text-white' : ''}`}
            onClick={() => {
               setActiveMenu(activeMenu === name ? null : name);
               setActiveSubmenu(null);
            }}
            onMouseEnter={() => {
               if (activeMenu) {
                 setActiveMenu(name);
                 setActiveSubmenu(null);
               }
            }}
          >
            {name}
          </button>
          
          {activeMenu === name && (
            <div className="absolute top-full left-0 w-56 bg-[#2d3748] shadow-xl border border-slate-600 rounded-sm py-1 z-50">
              {renderMenuItems(items)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
