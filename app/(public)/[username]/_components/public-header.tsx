import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/logo";
import Link from "next/link";
import React from "react";

interface PublicHeaderProps {
  link: string;
  title: string;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ link, title }) => {
  return (
    <header 
      className="bg-vignette-premium border-b border-[#1F2228] sticky top-0 backdrop-blur-sm z-10"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={link}>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#6B7280] hover:text-[#EDEEF0]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {title}
          </Button>
        </Link>
        <Logo href={"/"} size="md" />
      </div>
    </header>
  );
};

export default PublicHeader;