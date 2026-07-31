/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { Camera, RefreshCw, Sparkles, Check, AlertCircle, Loader2, Play, Pause, Scan, Sun, Contrast, Sliders, ChevronDown, ChevronUp, Upload, FileImage } from 'lucide-react';
import jsQR from 'jsqr';

interface CameraCaptureProps {
  onCapture: (base64Image: string, qrText?: string) => void;
  buttonText?: string;
  autoLandmarks?: boolean; // simulates landmarks rendering on top of the webcam
  autoCapture?: boolean;    // whether to automatically trigger hands-free scanning
  isProcessing?: boolean;   // if parent is busy processing the scan results
  scanType?: 'qr' | 'face' | 'general';
  lang?: 'TH' | 'EN';
}

// Helper to binarize image for accurate black & white QR code scanning
function binarize(imageData: ImageData): ImageData {
  const data = imageData.data;
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const binary = v > 120 ? 255 : 0;
    data[i] = binary;
    data[i+1] = binary;
    data[i+2] = binary;
  }
  return imageData;
}

// Helper to enhance contrast for sharp finder pattern recognition in QR codes
function enhanceContrast(imageData: ImageData, factor: number): ImageData {
  const data = imageData.data;
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    for (let j = 0; j < 3; j++) {
      let v = data[i + j];
      v = (v - 128) * factor + 128;
      data[i + j] = Math.max(0, Math.min(255, v));
    }
  }
  return imageData;
}

