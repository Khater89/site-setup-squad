import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl"
          animate={{ rotate: [0, -3, 3, 0] }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
        >
          <span className="text-4xl font-black text-primary-foreground tracking-wider">
            MFN
          </span>
        </motion.div>

        <motion.p
          className="text-primary-foreground/90 text-lg font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          خدمات طبية ميدانية
        </motion.p>

        <motion.div
          className="mt-4 w-32 h-1 rounded-full bg-white/30 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.7, duration: 1.3, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const useSplashScreen = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash only in standalone PWA mode
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true
    );
  });

  const SplashWrapper = () => (
    <AnimatePresence>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
    </AnimatePresence>
  );

  return { showSplash, SplashWrapper };
};

export default SplashScreen;
