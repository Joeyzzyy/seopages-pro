'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function OptimizedImage({
  src,
  alt,
  width = 128,
  height = 128,
  className = '',
  priority = false,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  objectFit = 'contain',
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  // Handle external images (favicons, screenshots)
  const isExternal = src.startsWith('http') || src.startsWith('//');
  
  if (isExternal && !src.includes('googleusercontent.com')) {
    // Use regular img for external images not supported by Next.js Image
    return (
      <img
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onError={() => setError(true)}
        style={{
          objectFit,
          ...(error ? { display: 'none' } : {}),
        }}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        priority={priority}
        sizes={sizes}
        style={{ objectFit }}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      style={{ objectFit }}
      onError={() => setError(true)}
    />
  );
}
