import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Calendar, Clock, User, ArrowRight, Search } from "lucide-react";
import { Input } from "../ui/input";

interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
}

// Articles de blog temporaires (en attendant la connexion Supabase)
const mockArticles: BlogArticle[] = [
  {
    id: "1",
    title: "Les secrets des forêts primaires de Madagascar",
    excerpt:
      "Découvrez la biodiversité exceptionnelle des forêts malgaches et les espèces endémiques qui les peuplent.",
    image:
      "https://images.unsplash.com/photo-1745151485547-8d428247c1ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibG9nJTIwd3JpdGluZyUyMGNvbnRlbnR8ZW58MXx8fHwxNzYwMDA3Nzc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    author: "Équipe GasyWay",
    date: "15 Mars 2024",
    readTime: "5 min",
    category: "Nature",
  },
  {
    id: "2",
    title: "Tourisme responsable : nos engagements",
    excerpt:
      "Comment GasyWay s'engage à créer un impact positif sur les communautés locales et l'environnement.",
    image:
      "https://images.unsplash.com/photo-1557500629-29c45898e875?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNYWRhZ2FzY2FyJTIwY29tbXVuaXR5JTIwbG9jYWx8ZW58MXx8fHwxNzYwMDQ1NjI2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    author: "Équipe GasyWay",
    date: "10 Mars 2024",
    readTime: "7 min",
    category: "Tourisme Responsable",
  },
  {
    id: "3",
    title: "Guide pratique : préparer votre voyage à Madagascar",
    excerpt:
      "Tous nos conseils pour un voyage réussi : visa, santé, budget, meilleure période et astuces locales.",
    image:
      "https://images.unsplash.com/photo-1602174423520-daa2d87175a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNYWRhZ2FzY2FyJTIwbGFuZHNjYXBlJTIwc3Vuc2V0fGVufDF8fHx8MTc2MDA0NTYyNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    author: "Équipe GasyWay",
    date: "5 Mars 2024",
    readTime: "10 min",
    category: "Conseils",
  },
];

export function BlogPage() {
  const [articles] = useState<BlogArticle[]>(mockArticles);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 px-4 sm:px-6 lg:px-8 pb-16">
      {/* Hero Section */}
      <div className="relative h-[300px] -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1745151485547-8d428247c1ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibG9nJTIwd3JpdGluZyUyMGNvbnRlbnR8ZW58MXx8fHwxNzYwMDA3Nzc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Blog GasyWay"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 rounded-[32px]">
          <h1 className="text-white mb-4">Blog GasyWay</h1>
          <p className="text-white max-w-2xl">
            Découvrez Madagascar à travers nos articles, guides et récits de
            voyage.
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <Card
            key={article.id}
            className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
          >
            <div className="relative h-48 overflow-hidden">
              <ImageWithFallback
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full">
                  {article.category}
                </span>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              <h3 className="text-primary">{article.title}</h3>
              <p className="text-muted-foreground line-clamp-2">
                {article.excerpt}
              </p>

              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{article.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{article.author}</span>
                </div>
                <Button variant="ghost" size="sm" className="group-hover:text-accent">
                  Lire plus
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon Section */}
      <div className="text-center py-12 space-y-4 bg-secondary rounded-2xl p-8">
        <h2 className="text-primary">Bientôt plus d'articles</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Nous publions régulièrement de nouveaux articles sur Madagascar, le
          tourisme responsable et nos expériences uniques. Revenez bientôt !
        </p>
        <Button variant="outline" disabled>
          S'abonner à la newsletter
        </Button>
      </div>
    </div>
  );
}
