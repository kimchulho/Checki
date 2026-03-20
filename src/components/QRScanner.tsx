import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let requestAnimationFrameId: number;
    let isComponentMounted = true;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current && isComponentMounted) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // required to tell iOS safari we don't want fullscreen
          videoRef.current.play();
          requestAnimationFrameId = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        if (isComponentMounted) {
          setError(t('terminal.messages.camera_error') || '카메라에 접근할 수 없습니다.');
        }
      }
    };

    const tick = () => {
      if (!isComponentMounted) return;
      
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvasElement = canvasRef.current;
        const canvas = canvasElement?.getContext('2d');

        if (canvasElement && canvas) {
          canvasElement.height = videoRef.current.videoHeight;
          canvasElement.width = videoRef.current.videoWidth;
          canvas.drawImage(videoRef.current, 0, 0, canvasElement.width, canvasElement.height);
          
          const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            isComponentMounted = false;
            onScanRef.current(code.data);
            return; // Stop scanning once found
          }
        }
      }
      requestAnimationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      isComponentMounted = false;
      if (requestAnimationFrameId) {
        cancelAnimationFrame(requestAnimationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-md p-4 flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t('terminal.messages.scan_qr_title') || 'QR 코드 스캔'}
          </h2>
          <p className="text-white/60 text-sm">
            {t('terminal.messages.scan_qr_desc_camera') || '화면의 사각형 안에 QR 코드를 맞춰주세요.'}
          </p>
        </div>

        <div className="relative w-full aspect-square max-w-[300px] rounded-3xl overflow-hidden bg-black border-2 border-white/20">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 border-2 border-orange-500/50 rounded-3xl m-8">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-orange-500 -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-orange-500 -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-orange-500 -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-orange-500 -mb-1 -mr-1" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
