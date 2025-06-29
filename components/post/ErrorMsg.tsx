import React from 'react'
import { motion, AnimatePresence } from "framer-motion";

export default function Error({errorMessage}: { errorMessage: string }) {
  return (
        <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-3"
          >
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-red-300 text-sm">{errorMessage}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
  )
}
