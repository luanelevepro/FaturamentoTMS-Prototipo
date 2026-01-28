import { useCallback, useEffect, useRef, useState } from 'react';

interface UseResizableProps {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

export function useResizable({
  defaultWidth = 900,
  minWidth = 400,
  maxWidth = 1200,
  storageKey,
}: UseResizableProps = {}) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Carregar largura salva do localStorage
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem(storageKey);
      if (savedWidth) {
        const parsedWidth = parseInt(savedWidth, 10);
        if (parsedWidth >= minWidth && parsedWidth <= maxWidth) {
          setWidth(parsedWidth);
        }
      }
    }
  }, [storageKey, minWidth, maxWidth]);

  // Salvar largura no localStorage
  const saveWidth = useCallback((newWidth: number) => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newWidth.toString());
    }
  }, [storageKey]);

  // Iniciar redimensionamento
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Redimensionar
  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = window.innerWidth - e.clientX;
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    setWidth(clampedWidth);
  }, [isResizing, minWidth, maxWidth]);

  // Parar redimensionamento
  const stopResize = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      saveWidth(width);
    }
  }, [isResizing, width, saveWidth]);

  // Event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, resize, stopResize]);

  return {
    width,
    isResizing,
    startResize,
    resizeRef,
  };
}
