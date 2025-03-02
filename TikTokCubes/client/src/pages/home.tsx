import { useEffect, useRef, useState } from 'react';
import { ThreeScene } from '@/lib/three-scene';
import { tiktokLive, TikTokEvent } from '@/lib/tiktok-live';
import { EventOverlay } from '@/components/event-overlay';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

const AVAILABLE_MODELS = [
  { id: 'cube', name: 'Default Cube', url: null },
  { id: 'dancer', name: 'Dancer', url: '/models/dancer.fbx' },
  { id: 'robot', name: 'Robot', url: '/models/robot.fbx' },
] as const;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ThreeScene | null>(null);
  const eventsRef = useRef<string[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('cube');
  const { toast } = useToast();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    sceneRef.current = new ThreeScene(canvasRef.current);
    const scene = sceneRef.current;

    // Start animation loop
    scene.animate();

    return () => {
      scene.dispose();
      // Disconnect from TikTok when component unmounts
      tiktokLive.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    const model = AVAILABLE_MODELS.find(m => m.id === selectedModel);
    if (model) {
      sceneRef.current.setModel(model.url);
      if (model.url) {
        toast({
          title: "Model Changed",
          description: `Now using ${model.name} for new viewers`,
        });
      }
    }
  }, [selectedModel, toast]);

  const handleConnect = async () => {
    if (!username) {
      toast({
        title: "Username Required",
        description: "Please enter a TikTok username to connect to their live stream.",
        variant: "destructive"
      });
      return;
    }

    try {
      await tiktokLive.connect(username);
      setIsConnected(true);

      // Setup event handling
      const cleanup = tiktokLive.onEvent((event: TikTokEvent) => {
        const scene = sceneRef.current;
        if (!scene) return;

        // Add new object to scene
        scene.addViewerObject(event.username);

        // Update events list with event type
        const eventText = `${event.username} ${event.type}ed!`;
        eventsRef.current = [eventText, ...eventsRef.current].slice(0, 5);
        setEvents([...eventsRef.current]);
      });

      toast({
        title: "Connected!",
        description: `Successfully connected to ${username}'s live stream.`,
      });

      return cleanup;
    } catch (err) {
      toast({
        title: "Connection Failed",
        description: err instanceof Error ? err.message : "Failed to connect to TikTok live stream",
        variant: "destructive"
      });
      setIsConnected(false);
    }
  };

  const handleDisconnect = async () => {
    await tiktokLive.disconnect();
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "Disconnected from TikTok live stream.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 relative">
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: '#000' }}
        />
        <EventOverlay events={events} />
      </div>

      <Card className="m-4 p-4">
        <div className="flex gap-4 items-center mb-4">
          <Input
            placeholder="Enter TikTok username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isConnected}
          />
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
            disabled={isConnected}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={isConnected ? handleDisconnect : handleConnect}
            variant={isConnected ? "destructive" : "default"}
          >
            {isConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>
        <h2 className="text-lg font-bold mb-2">TikTok Live 3D Visualization</h2>
        <p className="text-sm text-muted-foreground">
          3D models appear when viewers interact with the live stream. The models interact with physics!
        </p>
      </Card>
    </div>
  );
}