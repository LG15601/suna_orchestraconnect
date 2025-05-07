"use client";

import { siteConfig } from "@/lib/home";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { CalendarClock, FileSearch, Globe, Mail, MessageSquare, Phone, ShoppingCart, Truck } from "lucide-react";

export function ServicesSection() {
  return (
    <section id="services" className="w-full py-24 md:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              Nos services
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Nos services de conciergerie B2B
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Découvrez comment Orchestra peut simplifier le quotidien de votre entreprise et optimiser vos ressources
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm"
          >
            <div className="rounded-full bg-primary/10 p-3">
              <CalendarClock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Assistance administrative</h3>
            <p className="text-center text-muted-foreground">
              Gestion de l'agenda, organisation de réunions, traitement des emails et coordination des tâches administratives.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm"
          >
            <div className="rounded-full bg-primary/10 p-3">
              <FileSearch className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Veille stratégique</h3>
            <p className="text-center text-muted-foreground">
              Analyse de marché, suivi concurrentiel et recherche d'informations stratégiques pour vos décisions d'entreprise.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm"
          >
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Gestion de projet</h3>
            <p className="text-center text-muted-foreground">
              Coordination d'équipes, suivi des délais, organisation de réunions et reporting pour vos projets d'entreprise.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm"
          >
            <div className="rounded-full bg-primary/10 p-3">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Support commercial</h3>
            <p className="text-center text-muted-foreground">
              Prospection, qualification de leads, préparation de propositions commerciales et suivi client pour développer votre activité.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm"
          >
            <div className="rounded-full bg-primary/10 p-3">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Organisation d'événements</h3>
            <p className="text-center text-muted-foreground">
              Planification de séminaires, réservations, coordination des prestataires et gestion logistique pour vos événements professionnels.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm"
          >
            <div className="rounded-full bg-primary/10 p-3">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Recrutement & RH</h3>
            <p className="text-center text-muted-foreground">
              Recherche de candidats, présélection de CV, organisation d'entretiens et intégration des nouveaux collaborateurs.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
