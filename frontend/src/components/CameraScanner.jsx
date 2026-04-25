import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { MdClose, MdCameraAlt, MdFlipCameraAndroid } from 'react-icons/md';

export default function CameraScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [facingBack, setFacingBack] = useState(true);
  const idRef = useRef('qr-scanner-' + Date.now());
  const scannedRef = useRef(false);

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isRunning()) {
        await scannerRef.current.stop();
      }
    } catch (_) {}
  };

  const startScanner = async (useBack) => {
    await stopScanner();
    const scanner = new Html5Qrcode(idRef.current);
    scannerRef.current = scanner;
    scannedRef.current = false;
    try {
      await scanner.start(
        { facingMode: useBack ? 'environment' : 'user' },
        { fps: 10, qrbox: { width: 250, height: 160 } },
        (code) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          stopScanner().then(() => {
            onScan(code);
          });
        },
        () => {}
      );
      setStarted(true);
      setError('');
    } catch (e) {
      setError(e?.message || 'Camera failed to start');
    }
  };

  useEffect(() => {
    startScanner(true);
    return () => { stopScanner(); };
  }, []);

  const switchCamera = async () => {
    const next = !facingBack;
    setFacingBack(next);
    setStarted(false);
    await startScanner(next);
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.85)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 360, borderRadius: 16, overflow: 'hidden', background: '#111', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 700, fontSize: 14 }}>
            <MdCameraAlt style={{ fontSize: 18 }} /> Scan Barcode
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={switchCamera} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
              <MdFlipCameraAndroid style={{ fontSize: 18 }} />
            </button>
            <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
              <MdClose style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', background: '#000', minHeight: 200 }}>
          <div id={idRef.current} style={{ width: '100%' }} />
          {!started && !error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
              Starting camera...
            </div>
          )}
          {error && (
            <div style={{ padding: 24, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>{error}</div>
          )}
        </div>

        <div style={{ padding: '12px 16px', background: '#1e293b', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
          {facingBack ? 'Back camera' : 'Front camera'} · Point at barcode to scan
        </div>
      </div>
    </div>
  );
}
