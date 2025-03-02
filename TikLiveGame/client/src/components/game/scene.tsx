import { useEffect, useRef } from 'react';

interface GameSceneProps {
  engine: ReturnType<typeof import('@/lib/game-engine').useGameEngine>;
}

export default function GameScene({ engine }: GameSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !engine.renderer) return;
    
    containerRef.current.appendChild(engine.renderer.domElement);

    const handleResize = () => {
      if (!engine.camera || !engine.renderer) return;
      
      engine.camera.aspect = window.innerWidth / window.innerHeight;
      engine.camera.updateProjectionMatrix();
      engine.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && engine.renderer) {
        containerRef.current.removeChild(engine.renderer.domElement);
      }
    };
  }, [engine]);

  return <div ref={containerRef} className="fixed inset-0" />;
}