export default function CameraCapture({ 
  onCapture, 
  buttonText = "ถ่ายภาพใบหน้า", 
  autoLandmarks = true,
  autoCapture = true,
  isProcessing = false,
  scanType = 'general',
  lang = 'TH'
}: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(() => {
    if (typeof window !== 'undefined' && navigator.userAgent) {
      const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || (window.innerWidth < 768);
      return isMobile ? 'environment' : 'user';
    }
    return 'user';
  });

  // Local Image Upload Fallback states
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera Lighting Adjustment States
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [showSliders, setShowSliders] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<'normal' | 'lowlight' | 'backlit'>('normal');

  // Auto capture states
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Sync internal autoCapture state when prop changes
  useEffect(() => {
    setAutoCaptureEnabled(false);
  }, [autoCapture]);

  // Handle countdown for automatic capture
  useEffect(() => {
    if (!autoCaptureEnabled || capturedImage || isProcessing || !stream) {
      setCountdown(3);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoCaptureEnabled, capturedImage, isProcessing, stream]);

  // Trigger capture when countdown reaches 0
  useEffect(() => {
    if (autoCaptureEnabled && !capturedImage && !isProcessing && stream && countdown === 0) {
      handleCapture();
      setCountdown(3);
    }
  }, [countdown, autoCaptureEnabled, capturedImage, isProcessing, stream]);

  // Reset countdown if processing starts
  useEffect(() => {
    if (isProcessing) {
      setCountdown(3);
    }
  }, [isProcessing]);

  // Apply Presets
  const applyPreset = (preset: 'normal' | 'lowlight' | 'backlit') => {
    setCurrentPreset(preset);
    if (preset === 'normal') {
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
    } else if (preset === 'lowlight') {
      setBrightness(135);
      setContrast(115);
      setSaturation(105);
    } else if (preset === 'backlit') {
      setBrightness(120);
      setContrast(125);
      setSaturation(100);
    }
  };

  // Initialize camera
  useEffect(() => {
    let active = true;
    let currentStream: MediaStream | null = null;

    async function initCamera() {
      try {
        setLoading(true);
        setError(null);
        
        // Get media devices list
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices.filter(d => d.kind === 'videoinput');
        if (active) {
          setDevices(videoDevices);
        }

        // Stop any currently active streams before initiating a new one
        if (videoRef.current && videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject as MediaStream;
          oldStream.getTracks().forEach(track => track.stop());
        }
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: activeDeviceId 
            ? { deviceId: { exact: activeDeviceId } } 
            : { facingMode: { ideal: facingMode } },
          audio: false
        };

        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (firstErr) {
          console.warn("First camera constraint failed, retrying with fallback...", firstErr);
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: facingMode },
              audio: false
            });
          } catch (secondErr) {
            console.warn("Second camera constraint failed, retrying with generic video...", secondErr);
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          }
        }

        if (!active) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        currentStream = mediaStream;
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.log("Video play interrupted or rejected:", e));
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        if (active) {
          setError("ไม่สามารถเข้าถึงกล้องได้ หรือสิทธิ์ใช้งานกล้องถูกปฏิเสธ");
          setMode('upload');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initCamera();

    return () => {
      active = false;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeDeviceId, facingMode]);

  // Real-time client-side QR Code decoding using jsQR
  useEffect(() => {
    if (scanType !== 'qr' || !stream || capturedImage || isProcessing) return;

    let active = true;
    const intervalId = setInterval(() => {
      if (!active || !videoRef.current) return;
      const video = videoRef.current;
      
      // Make sure video is playing and has valid dimensions
      if (video.paused || video.ended || !video.videoWidth) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // PASS 1: Try raw full frame
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let code = jsQR(imageData.data, imageData.width, imageData.height);
        
        // PASS 2: If not found, try decoding the cropped center region where the QR code is expected to be
        if (!code) {
          const cropSize = Math.min(canvas.width, canvas.height) * 0.6;
          const sx = (canvas.width - cropSize) / 2;
          const sy = (canvas.height - cropSize) / 2;
          
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = 400;
          cropCanvas.height = 400;
          const cropCtx = cropCanvas.getContext('2d');
          
          if (cropCtx) {
            cropCtx.drawImage(canvas, sx, sy, cropSize, cropSize, 0, 0, 400, 400);
            
            // Try standard crop
            const cropImgData = cropCtx.getImageData(0, 0, 400, 400);
            code = jsQR(cropImgData.data, cropImgData.width, cropImgData.height);
            
            // PASS 3: If still not found, try high contrast enhancement on the crop
            if (!code) {
              // Create a fresh copy since enhanceContrast mutates in-place
              cropCtx.drawImage(canvas, sx, sy, cropSize, cropSize, 0, 0, 400, 400);
              const contrastData = enhanceContrast(cropCtx.getImageData(0, 0, 400, 400), 2.2);
              code = jsQR(contrastData.data, contrastData.width, contrastData.height);
            }
            
            // PASS 4: If still not found, try adaptive binary thresholding on the crop
            if (!code) {
              cropCtx.drawImage(canvas, sx, sy, cropSize, cropSize, 0, 0, 400, 400);
              const binarizedData = binarize(cropCtx.getImageData(0, 0, 400, 400));
              code = jsQR(binarizedData.data, binarizedData.width, binarizedData.height);
            }
          }
        }

        if (code && code.data) {
          console.log("Local QR Code decoded successfully:", code.data);
          
          // Capture the base64 of the matching frame
          const base64 = canvas.toDataURL('image/jpeg', 0.9);
          
          active = false;
          setCapturedImage(base64);
          onCapture(base64, code.data);
        }
      } catch (err) {
        console.error("Error in real-time local QR scanning:", err);
      }
    }, 250); // scan every 250ms for instant feedback and supreme accuracy without dropping frames

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [scanType, stream, capturedImage, isProcessing]);

  // Handle drawing scanning animation and landmarks on overlay canvas
  useEffect(() => {
    if (!stream || !overlayCanvasRef.current || !autoLandmarks) return;

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let faceY = 120;
    let direction = 1;
    const dots: { x: number; y: number; active: boolean }[] = [];

    // Generate simulated face landmark coordinates
    const numPoints = scanType === 'qr' ? 8 : 15;
    for (let i = 0; i < numPoints; i++) {
      dots.push({
        x: 120 + Math.random() * 160,
        y: 100 + Math.random() * 140,
        active: Math.random() > 0.5
      });
    }

    function renderScanner() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      // Scan Area styling
      if (scanType === 'qr') {
        // Target Box for QR code
        ctx.strokeStyle = 'rgba(127, 152, 247, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(100, 60, width - 200, height - 120);

        // QR Target corners
        ctx.strokeStyle = '#7f98f7';
        ctx.lineWidth = 4;
        const cornerSize = 20;
        const left = 100, right = width - 100, top = 60, bottom = height - 60;

        // Top Left
        ctx.beginPath(); ctx.moveTo(left, top + cornerSize); ctx.lineTo(left, top); ctx.lineTo(left + cornerSize, top); ctx.stroke();
        // Top Right
        ctx.beginPath(); ctx.moveTo(right, top + cornerSize); ctx.lineTo(right, top); ctx.lineTo(right - cornerSize, top); ctx.stroke();
        // Bottom Left
        ctx.beginPath(); ctx.moveTo(left, bottom - cornerSize); ctx.lineTo(left, bottom); ctx.lineTo(left + cornerSize, bottom); ctx.stroke();
        // Bottom Right
        ctx.beginPath(); ctx.moveTo(right, bottom - cornerSize); ctx.lineTo(right, bottom); ctx.lineTo(right - cornerSize, bottom); ctx.stroke();

        // Scanning Laser Line
        ctx.strokeStyle = 'rgba(127, 152, 247, 0.8)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#7f98f7';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(100, faceY);
        ctx.lineTo(width - 100, faceY);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // Animate Laser
        faceY += direction * 3;
        if (faceY > bottom - 10 || faceY < top + 10) {
          direction *= -1;
        }

        ctx.fillStyle = '#7f98f7';
        ctx.font = '10px monospace';
        ctx.fillText(`AI QR ENCODER ACTIVE`, 110, 50);
        ctx.fillText(`ALIGN QR CODE TO CENTER`, 110, height - 40);

      } else {
        // Clear or remove green overlays to keep the camera view completely clean and frame-free as requested
      }

      animationRef.current = requestAnimationFrame(renderScanner);
    }

    renderScanner();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [stream, autoLandmarks, scanType]);

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }

  // File Upload Fallback Helpers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  };

  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result;
        setCapturedImage(base64);
        
        if (scanType === 'qr') {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let decoded = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (!decoded && canvas.width > 0 && canvas.height > 0) {
                  const cropImgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const contrastData = enhanceContrast(cropImgData, 2.0);
                  decoded = jsQR(contrastData.data, contrastData.width, contrastData.height);
                }
                
                if (decoded && decoded.data) {
                  console.log("Uploaded QR Code decoded successfully:", decoded.data);
                  onCapture(base64, decoded.data);
                } else {
                  console.warn("Could not decode QR locally from uploaded image, passing image base64 for fallback...");
                  onCapture(base64, undefined);
                }
              } else {
                onCapture(base64, undefined);
              }
            } catch (err) {
              console.error("Local QR decode on upload error:", err);
              onCapture(base64, undefined);
            }
          };
          img.src = base64;
        } else {
          onCapture(base64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video size
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let drawSuccessful = false;

    // Apply real-time lighting filter settings only if they are modified and supported
    if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
      try {
        if ('filter' in ctx || (ctx as any).filter !== undefined) {
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          drawSuccessful = true;
        }
      } catch (err) {
        console.warn('Canvas filter drawing failed, falling back to standard draw:', err);
      }
    }

    // Fallback if filter is default (100%) or unsupported/failed
    if (!drawSuccessful) {
      try {
        ctx.filter = 'none';
      } catch (e) {}
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Capture as JPEG Base64
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(base64);

    if (scanType === 'qr') {
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let code = jsQR(imageData.data, imageData.width, imageData.height);
        if (!code && canvas.width > 0 && canvas.height > 0) {
          const contrastData = enhanceContrast(ctx.getImageData(0, 0, canvas.width, canvas.height), 2.0);
          code = jsQR(contrastData.data, contrastData.width, contrastData.height);
        }
        if (!code && canvas.width > 0 && canvas.height > 0) {
          const binarizedData = binarize(ctx.getImageData(0, 0, canvas.width, canvas.height));
          code = jsQR(binarizedData.data, binarizedData.width, binarizedData.height);
        }
        if (code && code.data) {
          onCapture(base64, code.data);
        } else {
          onCapture(base64, undefined);
        }
      } catch (err) {
        console.error("Local QR capture decode error:", err);
        onCapture(base64, undefined);
      }
    } else {
      onCapture(base64);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCountdown(3);
    // Restart camera in case it stopped
    if (!stream) {
      if (activeDeviceId) {
        setActiveDeviceId(activeDeviceId); // force reload trigger
      } else {
        setFacingMode(facingMode); // force reload trigger
      }
    }
  };

  const handleSwitchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(d => d.deviceId === activeDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      const nextDevice = devices[nextIndex];
      setActiveDeviceId(nextDevice.deviceId);
      
      // Infer facingMode from device label
      const label = (nextDevice.label || '').toLowerCase();
      if (label.includes('back') || label.includes('environment') || label.includes('rear') || label.includes('กล้องหลัง')) {
        setFacingMode('environment');
      } else {
        setFacingMode('user');
      }
    } else {
      // Direct facingMode toggle for mobile/touch devices
      const nextFacing = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(nextFacing);
      setActiveDeviceId(''); // Clear deviceId to force using facingMode constraint
    }
  };

  return (
    <div id="camera-capture-container" className="flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl w-full max-w-xs mx-auto">
      
      {/* Camera Capture Header & Mode Switcher */}
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="flex items-center gap-2">
          <Scan className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-300">
            {scanType === 'qr' ? 'โหมดสแกน QR Code' : 'โหมดสแกนใบหน้า'}
          </span>
        </div>

        {/* Toggle Mode Tab */}
        <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => {
              setMode('camera');
              setCapturedImage(null);
            }}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${mode === 'camera' ? 'bg-[#7f98f7] text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Camera className="w-3 h-3" />
            {lang === 'TH' ? 'กล้อง' : 'Camera'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('upload');
              setCapturedImage(null);
            }}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${mode === 'upload' ? 'bg-[#7f98f7] text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Upload className="w-3 h-3" />
            {lang === 'TH' ? 'อัปโหลด' : 'Upload'}
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
        {mode === 'upload' ? (
          /* Upload Mode Container with Drag and Drop */
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !capturedImage && fileInputRef.current?.click()}
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-all duration-200 bg-slate-950 ${isDragOver ? 'bg-[#7f98f7]/5 border-2 border-dashed border-[#7f98f7]' : 'hover:bg-slate-900/60'}`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            {capturedImage ? (
              <div className="relative w-full h-full">
                <img src={capturedImage} alt="Uploaded Image" className="w-full h-full object-cover rounded-xl" />
                <div className="absolute bottom-3 left-3 right-3 bg-emerald-500/95 backdrop-blur-sm text-slate-950 text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold shadow-lg">
                  <Check className="w-4 h-4 stroke-[3]" />
                  {isProcessing ? 'กำลังส่งข้อมูลไปประมวลผล AI...' : 'อัปโหลดไฟล์เรียบร้อยแล้ว'}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
                <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-[#7f98f7] group-hover:scale-105 transition">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">
                    {lang === 'TH' ? 'คลิก หรือ ลากวางไฟล์ภาพที่นี่' : 'Click or Drag & Drop image here'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {scanType === 'qr' 
                      ? (lang === 'TH' ? 'รองรับไฟล์รูปภาพ QR Code ทุกประเภท' : 'Supports any QR Code image files') 
                      : (lang === 'TH' ? 'รองรับไฟล์ภาพถ่ายใบหน้าทุกประเภท' : 'Supports any face photo files')}
                  </p>
                </div>
                {error && (
                  <div className="mt-2 py-1.5 px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 max-w-[90%] leading-normal mx-auto">
                    ⚠️ {lang === 'TH' ? 'เข้าถึงกล้องขัดข้อง ระบบเปิดโหมดอัปโหลดทดแทนให้คุณ' : 'Camera inaccessible; switched to upload mode fallback.'}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Camera Mode Container */
          <>
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-950 z-10">
                <RefreshCw className="w-8 h-8 animate-spin text-[#7f98f7] mb-2" />
                <p className="text-sm font-medium">กำลังเปิดระบบกล้องบันทึก...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-400 p-6 text-center bg-slate-950 z-10">
                <AlertCircle className="w-12 h-12 mb-3 text-rose-500" />
                <p className="font-bold text-base mb-2">เข้าถึงกล้องล้มเหลว</p>
                <p className="text-xs text-slate-500">{error}</p>
              </div>
            )}

            {/* Live Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ 
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                transform: facingMode === 'user' ? 'scaleX' : 'none'
              }}
              className={`w-full h-full object-cover ${capturedImage ? 'hidden' : ''}`}
            />

            {/* Live Overlay Canvas */}
            {!capturedImage && stream && autoLandmarks && (
              <canvas
                ref={overlayCanvasRef}
                width={400}
                height={300}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
              />
            )}

            {/* Auto Scanning HUD overlay inside stream */}
            {!capturedImage && stream && autoCaptureEnabled && (
              <div className="absolute inset-x-0 top-3 z-20 flex justify-center px-4 pointer-events-none">
                <div className="bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#7f98f7]/40 shadow-xl flex items-center gap-2">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-[#7f98f7] animate-spin" />
                      <span className="text-[11px] text-slate-200 font-extrabold animate-pulse">
                        กำลังประมวลผลข้อมูล... กรุณาถือนิ่งๆ
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[11px] text-emerald-400 font-extrabold font-mono uppercase tracking-wider">
                        AUTO-SCANNING IN: {countdown}s
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Captured Snapshot Display */}
            {capturedImage && (
              <div className="relative w-full h-full">
                <img src={capturedImage} alt="Captured Snapshot" className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 right-3 bg-emerald-500/95 backdrop-blur-sm text-slate-950 text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold shadow-lg">
                  <Check className="w-4 h-4 stroke-[3]" />
                  {isProcessing ? 'กำลังส่งข้อมูลไปประมวลผล AI...' : 'บันทึกภาพถ่ายแล้ว'}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Buttons */}
      <div className="mt-4 flex gap-2 w-full justify-center">
        {mode === 'upload' ? (
          !capturedImage ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-[#7f98f7] hover:bg-[#5c7df5] text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-250 cursor-pointer text-xs"
            >
              <FileImage className="w-4 h-4" />
              {lang === 'TH' ? 'เลือกไฟล์รูปภาพ' : 'Choose Image File'}
            </button>
          ) : (
            <button
              onClick={handleRetake}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl border border-slate-700 transition duration-250 cursor-pointer disabled:opacity-50 text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              {lang === 'TH' ? 'อัปโหลดภาพใหม่' : 'Upload New Image'}
            </button>
          )
        ) : (
          !capturedImage ? (
            <>
              <button
                onClick={handleCapture}
                disabled={loading || !!error || isProcessing}
                className="flex-1 flex items-center justify-center gap-2 bg-[#7f98f7] hover:bg-[#5c7df5] disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg transition duration-250 cursor-pointer text-xs"
              >
                <Camera className="w-4 h-4 text-slate-950" />
                {buttonText}
              </button>

              <button
                onClick={handleSwitchCamera}
                disabled={loading || !!error || isProcessing}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 transition duration-150 text-xs"
                title="สลับกล้องหน้าหลัง"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-xs font-semibold pr-1 hidden sm:inline">สลับกล้อง</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleRetake}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl border border-slate-700 transition duration-250 cursor-pointer disabled:opacity-50 text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              {lang === 'TH' ? 'สแกนใหม่อีกครั้ง' : 'Scan Again'}
            </button>
          )
        )}
      </div>

      {/* Hidden Canvas for capturing snapshots */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
