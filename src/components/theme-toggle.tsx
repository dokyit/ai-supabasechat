'use client';
import { useTheme } from 'next-themes';
import { RiSunLine, RiMoonLine } from '@remixicon/react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full"
    >
      {theme === 'dark' ? <RiSunLine /> : <RiMoonLine />}
    </motion.button>
  );
}