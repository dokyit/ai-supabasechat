import { motion } from 'framer-motion';
export default () => (
  <motion.div className="flex items-center gap-1 text-sm text-muted-foreground">
    Thinking
    {[0, 0.2, 0.4].map(d => (
      <motion.span key={d} animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: d }}>.</motion.span>
    ))}
  </motion.div>
);