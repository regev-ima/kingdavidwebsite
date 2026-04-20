import React from "react";
import HeroSection from "../components/home/HeroSection";
import CategoriesSection from "../components/home/CategoriesSection";
import FeaturedProducts from "../components/home/FeaturedProducts";
import TechnologiesSection from "../components/home/TechnologiesSection";
import FeaturesSection from "../components/home/FeaturesSection";
import StoryVideoSection from "../components/home/StoryVideoSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import ClubSection from "../components/home/ClubSection";
import CTASection from "../components/home/CTASection";

export default function Home() {
  return (
    <div>
      <div className="section-band-cream"><HeroSection /></div>
      <div className="section-band-peach-soft"><FeaturedProducts /></div>
      <div className="section-band-gold-glow"><TechnologiesSection /></div>
      <div className="section-band-cream-warm"><TestimonialsSection /></div>
      <div className="section-band-beige"><ClubSection /></div>
      <div className="section-band-shipping"><StoryVideoSection /></div>
      <div className="section-band-peach"><CategoriesSection /></div>
      <div className="section-band-cream"><FeaturesSection /></div>
      <div className="section-band-cream-warm"><CTASection /></div>
    </div>
  );
}