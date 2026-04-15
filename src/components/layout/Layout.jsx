import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import MattressFinderBot from "./MattressFinderBot";

export default function Layout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Re-mounted per route so each page gets an entrance animation.
            No AnimatePresence / exit animations — those were blocking the
            next page from mounting until the old one finished exiting. */}
        <motion.div
          key={location.pathname + location.search}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
      <WhatsAppButton />
      <MattressFinderBot />
    </div>
  );
}
