import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicStateObject, DynamicState } from "./../../types/DynamicState";

export interface QRCheckInProps {
  isOpen?: boolean;
  onClose?: (...args: DynamicStateObject[]) => void;
  onScanSuccess?: (...args: DynamicStateObject[]) => void;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function QRCheckIn({ isOpen, onClose, onScanSuccess }: QRCheckInProps) {
  const scannerRef = useRef<DynamicState>(null);
  const [success, setSuccess] = useState<DynamicState>(false);

  useEffect(() => {
    if (isOpen && !success) {
      // Small delay to ensure DOM is ready for the scanner div
      const timer = setTimeout(() => {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          /* verbose= */ false
        );
        scannerRef.current.render(onScan, onScanError);
      }, 100);
      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch((e: DynamicStateObject) => console.error("Failed to clear scanner", e));
        }
      };
    }
  }, [isOpen, success]);

  const onScan = (decodedText: DynamicStateObject, decodedResult: DynamicStateObject) => {
    setSuccess(true);
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    setTimeout(() => {
      (onScanSuccess as any)(decodedText);
      setSuccess(false);
      if (onClose) (onClose as any)();
    }, 1500);
  };

  const onScanError = (errorMessage: DynamicStateObject) => {
    // html5-qrcode scans constantly and throws errors when no QR code is in frame
    // We safely ignore these background errors
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-[var(--tc-bg)] shadow-2xl border border-[var(--tc-border)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--tc-border)] p-4">
            <div className="flex items-center space-x-2">
              <Camera className="h-5 w-5 text-[var(--tc-accent)]" />
              <h3 className="text-lg font-semibold text-[var(--tc-text)]">Scan to Check-in</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 flex flex-col items-center justify-center min-h-[350px]">
            {success ? (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center text-emerald-500"
              >
                <CheckCircle className="h-20 w-20 mb-4" />
                <p className="text-xl font-bold">Check-in Successful!</p>
              </motion.div>
            ) : (
              <div className="w-full">
                <p className="mb-4 text-center text-sm text-gray-400">
                  Align the QR code from the kiosk within the frame to check in for your appointment.
                </p>
                {/* HTML5 QR Code injects its UI into this div */}
                <div id="qr-reader" className="w-full overflow-hidden rounded-xl border-2 border-dashed border-[var(--tc-border)] bg-black/20" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
