import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import GameScene from '@/components/game/scene';
import GameOverlay from '@/components/game/overlay';
import { useGameEngine } from '@/lib/game-engine';
import { useTikTokLive } from '@/lib/tiktok-live';

export default function Game() {
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const gameEngine = useGameEngine();
  const tikTokLive = useTikTokLive({
    onChat: (data) => {
      gameEngine.spawnObject('sphere', Math.random() * 10 - 5, 5, Math.random() * 10 - 5);
    },
    onGift: (data) => {
      gameEngine.spawnObject('cube', Math.random() * 10 - 5, 5, Math.random() * 10 - 5);
    },
    onLike: (data) => {
      gameEngine.spawnObject('heart', Math.random() * 10 - 5, 5, Math.random() * 10 - 5);
    },
    onConnect: () => {
      setIsConnected(true);
      toast({
        title: "Connected to TikTok Live",
        description: `Watching ${username}'s stream`,
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Error",
        description: error,
        variant: "destructive",
      });
      setIsConnected(false);
    }
  });

  const handleConnect = () => {
    if (!username) {
      toast({
        title: "Username Required",
        description: "Please enter a TikTok username",
        variant: "destructive",
      });
      return;
    }
    tikTokLive.connect(username);
  };

  return (
    <div className="h-screen w-screen relative">
      <GameScene engine={gameEngine} />
      <GameOverlay
        username={username}
        setUsername={setUsername}
        onConnect={handleConnect}
        isConnected={isConnected}
        score={gameEngine.score}
      />
    </div>
  );
}
