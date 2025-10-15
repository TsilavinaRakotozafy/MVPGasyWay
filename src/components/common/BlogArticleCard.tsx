import React from "react";
import { Calendar, Tag } from "lucide-react";
import { Card } from "../ui/card";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface BlogArticleCardProps {
  image: string;
  alt: string;
  date: string;
  category: string;
  title: string;
  excerpt: string;
}

export function BlogArticleCard({
  image,
  alt,
  date,
  category,
  title,
  excerpt,
}: BlogArticleCardProps) {
  return (
    <Card className="bg-card rounded-3xl border border-secondary overflow-hidden">
      <div className="h-64 relative">
        <ImageWithFallback
          src={image}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="space-y-4 pb-[16px] px-6 pt-[0px] pr-[16px] pl-[16px]">
        <div className="flex items-center gap-7 mt-[0px] mr-[0px] mb-[8px] ml-[0px]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">
              {date.replace(/janvier/g, 'Jan').replace(/février/g, 'Fév').replace(/mars/g, 'Mar').replace(/avril/g, 'Avr').replace(/mai/g, 'Mai').replace(/juin/g, 'Jun').replace(/juillet/g, 'Jul').replace(/août/g, 'Aoû').replace(/septembre/g, 'Sep').replace(/octobre/g, 'Oct').replace(/novembre/g, 'Nov').replace(/décembre/g, 'Déc')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">
              {category}
            </span>
          </div>
        </div>
        <h4 className="text-primary mt-[0px] mr-[0px] mb-[8px] ml-[0px]">{title}</h4>
        <p className="text-muted-foreground">{excerpt}</p>
      </div>
    </Card>
  );
}