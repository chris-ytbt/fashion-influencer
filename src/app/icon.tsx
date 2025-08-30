﻿import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111',
          color: '#fff',
          fontSize: 18,
          fontWeight: 700,
          fontFamily: 'system-ui, Arial, Helvetica, sans-serif',
        }}
      >
        JB
      </div>
    ),
    size
  );
}
