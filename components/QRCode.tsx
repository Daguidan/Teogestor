import React from 'react';

export const QRCode: React.FC<{ value: string; size?: number }> = ({ value, size = 200 }) => {
  // Using a reliable public API for QR code generation to keep the app lightweight and avoid complex dependencies in a single file.
  // This ensures the QR code works immediately.
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff`;

  return (
    <div className="inline-block relative">
      <img 
        src={qrUrl} 
        alt="QR Code" 
        width={size} 
        height={size} 
        className="rounded-lg"
        loading="lazy"
      />
    </div>
  );
};