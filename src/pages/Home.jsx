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
      <HeroSection />
      <FeaturedProducts />
      <TechnologiesSection />
      <TestimonialsSection />
      <ClubSection />
      <StoryVideoSection />
      <CategoriesSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}