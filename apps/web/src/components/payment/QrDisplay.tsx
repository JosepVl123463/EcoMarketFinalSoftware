'use client';

import { useState } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';

interface QrDisplayProps {
  value: string;
  label?: string;
  brandColor?: string;
  brandName?: string;
  /** Ruta en public/ — si el archivo no existe, se genera QR dinámico */
  staticImagePath?: string;
}

export function QrDisplay({
  value,
  label = 'EcoMarket S.A.C.',
  brandColor = '#1A3C34',
  brandName,
  staticImagePath,
}: QrDisplayProps) {
  const [useGenerated, setUseGenerated] = useState(!staticImagePath);

  return (
    <div className="relative p-4 bg-[var(--surface)]/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-lg flex flex-col items-center qr-pulse">
      <div className="w-44 h-44 bg-[var(--surface)] rounded-xl flex items-center justify-center relative overflow-hidden border border-[var(--border)]">
        {!useGenerated && staticImagePath ? (
          <Image
            src={staticImagePath}
            alt="Código QR de pago"
            width={176}
            height={176}
            className="object-contain"
            onError={() => setUseGenerated(true)}
          />
        ) : (
          <QRCodeSVG value={value} size={160} level="M" includeMargin />
        )}
        {brandName && (
          <div
            className="absolute w-11 h-11 bg-[var(--surface)] rounded-lg border flex items-center justify-center shadow-sm"
            style={{ borderColor: `${brandColor}33` }}
          >
            <span className="font-black text-[10px]" style={{ color: brandColor }}>
              {brandName}
            </span>
          </div>
        )}
      </div>
      <span className="text-[10px] font-bold text-[var(--text-muted)] mt-2">{label}</span>
    </div>
  );
}
