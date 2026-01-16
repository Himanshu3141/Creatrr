"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  features,
  platformTabs,
  socialProofStats,
  testimonials,
} from "@/lib/data";
import Image from "next/image";
import Link from "next/link";

const Home = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState(0);
  
  // Refs for magnetic elements
  const createRef = React.useRef<HTMLSpanElement>(null);
  const publishRef = React.useRef<HTMLSpanElement>(null);
  const growRef = React.useRef<HTMLSpanElement>(null);
  const buttonRef1 = React.useRef<HTMLAnchorElement>(null);
  const buttonRef2 = React.useRef<HTMLAnchorElement>(null);
  const buttonRef3 = React.useRef<HTMLAnchorElement>(null);

      // Magnetic effect state
  const [magneticOffsets, setMagneticOffsets] = useState({
    create: { x: 0, y: 0 },
    publish: { x: 0, y: 0 },
    grow: { x: 0, y: 0 },
    button1: { x: 0, y: 0 },
    button2: { x: 0, y: 0 },
    button3: { x: 0, y: 0 },
  });

  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any; }) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Check if user prefers reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      // Calculate magnetic offset for each element
      const calculateOffset = (element: HTMLElement | null, key: string) => {
        if (!element) return { x: 0, y: 0 };
        
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Only apply effect within a reasonable distance (200px)
        if (distance > 200) {
          return { x: 0, y: 0 };
        }
        
        // Calculate normalized direction
        const normalizedX = deltaX / distance;
        const normalizedY = deltaY / distance;
        
        // Apply inverse square law for smooth falloff, max 3px movement
        const strength = (1 - distance / 200) * 3;
        
        return {
          x: normalizedX * strength,
          y: normalizedY * strength,
        };
      };

      setMagneticOffsets({
        create: calculateOffset(createRef.current, 'create'),
        publish: calculateOffset(publishRef.current, 'publish'),
        grow: calculateOffset(growRef.current, 'grow'),
        button1: calculateOffset(buttonRef1.current, 'button1'),
        button2: calculateOffset(buttonRef2.current, 'button2'),
        button3: calculateOffset(buttonRef3.current, 'button3'),
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Data arrays
  const navigationItems = [
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
  ];

  return (
    <div className="min-h-screen text-[#A1A1AA] overflow-hidden relative">
      {/* Subtle animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0E1117]/30 via-[#111318]/20 to-[#0B0D10]/30 animate-pulse"></div>

      {/* Subtle cursor glow effect */}
      <div
        className="fixed hidden md:block w-[400px] h-[400px] pointer-events-none z-0"
        style={{
          left: mousePosition.x - 200,
          top: mousePosition.y - 200,
          transition: "all 0.2s ease-out",
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 70%)",
          filter: "blur(60px)",
          mixBlendMode: "screen",
        }}
      ></div>

      {/* Hero Section */}
      <section className="bg-vignette-premium relative z-10 mt-32 sm:mt-40 lg:mt-48 px-4 sm:px-6 py-20 sm:py-28 lg:py-32 min-h-[85vh] flex items-center">
        
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 lg:gap-20 xl:gap-24 items-center relative z-10">
          {/* Left Column - Headings */}
          <div className="text-center lg:text-left flex flex-col justify-center relative">
            {/* Faint glow behind headline */}
            <div className="absolute inset-0 hero-headline-glow opacity-50"></div>
            
            <h1 className="text-7xl sm:text-8xl lg:text-9xl xl:text-[10rem] font-black leading-[0.95] tracking-[-0.02em] space-y-1 lg:space-y-2 relative hero-shimmer">
              <span 
                ref={createRef}
                className="block font-black metallic-chrome transition-transform duration-700 ease-out opacity-100"
                style={{
                  transform: `translate(${magneticOffsets.create.x}px, ${magneticOffsets.create.y}px)`,
                }}
              >
                Create.
              </span>
              <span 
                ref={publishRef}
                className="block font-light italic metallic-chrome transition-transform duration-700 ease-out opacity-90"
                style={{
                  transform: `translate(${magneticOffsets.publish.x}px, ${magneticOffsets.publish.y}px)`,
                }}
              >
                Publish.
              </span>
              <span 
                ref={growRef}
                className="block font-black metallic-chrome transition-transform duration-700 ease-out opacity-80"
                style={{
                  transform: `translate(${magneticOffsets.grow.x}px, ${magneticOffsets.grow.y}px)`,
                }}
              >
                Grow.
              </span>
            </h1>
          </div>

          {/* Right Column - Description & CTAs */}
          <div className="flex flex-col justify-center space-y-10 lg:space-y-12">
            <p className="text-xl sm:text-2xl lg:text-3xl text-[#A1A1AA] font-normal leading-[1.7] lg:leading-[1.8] max-w-[32rem] mx-auto lg:mx-0 text-center lg:text-left">
              The AI-powered platform that turns your ideas into{" "}
              <span className="metallic-subtle font-semibold">
                engaging content
              </span>{" "}
              and helps you build a thriving creator business.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 items-center lg:items-start justify-center lg:justify-start">
              <Link 
                href="/dashboard"
                ref={buttonRef1}
                className="inline-block transition-transform duration-700 ease-out"
                style={{
                  transform: `translate(${magneticOffsets.button1.x}px, ${magneticOffsets.button1.y}px)`,
                }}
              >
                <Button
                  size="xl"
                  variant="primary"
                  className="w-full sm:w-auto hero-cta-primary"
                >
                  Start Creating for Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link 
                href="/feed"
                ref={buttonRef2}
                className="inline-block transition-transform duration-700 ease-out"
                style={{
                  transform: `translate(${magneticOffsets.button2.x}px, ${magneticOffsets.button2.y}px)`,
                }}
              >
                <Button
                  variant="outline"
                  size="xl"
                  className="rounded-full w-full sm:w-auto hero-cta-secondary"
                >
                  Explore the Feed
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="relative mt-14 z-10 py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-r from-[#111318]/50 to-[#0B0D10]/50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              <span className="gradient-text-primary">Everything you need</span>
            </h2>
            <p className="text-lg sm:text-xl text-[#6B7280] max-w-3xl mx-auto px-4">
              From AI-powered writing assistance to advanced analytics,
              we&apos;ve built the complete toolkit for modern creators.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group transition-all duration-300 hover:scale-105 card-glass"
              >
                <CardContent className="p-6 sm:p-8">
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 bg-[#111318] rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform"
                  >
                    <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#D1D5DB]" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl mb-3 sm:mb-4 metallic-subtle">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-[#6B7280]">
                    {feature.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Showcase */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6">
              <span className="gradient-text-primary">How it works</span>
            </h2>
            <p className="text-lg sm:text-xl text-[#6B7280] max-w-3xl mx-auto">
              Three powerful modules working together to supercharge your
              content creation.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3">
              <div className="space-y-4">
                {platformTabs.map((tab, index) => (
                  <Button
                    key={index}
                    variant={activeTab === index ? "outline" : "ghost"}
                    onClick={() => setActiveTab(index)}
                    className={`w-full justify-start h-auto p-6 ${
                      activeTab === index
                        ? "bg-gradient-to-br from-[#0A0A0F] via-[#0F0F19] to-[#0A0A0F] border border-[#1F2228]"
                        : "bg-gradient-to-br from-[#0A0A0F] via-[#0F0F19] to-[#0A0A0F] border border-[#1F2228]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          activeTab === index
                            ? "bg-[#111318]"
                            : "bg-[#111318]"
                        }`}
                      >
                        <tab.icon className={`w-6 h-6 ${activeTab === index ? "text-[#D1D5DB]" : "text-[#6B7280]"}`} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-lg metallic-subtle">{tab.title}</h3>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="lg:w-2/3">
              <Card className="bg-[#111318] border-[#1F2228]">
                <CardHeader>
                  <CardTitle className="text-2xl metallic-subtle">
                    {platformTabs[activeTab].title}
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-400">
                    {platformTabs[activeTab].description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {platformTabs[activeTab].features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-[#D1D5DB] flex-shrink-0" />
                        <span className="text-[#A1A1AA]">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-vignette-premium relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-12 sm:mb-16">
            <span className="gradient-text-primary">
              Loved by creators worldwide
            </span>
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 lg:gap-8">
            {socialProofStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-[#111318] rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#D1D5DB]" />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black mb-2 gradient-text-accent">
                  {stat.metric}
                </div>
                <div className="text-gray-400 text-base sm:text-lg">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="relative z-10 py-16 sm:py-24 px-4 sm:px-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6">
              <span className="gradient-text-primary">What creators say</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="transition-all duration-300 hover:shadow-lg card-glass"
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="mb-6 leading-relaxed text-[#A1A1AA]">
                    &quot;{testimonial.content}&quot;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12">
                      <Image
                        src={`https://images.unsplash.com/photo-${testimonial.imageId}?w=100&h=100&fit=crop&crop=face`}
                        alt={testimonial.name}
                        fill
                        className="rounded-full border-2 border-gray-700 object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <div className="font-semibold metallic-subtle">
                        {testimonial.name}
                      </div>
                      <div className="text-[#6B7280] text-sm">
                        {testimonial.role}
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {testimonial.company}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-r from-gray-900/50 to-black/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 sm:mb-8">
            <span className="gradient-text-primary">Ready to create?</span>
          </h2>
          <p className="text-xl text-[#6B7280] mb-8 sm:mb-12 max-w-2xl mx-auto">
            Join thousands of creators who are already building their audience
            and growing their business with our AI-powered platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/dashboard"
              ref={buttonRef3}
              className="inline-block transition-transform duration-700 ease-out"
              style={{
                transform: `translate(${magneticOffsets.button3.x}px, ${magneticOffsets.button3.y}px)`,
              }}
            >
              <Button
                size="xl"
                variant="primary"
                className="w-full"
              >
                Start Your Journey
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/feed">
              <Button
                variant="outline"
                size="xl"
                className="rounded-full w-full"
              >
                Explore the Feed
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            Made with ❤️ by{" "}
            <span className="text-foreground font-semibold">Himanshu</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;