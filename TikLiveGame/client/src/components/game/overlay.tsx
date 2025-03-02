import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface GameOverlayProps {
  username: string;
  setUsername: (username: string) => void;
  onConnect: () => void;
  isConnected: boolean;
  score: number;
}

export default function GameOverlay({
  username,
  setUsername,
  onConnect,
  isConnected,
  score
}: GameOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 right-4">
        <Card className="p-4 bg-opacity-80 backdrop-blur">
          <div className="text-lg font-bold">Score: {score}</div>
        </Card>
      </div>

      {!isConnected && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Card className="p-6 w-80 pointer-events-auto bg-opacity-90 backdrop-blur">
            <h2 className="text-2xl font-bold mb-4 text-center">
              TikTok Live Game
            </h2>
            <div className="space-y-4">
              <Input
                placeholder="Enter TikTok username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={onConnect}
                disabled={!username}
              >
                Connect to Stream
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
