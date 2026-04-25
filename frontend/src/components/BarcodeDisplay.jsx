import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function BarcodeDisplay({ value, width = 1.5, height = 40, fontSize = 10, displayValue = true }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, String(value), {
        format: 'CODE128',
        width,
        height,
        fontSize,
        displayValue,
        margin: 4,
        background: 'transparent',
        lineColor: '#222',
      });
    } catch (_) {}
  }, [value, width, height, fontSize, displayValue]);

  if (!value) return null;
  return <svg ref={ref} />;
}
