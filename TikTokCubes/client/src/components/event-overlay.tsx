import { motion, AnimatePresence } from 'framer-motion';

interface EventOverlayProps {
  events: string[];
}

export function EventOverlay({ events }: EventOverlayProps) {
  return (
    <div className="absolute top-4 right-4 pointer-events-none">
      <AnimatePresence>
        {events.map((event, i) => (
          <motion.div
            key={event + i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-black/50 text-white px-4 py-2 rounded-md mb-2 backdrop-blur-sm"
          >
            {event}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
