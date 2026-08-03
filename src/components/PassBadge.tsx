/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, RefObject, ReactNode, MouseEvent } from 'react';
import { Visitor, BrandingConfig, ElementPosition } from '../types';
import { ShieldCheck, Calendar, MapPin, Briefcase, Printer, QrCode, Phone, CheckCircle, Ban } from 'lucide-react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

const getDisplayPhotoUrl = (url: string | null | undefined): string => {
  if (!url) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  if (url.startsWith('/api/photo/')) {
    const driveId = url.substring('/api/photo/'.length);
    if (driveId && driveId !== 'local_fallback' && driveId !== 'local_fallback_on_error') {
      const customApiUrl = (import.meta as any).env?.VITE_API_URL;
      if (customApiUrl) {
        return `${customApiUrl}${url}`;
      }
      if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
        return `https://cdc-gate-pass-421795389485.us-west1.run.app${url}`;
      }
      return url;
    }
  }
  return url;
};

interface DraggableElementProps {
  elementKey: string;
  position: ElementPosition;
  onUpdate: (key: string, newPos: ElementPosition) => void;
  isDesigner: boolean;
  label: string;
  cardRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

export function DraggableElement({
  elementKey,
  position,
  onUpdate,
  isDesigner,
  label,
  cardRef,
  children,
}: DraggableElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0 });

  if (!isDesigner) {
    return (
      <div
        className="absolute"
        style={{
          left: `${position.left}%`,
          top: `${position.top}%`,
          width: `${position.width}%`,
          height: `${position.height}%`,
        }}
      >
        {children}
      </div>
    );
  }

  const handleMouseDownDrag = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cardRef.current) return;
    setIsDragging(true);
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: position.left,
      top: position.top,
      width: position.width,
      height: position.height,
    };
  };

  const handleMouseDownResize = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cardRef.current) return;
    setIsResizing(true);
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: position.left,
      top: position.top,
      width: position.width,
      height: position.height,
    };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - startPosRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - startPosRef.current.y) / rect.height) * 100;

      if (isDragging) {
        let newLeft = startPosRef.current.left + deltaX;
        let newTop = startPosRef.current.top + deltaY;

        newLeft = Math.max(0, Math.min(100 - position.width, newLeft));
        newTop = Math.max(0, Math.min(100 - position.height, newTop));

        onUpdate(elementKey, {
          ...position,
          left: Math.round(newLeft),
          top: Math.round(newTop),
        });
      } else if (isResizing) {
        let newWidth = startPosRef.current.width + deltaX;
        let newHeight = startPosRef.current.height + deltaY;

        newWidth = Math.max(5, Math.min(100 - position.left, newWidth));
        newHeight = Math.max(5, Math.min(100 - position.top, newHeight));

        onUpdate(elementKey, {
          ...position,
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, position, onUpdate, elementKey, cardRef]);

  return (
    <div
      className={`absolute select-none group border border-dashed rounded transition-colors ${
        isDragging || isResizing ? 'border-emerald-500 bg-emerald-500/10 z-50 animate-pulse' : 'border-blue-500/40 hover:border-blue-500 hover:bg-blue-500/5 z-20'
      }`}
      style={{
        left: `${position.left}%`,
        top: `${position.top}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
      }}
    >
      {/* Drag Label and Move cursor */}
      <div
        onMouseDown={handleMouseDownDrag}
        className="w-full h-full cursor-move relative overflow-hidden flex flex-col justify-start items-start p-1"
        title="ลากเพื่อย้ายตำแหน่ง"
      >
        <span className="absolute top-0 left-0 bg-blue-600/85 text-[8px] text-white font-bold px-1 rounded-br pointer-events-none uppercase tracking-widest z-10 select-none">
          {label}
        </span>
        <div className="w-full h-full pt-3 opacity-95 overflow-hidden pointer-events-none">
          {children}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDownResize}
        className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 hover:bg-emerald-500 cursor-se-resize rounded-tl flex items-center justify-center z-50 shadow-md"
        title="ลากเพื่อยืด/หด ขนาด"
      >
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 13l-6 6m6-6l-6-6" />
        </svg>
      </div>
    </div>
  );
}

interface PassBadgeProps {
  visitor: Visitor;
  config: BrandingConfig;
  isDesigner?: boolean;
  onUpdateTemplate?: (updatedTemplate: any) => void;
}

export default function PassBadge({ visitor, config, isDesigner, onUpdateTemplate }: PassBadgeProps) {
  const primaryBg = config.primaryColor || '#0f172a';
  const accentText = config.accentColor || '#3b82f6';

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.error('Error triggering window.print:', err);
      alert('ระบบพิมพ์ไม่รองรับบนเบราว์เซอร์นี้ กรุณาใช้ปุ่ม "ดาวน์โหลดรูปภาพ" แทน');
    }
  };

  const defaultTemplate = {
    layout: 'vertical' as 'vertical' | 'horizontal' | 'custom' | 'receipt',
    badgeWidth: '380px',
    fontSize: 'base' as 'sm' | 'base' | 'lg' | 'xl',
    textColor: '#ffffff',
    bgColor: '#0f172a',
    borderColor: '#3b82f6',
    borderWidth: '2px' as '0px' | '1px' | '2px' | '4px' | '8px',
    borderRadius: 'lg' as 'none' | 'sm' | 'md' | 'lg' | 'full',
    headerText: 'บัตรผ่านเข้า-ออก Visitor Pass',
    footerText: 'กรุณาติดบัตรตลอดเวลาที่อยู่ในพื้นที่',
    showQrCode: true,
    showPhoto: true,
    showContactArea: true,
    showCompany: true,
    showVehiclePlate: true,
    showTimeIn: true,
    watermarkText: 'APPROVED',
    signatureLine: true,
    securityNotice: 'บัตรนี้เป็นทรัพย์สินของบริษัทฯ กรุณาคืน ณ จุดแลกบัตรเมื่อเดินทางออก',
    fontFamily: 'Inter',
    lineHeight: 'normal' as 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose',
  };

  const template = {
    ...defaultTemplate,
    ...(config.passTemplate || {}),
    layout: 'receipt' as 'vertical' | 'horizontal' | 'custom' | 'receipt'
  };

  const fontStyleMap: Record<string, string> = {
    'Sarabun': "'Sarabun', sans-serif",
    'Kanit': "'Kanit', sans-serif",
    'Prompt': "'Prompt', sans-serif",
    'Chonburi': "'Chonburi', serif",
    'Inter': "'Inter', sans-serif",
    'IBM Plex Sans Thai': "'IBM Plex Sans Thai', sans-serif",
    'JetBrains Mono': "'JetBrains Mono', monospace",
  };

  const lineHeightMap: Record<string, string> = {
    tight: '1.1',
    snug: '1.25',
    normal: '1.5',
    relaxed: '1.75',
    loose: '2.0',
  };

  const cardFamily = fontStyleMap[template.fontFamily || 'Inter'] || 'inherit';
  const cardLineHeight = lineHeightMap[template.lineHeight || 'normal'] || '1.5';

  const handleDownloadImage = async () => {
    // Helper function to safely replace oklch/oklab color functions
    const replaceColorFunctions = (cssText: string): string => {
      let result = cssText;
      const replaceFunc = (funcName: string) => {
        let index = result.indexOf(funcName + '(');
        while (index !== -1) {
          let openBrackets = 1;
          let i = index + funcName.length + 1;
          while (i < result.length && openBrackets > 0) {
            if (result[i] === '(') openBrackets++;
            else if (result[i] === ')') openBrackets--;
            i++;
          }
          const fullMatch = result.substring(index, i);
          let fallbackColor = 'rgb(15, 23, 42)';
          if (fullMatch.includes('/')) {
            fallbackColor = 'rgba(15, 23, 42, 0.5)';
          }
          result = result.substring(0, index) + fallbackColor + result.substring(i);
          index = result.indexOf(funcName + '(');
        }
      };
      replaceFunc('oklch');
      replaceFunc('oklab');
      return result;
    };

    const originalStyleContents = new Map<HTMLStyleElement, string>();
    const deletedRules: { sheet: CSSStyleSheet; ruleText: string; index: number }[] = [];
    
    try {
      // 1. Temporarily backup and clean main document style tags
      const styleElements = Array.from(document.querySelectorAll('style'));
      styleElements.forEach(style => {
        if (style.textContent && (style.textContent.includes('oklch') || style.textContent.includes('oklab'))) {
          originalStyleContents.set(style, style.textContent);
          style.textContent = replaceColorFunctions(style.textContent);
        }
      });

      // 2. Temporarily delete rules in main document stylesheets containing oklch/oklab
      for (let s = 0; s < document.styleSheets.length; s++) {
        const sheet = document.styleSheets[s];
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) continue;
          for (let i = rules.length - 1; i >= 0; i--) {
            const rule = rules[i];
            if (rule.cssText && (rule.cssText.includes('oklch') || rule.cssText.includes('oklab'))) {
              deletedRules.push({ sheet, ruleText: rule.cssText, index: i });
              sheet.deleteRule(i);
            }
          }
        } catch (e) {
          // Ignore cross-origin access errors
        }
      }

      const element = document.getElementById(`visitor-pass-${visitor.id}`);
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: template.bgColor || '#0f172a',
        scale: 2, // High resolution capture
        logging: false,
        onclone: (clonedDoc) => {
          // Double safeguard on cloned document style tags
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach(style => {
            if (style.innerHTML && (style.innerHTML.includes('oklch') || style.innerHTML.includes('oklab'))) {
              style.innerHTML = replaceColorFunctions(style.innerHTML);
            }
          });

          // Double safeguard on cloned stylesheet rules
          const styleSheets = Array.from(clonedDoc.styleSheets);
          for (const sheet of styleSheets) {
            try {
              const rules = sheet.cssRules || sheet.rules;
              if (!rules) continue;
              for (let i = rules.length - 1; i >= 0; i--) {
                const rule = rules[i];
                if (rule.cssText && (rule.cssText.includes('oklch') || rule.cssText.includes('oklab'))) {
                  sheet.deleteRule(i);
                }
              }
            } catch (e) {
              // Ignore cross-origin
            }
          }
        }
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `visitor-pass-${visitor.name.replace(/\s+/g, '_') || visitor.id}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('ไม่สามารถสร้างรูปภาพได้บนเบราว์เซอร์นี้ กรุณาแคปหน้าจอ เพื่อบันทึกใบผ่านแทน');
    } finally {
      // 3. Restore all original styles
      originalStyleContents.forEach((content, style) => {
        style.textContent = content;
      });

      // 4. Restore deleted stylesheet rules in ascending order of indexes
      deletedRules.sort((a, b) => a.index - b.index);
      deletedRules.forEach(({ sheet, ruleText, index }) => {
        try {
          sheet.insertRule(ruleText, index);
        } catch (e) {
          // Fallback if index shift happens or error occurs
          try {
            sheet.insertRule(ruleText, sheet.cssRules.length);
          } catch (innerErr) {
            // Silently swallow restore errors
          }
        }
      });
    }
  };

  const defaultPositions = {
    header: { left: 0, top: 0, width: 100, height: 16 },
    photo: { left: 8, top: 18, width: 38, height: 26 },
    qrCode: { left: 54, top: 18, width: 38, height: 26 },
    visitorInfo: { left: 5, top: 46, width: 90, height: 12 },
    detailsGrid: { left: 5, top: 60, width: 90, height: 22 },
    signatures: { left: 5, top: 84, width: 90, height: 8 },
    securityNotice: { left: 0, top: 93, width: 100, height: 4 },
    footer: { left: 0, top: 97, width: 100, height: 3 }
  };

  const positions = {
    ...defaultPositions,
    ...(template.positions || {})
  };

  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleUpdatePosition = (key: string, newPos: ElementPosition) => {
    if (!onUpdateTemplate) return;
    onUpdateTemplate({
      ...template,
      positions: {
        ...positions,
        [key]: newPos
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked-in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" /> CHECKED-IN
          </span>
        );
      case 'checked-out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <CheckCircle className="w-3 h-3" /> CHECKED-OUT
          </span>
        );
      case 'banned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
            <Ban className="w-3 h-3" /> BANNED
          </span>
        );
      default:
        return null;
    }
  };

  // Construct URL for the dynamic QR code generation with client-side & static host fallbacks
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(() => {
    const text = visitor.id || '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}`;
  });

  useEffect(() => {
    const text = visitor.id || '';
    if (!text) return;

    // Generate local QR code base64 Data URL directly in browser
    QRCode.toDataURL(text, { margin: 1, width: 300, errorCorrectionLevel: 'M' })
      .then((dataUrl) => {
        setQrCodeUrl(dataUrl);
      })
      .catch(() => {
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}`);
      });
  }, [visitor.id]);

  const isReceipt = template.layout === 'receipt';
  // Force clean, all-white card background and black text
  const isLightBg = true;
  const subtextColor = '#000000'; // Forced to pure black to avoid fading on thermal printers
  const labelColor = '#000000'; // Forced to pure black to avoid fading on thermal printers
  const sectionBorderColor = '#000000'; // Solid black borders for sharp thermal printing
  const renderTextColor = '#000000'; // Solid black text for ultimate readability
  const renderAccentColor = '#000000'; // Pure black for icons and accents to avoid fading

  const cardWidth = isReceipt ? '220px' : (template.layout === 'horizontal' ? '520px' : (template.badgeWidth || '380px'));

  return (
    <div className="flex flex-col items-center gap-6 w-full mx-auto" style={{ maxWidth: cardWidth }}>
      {/* Printable Area */}
      <div 
        id={`visitor-pass-${visitor.id}`}
        ref={cardRef}
        className={`print-area w-full overflow-hidden transition duration-300 flex flex-col relative ${isReceipt ? 'shadow-none border-dashed' : 'shadow-2xl'}`}
        style={{ 
          fontFamily: cardFamily,
          lineHeight: cardLineHeight,
          backgroundColor: '#ffffff', 
          color: '#000000',
          borderColor: '#cbd5e1',
          borderWidth: '1px',
          borderStyle: isReceipt ? 'dashed' : 'solid',
          borderRadius: isReceipt ? '0px' : (
                        template.borderRadius === 'none' ? '0px' : 
                        template.borderRadius === 'sm' ? '8px' :
                        template.borderRadius === 'md' ? '16px' :
                        template.borderRadius === 'lg' ? '24px' : '40px'
          ),
          height: template.layout === 'custom' ? (template.badgeHeight || '620px') : undefined,
          position: 'relative'
        }}
      >
        {/* Background Watermark */}
        {template.watermarkText && !isReceipt && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
            <span 
              className="text-[4.5rem] font-black uppercase tracking-widest -rotate-30 leading-none select-none"
              style={{ color: isLightBg ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.03)' }}
            >
              {template.watermarkText}
            </span>
          </div>
        )}

        {/* Pass Body */}
        {template.layout === 'custom' ? (
          /* CUSTOM ABSOLUTE DRAG & RESIZE LAYOUT */
          <div className="w-full h-full relative z-10 overflow-hidden">
            {/* Header */}
            <DraggableElement
              elementKey="header"
              position={positions.header}
              onUpdate={handleUpdatePosition}
              isDesigner={!!isDesigner}
              label="ส่วนหัว"
              cardRef={cardRef}
            >
              <div 
                className="w-full h-full flex flex-col items-center justify-center text-center p-2 relative"
                style={{ 
                  background: '#ffffff',
                }}
              >
                <ShieldCheck className="absolute top-2 right-2 w-4 h-4 opacity-20 text-black" />
                <div className="flex items-center gap-1.5 justify-center mb-1 max-w-full overflow-hidden">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="w-6 h-6 object-contain rounded bg-white/10 p-0.5" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-black flex items-center justify-center text-white font-black text-[10px]">MG</div>
                  )}
                  <span className="text-[10px] font-black tracking-wide uppercase truncate" style={{ color: renderTextColor }}>
                    {config.organizationName}
                  </span>
                </div>
                <h2 className="text-xs font-black tracking-widest uppercase text-center" style={{ color: renderAccentColor }}>
                  {template.headerText || 'บัตรผ่านเข้า-ออกพื้นที่'}
                </h2>
              </div>
            </DraggableElement>

            {/* Photo */}
            {template.showPhoto && (
              <DraggableElement
                elementKey="photo"
                position={positions.photo}
                onUpdate={handleUpdatePosition}
                isDesigner={!!isDesigner}
                label="รูปถ่าย"
                cardRef={cardRef}
              >
                <div className="w-full h-full flex items-center justify-center relative p-1">
                  <div className="w-full h-full rounded-xl overflow-hidden border shadow-inner flex items-center justify-center bg-slate-900/40" style={{ borderColor: sectionBorderColor }}>
                    <img 
                      src={getDisplayPhotoUrl(visitor.photoUrl)} 
                      alt={visitor.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 shadow-md">
                    {getStatusBadge(visitor.status)}
                  </div>
                </div>
              </DraggableElement>
            )}

            {/* QR Code */}
            {template.showQrCode && (
              <DraggableElement
                elementKey="qrCode"
                position={positions.qrCode}
                onUpdate={handleUpdatePosition}
                isDesigner={!!isDesigner}
                label="คิวอาร์"
                cardRef={cardRef}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-1">
                  <div className="p-1 bg-white rounded-lg shadow-inner border border-black h-[calc(100%-12px)] aspect-square flex items-center justify-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code Pass ID" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(visitor.id || '')}`;
                      }}
                    />
                  </div>
                  <p className="text-[8px] font-mono font-black tracking-wider text-center mt-0.5" style={{ color: renderAccentColor }}>{visitor.id}</p>
                </div>
              </DraggableElement>
            )}

            {/* Visitor Info */}
            <DraggableElement
              elementKey="visitorInfo"
              position={positions.visitorInfo}
              onUpdate={handleUpdatePosition}
              isDesigner={!!isDesigner}
              label="ชื่อผู้ถือบัตร"
              cardRef={cardRef}
            >
              <div className="w-full h-full flex flex-col justify-center items-center text-center px-2">
                <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: labelColor }}>ผู้ถือบัตรผ่าน</span>
                <h3 className="text-sm font-black leading-none truncate w-full" style={{ color: renderTextColor }}>{visitor.name}</h3>
                {template.showCompany && visitor.company && (
                  <p className="text-[9px] font-black truncate w-full mt-0.5" style={{ color: subtextColor }}>{visitor.company}</p>
                )}
              </div>
            </DraggableElement>

            {/* Details Grid */}
            <DraggableElement
              elementKey="detailsGrid"
              position={positions.detailsGrid}
              onUpdate={handleUpdatePosition}
              isDesigner={!!isDesigner}
              label="ตารางข้อมูล"
              cardRef={cardRef}
            >
              <div className="w-full h-full grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] p-2 border rounded-xl overflow-y-auto border-black" style={{ borderColor: sectionBorderColor }}>
                {template.showContactArea && (
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: labelColor }}>พื้นที่ติดต่อ</span>
                    <div className="font-black flex items-center gap-0.5 truncate" style={{ color: renderTextColor }}>
                      <MapPin className="w-2.5 h-2.5 shrink-0" style={{ color: renderAccentColor }} />
                      <span className="truncate">{visitor.contactArea}</span>
                    </div>
                  </div>
                )}

                {template.showVehiclePlate && (
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: labelColor }}>ทะเบียนรถ</span>
                    <div className="font-black font-mono truncate" style={{ color: renderTextColor }}>
                      {visitor.vehiclePlate || 'ไม่มี'}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: labelColor }}>ประเภทผู้ติดต่อ</span>
                  <div className="font-black flex items-center gap-0.5 truncate" style={{ color: renderTextColor }}>
                    <Briefcase className="w-2.5 h-2.5 shrink-0" style={{ color: renderAccentColor }} />
                    <span className="truncate">{visitor.visitorType}</span>
                  </div>
                </div>

                {template.showTimeIn && (
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: labelColor }}>ออกเอกสารเมื่อ</span>
                    <div className="font-black flex items-center gap-0.5 truncate" style={{ color: renderTextColor }}>
                      <Calendar className="w-2.5 h-2.5 shrink-0" style={{ color: renderAccentColor }} />
                      <span className="truncate">{new Date(visitor.registeredAt).toLocaleDateString('th-TH', { dateStyle: 'short' })}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-0.5 overflow-hidden col-span-2 border-t border-black pt-1 mt-0.5">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold" style={{ color: labelColor }}>ออกใบผ่านโดย</span>
                  <div className="font-black flex items-center gap-0.5 truncate" style={{ color: renderTextColor, fontSize: '8px' }}>
                    <span className="truncate">{visitor.registeredBy || 'ระบบอัตโนมัติ'}</span>
                  </div>
                </div>
              </div>
            </DraggableElement>

            {/* Signatures */}
            {template.signatureLine && (
              <DraggableElement
                elementKey="signatures"
                position={positions.signatures}
                onUpdate={handleUpdatePosition}
                isDesigner={!!isDesigner}
                label="เซ็นชื่อ"
                cardRef={cardRef}
              >
                <div className="w-full h-full grid grid-cols-2 gap-2 px-2">
                  <div className="flex flex-col items-center gap-0.5 text-center justify-end">
                    <div className="w-full border-b border-dotted h-3 border-black" style={{ borderColor: '#000000' }}></div>
                    <span className="text-[7px] uppercase tracking-wider font-black" style={{ color: labelColor }}>ผู้ติดต่อ</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 text-center justify-end">
                    <div className="w-full border-b border-dotted h-3 border-black" style={{ borderColor: '#000000' }}></div>
                    <span className="text-[7px] uppercase tracking-wider font-black" style={{ color: labelColor }}>เจ้าหน้าที่</span>
                  </div>
                </div>
              </DraggableElement>
            )}


          </div>
        ) : template.layout === 'horizontal' ? (
          /* HORIZONTAL LAYOUT */
          <div className="p-6 flex gap-6 relative z-10">
            {/* Left Side: Photo and QR code */}
            <div className="flex flex-col items-center gap-4 border-r pr-6 border-black" style={{ borderColor: sectionBorderColor, width: '160px' }}>
              {template.showPhoto && (
                <div className="relative">
                  <div className="w-28 h-28 rounded-xl overflow-hidden border-2 shadow-inner flex-shrink-0 border-black" style={{ backgroundColor: '#ffffff', borderColor: '#000000' }}>
                    <img 
                      src={getDisplayPhotoUrl(visitor.photoUrl)} 
                      alt={visitor.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-md">
                    {getStatusBadge(visitor.status)}
                  </div>
                </div>
              )}

              {template.showQrCode && (
                <div className="p-1.5 bg-white rounded-xl shadow-inner border border-black flex-shrink-0 mt-2">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code Pass ID" 
                    className="w-24 h-24 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(visitor.id || '')}`;
                    }}
                  />
                </div>
              )}
            </div>

            {/* Right Side: Details & Signatures */}
            <div className="flex-1 flex flex-col justify-between gap-4">
              <div>
                <div className="mb-3 text-black">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>ชื่อผู้เข้าติดต่อ</span>
                  <h3 className="text-lg font-black leading-tight text-black" style={{ color: renderTextColor }}>{visitor.name}</h3>
                  {template.showCompany && visitor.company && (
                    <p className="text-xs font-black mt-0.5 text-black" style={{ color: subtextColor }}>{visitor.company}</p>
                  )}
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t pt-2 border-black" style={{ borderColor: sectionBorderColor }}>
                  {template.showContactArea && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>พื้นที่ติดต่อ</span>
                      <div className="font-black flex items-center gap-1 text-black" style={{ color: renderTextColor }}>
                        <MapPin className="w-3 h-3 shrink-0" style={{ color: renderAccentColor }} />
                        <span className="truncate">{visitor.contactArea}</span>
                      </div>
                    </div>
                  )}

                  {template.showVehiclePlate && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>ทะเบียนรถ</span>
                      <div className="font-black font-mono text-black" style={{ color: renderTextColor }}>
                        {visitor.vehiclePlate || 'ไม่มี'}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>ประเภทผู้ติดต่อ</span>
                    <div className="font-black flex items-center gap-1 truncate text-black" style={{ color: renderTextColor }}>
                      <Briefcase className="w-3 h-3 shrink-0" style={{ color: renderAccentColor }} />
                      <span className="truncate">{visitor.visitorType}</span>
                    </div>
                  </div>

                  {template.showTimeIn && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>ออกเอกสารเมื่อ</span>
                      <div className="font-black flex items-center gap-1 text-black" style={{ color: renderTextColor }}>
                        <Calendar className="w-3 h-3 shrink-0" style={{ color: renderAccentColor }} />
                        <span>{new Date(visitor.registeredAt).toLocaleDateString('th-TH', { dateStyle: 'short' })}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-0.5 col-span-2 border-t border-black pt-1 mt-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>ออกใบผ่านโดย</span>
                    <div className="font-black flex items-center gap-1 text-black" style={{ color: renderTextColor }}>
                      <span className="truncate">{visitor.registeredBy || 'ระบบอัตโนมัติ'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pass Code string */}
              <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-black">
                <span className="text-[9px] font-black uppercase tracking-widest text-black" style={{ color: labelColor }}>PASS CODE:</span>
                <span className="text-sm font-mono font-black tracking-wider text-black" style={{ color: renderAccentColor }}>{visitor.id}</span>
              </div>

              {/* Signature lines inside body */}
              {template.signatureLine && (
                <div className="grid grid-cols-2 gap-4 mt-2 border-t border-dashed pt-2 border-black" style={{ borderColor: '#000000' }}>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="w-full border-b border-dotted h-4 border-black" style={{ borderColor: '#000000' }}></div>
                    <span className="text-[8px] uppercase tracking-wider font-black text-black" style={{ color: labelColor }}>ผู้ติดต่อ</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="w-full border-b border-dotted h-4 border-black" style={{ borderColor: '#000000' }}></div>
                    <span className="text-[8px] uppercase tracking-wider font-black text-black" style={{ color: labelColor }}>เจ้าหน้าที่</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : template.layout === 'receipt' ? (
          /* THERMAL RECEIPT LAYOUT - 100% OPTIMIZED FOR CARD BADGE HOLDER */
          <div className="p-2.5 flex flex-col items-center bg-white text-black font-mono text-[9px] leading-tight w-full select-none" style={{ color: '#000000' }}>
            {/* Header / Brand */}
            <div className="w-full flex flex-col mb-1">
              <div className="flex items-center gap-2.5 w-full text-left">
                {config.logoUrl && (
                  <img 
                    src={config.logoUrl} 
                    alt="Logo" 
                    className="w-10 h-10 shrink-0 object-contain rounded p-0.5 border border-black/10" 
                    style={{ backgroundColor: '#ffffff' }}
                  />
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-[9.5px] font-black tracking-wider uppercase block truncate max-w-full leading-tight" style={{ color: '#000000' }}>{config.organizationName}</span>
                  <span className="text-[10.5px] font-black tracking-widest mt-0.5 block uppercase leading-none" style={{ color: '#000000' }}>{template.headerText || 'VISITOR PASS'}</span>
                </div>
              </div>
              <div className="w-full border-t border-dashed border-black mt-1.5"></div>
            </div>

            {/* Core Info - Full Width & Clean without Photo */}
            <div className="w-full flex flex-col gap-0.5 text-left mt-1.5 mb-1.5 px-0.5 text-black">
              <span className="text-[10.5px] font-black text-black leading-tight block truncate" style={{ color: '#000000' }} title={visitor.name}>{visitor.name}</span>
              <span className="inline-block text-[7.5px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-sm self-start mt-0.5 leading-none">
                {visitor.visitorType}
              </span>
              {template.showCompany && visitor.company && (
                <span className="text-[8.5px] font-black text-black block truncate mt-0.5" style={{ color: '#000000' }} title={visitor.company}>
                  บริษัท: {visitor.company}
                </span>
              )}
              {template.showContactArea && (
                <span className="text-[8.5px] font-black text-black block truncate mt-0.5" style={{ color: '#000000' }} title={visitor.contactArea}>
                  พื้นที่ติดต่อ: {visitor.contactArea}
                </span>
              )}
            </div>

            {/* Compact Details List */}
            <div className="w-full border-t border-dashed border-black py-1.5 flex flex-col gap-0.5 text-left text-black" style={{ color: '#000000' }}>
              {template.showTimeIn && (
                <div className="flex justify-between items-center">
                  <span className="font-black">ออกเอกสารเมื่อ :</span>
                  <span className="font-black font-mono text-[8px]">{new Date(visitor.registeredAt).toLocaleString('th-TH', { 
                    dateStyle: 'short', 
                    timeStyle: 'short' 
                  })}</span>
                </div>
              )}
              {template.showVehiclePlate && (
                <div className="flex justify-between items-center">
                  <span className="font-black">ทะเบียนรถ :</span>
                  <span className="font-black font-mono text-[8px]">{visitor.vehiclePlate || 'ไม่มี'}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-black">ออกโดย :</span>
                <span className="font-black text-[8px] truncate max-w-[100px]">{visitor.registeredBy || 'ระบบ'}</span>
              </div>
            </div>

            {/* Side-by-Side QR Code & ID */}
            {template.showQrCode && (
              <div className="w-full border-t border-dashed border-black py-1.5 flex items-center justify-between gap-2 text-black" style={{ color: '#000000' }}>
                <div className="p-0.5 bg-white border border-black rounded shrink-0">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-11 h-11 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(visitor.id || '')}`;
                    }}
                  />
                </div>
                <div className="flex-1 flex flex-col items-end justify-center min-w-0">
                  <span className="text-[6.5px] font-black tracking-widest text-black block uppercase leading-none">PASS ID / CODE</span>
                  <span className="text-[9.5px] font-mono font-black tracking-wider border border-dashed border-black px-1.5 py-0.5 bg-white text-right block rounded-sm mt-0.5 w-full truncate" style={{ color: '#000000' }}>{visitor.id}</span>
                </div>
              </div>
            )}

            {/* Compact Dual Signature Lines as original layout */}
            {template.signatureLine && (
              <div className="w-full border-t border-dashed border-black py-1.5 grid grid-cols-2 gap-3.5 text-center text-black" style={{ color: '#000000' }}>
                <div className="flex flex-col items-center justify-end">
                  <div className="w-full border-b border-dotted border-black h-2.5 mb-0.5"></div>
                  <span className="text-[7.5px] font-black text-black leading-tight">ผู้ลงทะเบียน</span>
                </div>
                <div className="flex flex-col items-center justify-end">
                  <div className="w-full border-b border-dotted border-black h-2.5 mb-0.5"></div>
                  <span className="text-[7.5px] font-black text-black leading-tight">เจ้าหน้าที่</span>
                </div>
              </div>
            )}


          </div>
        ) : (
          /* VERTICAL LAYOUT (Default) */
          <div className="p-6 flex flex-col items-center gap-5 relative z-10 text-black">
            {/* Photo and Status */}
            {template.showPhoto && (
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 shadow-inner border-black" style={{ backgroundColor: '#ffffff', borderColor: '#000000' }}>
                  <img 
                    src={getDisplayPhotoUrl(visitor.photoUrl)} 
                    alt={visitor.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-md font-black">
                  {getStatusBadge(visitor.status)}
                </div>
              </div>
            )}

            {/* Visitor Identification */}
            <div className="text-center mt-2 w-full text-black">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>ผู้ถือบัตรผ่าน</span>
              <h3 className="text-lg font-black truncate mt-0.5 text-black" style={{ color: renderTextColor }}>{visitor.name}</h3>
              {template.showCompany && visitor.company && (
                <p className="text-xs font-mono mt-0.5 font-black text-black" style={{ color: subtextColor }}>{visitor.company}</p>
              )}
            </div>

            {/* Pass Details Grid */}
            <div className="w-full grid grid-cols-2 gap-4 text-xs py-4 font-black border-y border-black" style={{ borderColor: sectionBorderColor, color: renderTextColor }}>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>ประเภทผู้ติดต่อ</span>
                <div className="flex items-center gap-1.5 font-black text-black" style={{ color: renderTextColor }}>
                  <Briefcase className="w-3.5 h-3.5 shrink-0" style={{ color: renderAccentColor }} />
                  <span className="truncate">{visitor.visitorType}</span>
                </div>
              </div>

              {template.showContactArea && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>พื้นที่เข้าติดต่อ</span>
                  <div className="flex items-center gap-1.5 font-black text-black" style={{ color: renderTextColor }}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: renderAccentColor }} />
                    <span className="truncate">{visitor.contactArea}</span>
                  </div>
                </div>
              )}

              {template.showVehiclePlate && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>ทะเบียนรถ</span>
                  <div className="font-black font-mono text-xs text-black" style={{ color: renderTextColor }}>
                    {visitor.vehiclePlate || 'ไม่มี'}
                  </div>
                </div>
              )}

              {template.showTimeIn && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>ออกเอกสารเมื่อ</span>
                  <div className="flex items-center gap-1.5 text-black" style={{ color: renderTextColor }}>
                    <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: renderAccentColor }} />
                    <span>{new Date(visitor.registeredAt).toLocaleDateString('th-TH', { dateStyle: 'short' })}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1 col-span-2 border-t border-black pt-2 mt-1">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-black" style={{ color: labelColor }}>ออกใบผ่านโดย</span>
                <div className="font-black flex items-center gap-1.5 text-black" style={{ color: renderTextColor }}>
                  <span>{visitor.registeredBy || 'ระบบอัตโนมัติ'}</span>
                </div>
              </div>
            </div>

            {/* QR Code and Pass ID */}
            {template.showQrCode && (
              <div className="flex flex-col items-center gap-2 mt-1 w-full text-black">
                <div className="p-2.5 bg-white rounded-2xl shadow-inner border border-black">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code Pass ID" 
                    className="w-32 h-32 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(visitor.id || '')}`;
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-black" style={{ color: labelColor }}>PASS CODE</p>
                  <p className="text-sm font-mono font-black tracking-wider mt-0.5 text-black" style={{ color: renderAccentColor }}>{visitor.id}</p>
                </div>
              </div>
            )}

            {/* Dotted Signature Line */}
            {template.signatureLine && (
              <div className="w-full grid grid-cols-2 gap-4 mt-1 pt-3 border-t border-dashed border-black" style={{ borderColor: '#000000' }}>
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="w-full border-b border-dotted h-4 border-black" style={{ borderColor: '#000000' }}></div>
                  <span className="text-[8px] uppercase tracking-wider font-black text-black" style={{ color: labelColor }}>ลายมือชื่อผู้ติดต่อ</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="w-full border-b border-dotted h-4 border-black" style={{ borderColor: '#000000' }}></div>
                  <span className="text-[8px] uppercase tracking-wider font-black text-black" style={{ color: labelColor }}>ลายมือชื่อเจ้าหน้าที่</span>
                </div>
              </div>
            )}
          </div>
        )}


      </div>

      {/* Action Buttons (Excluded from print) */}
      <div className="no-print flex flex-col sm:flex-row gap-2.5 w-full">
        <button
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-100 font-bold py-2.5 px-4 rounded-xl border border-slate-800 transition duration-150 shadow-md cursor-pointer text-xs uppercase tracking-wider font-sans"
        >
          <Printer className="w-4 h-4 text-blue-500" /> พิมพ์ / บันทึก PDF
        </button>
      </div>
    </div>
  );
}
