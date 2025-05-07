"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { useAccounts } from "@/hooks/use-accounts";
import { useMissions, useMissionActions, type Mission, type MissionStatus } from "@/hooks/use-missions";

// Status badge component
function StatusBadge({ status }: { status: MissionStatus }) {
  const statusConfig = {
    "pending": { label: "En attente", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500" },
    "in-progress": { label: "En cours", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500" },
    "completed": { label: "Terminée", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500" },
    "failed": { label: "Échouée", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500" }
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

// Mission card component
function MissionCard({ mission, onSelect }: { mission: Mission, onSelect: (mission: Mission) => void }) {
  const formattedDate = new Date(mission.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(mission)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{mission.title}</CardTitle>
          <StatusBadge status={mission.status} />
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Créée le {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm line-clamp-2">{mission.description}</p>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {mission.dueDate ? new Date(mission.dueDate).toLocaleDateString('fr-FR') : 'Pas de date limite'}
        </div>
        <div className="capitalize">{mission.type}</div>
      </CardFooter>
    </Card>
  );
}

// New mission form component
function NewMissionForm({ onClose }: { onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [dueDate, setDueDate] = useState("");
  const { toast } = useToast();
  const { data: accounts } = useAccounts();
  const personalAccount = accounts?.find(account => account.personal_account);
  const { createMission } = useMissionActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !type) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const mission = await createMission({
      title,
      description,
      status: "pending",
      type,
      dueDate: dueDate || undefined
    });

    setIsSubmitting(false);

    if (mission) {
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">Titre</label>
        <Input
          id="title"
          placeholder="Titre de la mission"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <textarea
          id="description"
          className="w-full min-h-[100px] p-2 rounded-md border border-input bg-transparent text-sm shadow-sm"
          placeholder="Décrivez la mission en détail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">Type de mission</label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prospection">Prospection</SelectItem>
            <SelectItem value="analyse">Analyse</SelectItem>
            <SelectItem value="veille">Veille</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="dueDate" className="text-sm font-medium">Date limite (optionnelle)</label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création...
            </>
          ) : (
            'Créer la mission'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Main dashboard component
export default function MissionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showNewMissionDialog, setShowNewMissionDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();
  const { user } = useAuth();
  const { data: accounts } = useAccounts();
  const personalAccount = accounts?.find(account => account.personal_account);
  const { data, error, isLoading, mutate } = useMissions();

  const missions = data?.missions || [];

  const filteredMissions = missions.filter(mission => {
    // Filter by search query
    const matchesSearch = mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mission.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by tab
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return mission.status === "pending" && matchesSearch;
    if (activeTab === "in-progress") return mission.status === "in-progress" && matchesSearch;
    if (activeTab === "completed") return mission.status === "completed" && matchesSearch;

    return matchesSearch;
  });

  const handleMissionSelect = (mission: Mission) => {
    setSelectedMission(mission);
    // In a real app, you would navigate to the mission detail page
    // router.push(`/missions/${mission.id}`);
  };

  const { linkThreadToMission } = useMissionActions();

  const handleStartChat = async () => {
    if (selectedMission) {
      try {
        // Create a new thread for the mission
        const response = await fetch('/api/threads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `Mission: ${selectedMission.title}`,
            systemPrompt: `Tu es Alex, le concierge d'OrchestraConnect. Tu travailles sur la mission suivante:\n\nTitre: ${selectedMission.title}\nDescription: ${selectedMission.description}\nType: ${selectedMission.type}\n\nTon objectif est d'aider l'utilisateur à accomplir cette mission. Commence par te présenter et demander comment tu peux aider avec cette mission spécifique.`
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create thread');
        }

        const data = await response.json();
        const threadId = data.thread.thread_id;

        // Link the thread to the mission
        await linkThreadToMission(selectedMission.id, threadId);

        // Navigate to the new thread
        router.push(`/agents/${threadId}`);
      } catch (error) {
        console.error('Error starting chat:', error);
        toast({
          title: "Erreur",
          description: "Impossible de démarrer la conversation.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Missions</h1>
        <Dialog open={showNewMissionDialog} onOpenChange={setShowNewMissionDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle mission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle mission</DialogTitle>
              <DialogDescription>
                Définissez les détails de votre mission pour Alex, votre concierge.
              </DialogDescription>
            </DialogHeader>
            <NewMissionForm onClose={() => setShowNewMissionDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une mission..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="in-progress">En cours</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="opacity-70">
                  <CardHeader className="pb-2">
                    <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="h-4 w-full bg-muted rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="h-3 w-1/3 bg-muted rounded animate-pulse"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredMissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onSelect={handleMissionSelect}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Aucune mission trouvée</h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery
                  ? "Aucune mission ne correspond à votre recherche."
                  : "Vous n'avez pas encore créé de mission."}
              </p>
              <Button
                className="mt-4"
                onClick={() => setShowNewMissionDialog(true)}
              >
                Créer une mission
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="pending" className="mt-6">
          {/* Same structure as "all" tab but filtered for pending missions */}
          {/* This would be a duplicate of the above code with filtered data */}
        </TabsContent>
        <TabsContent value="in-progress" className="mt-6">
          {/* Same structure as "all" tab but filtered for in-progress missions */}
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          {/* Same structure as "all" tab but filtered for completed missions */}
        </TabsContent>
      </Tabs>

      {selectedMission && (
        <Dialog open={!!selectedMission} onOpenChange={(open) => !open && setSelectedMission(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedMission.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={selectedMission.status} />
                <span className="text-xs text-muted-foreground capitalize">
                  Type: {selectedMission.type}
                </span>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm">{selectedMission.description}</p>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <h4 className="font-medium mb-1">Date de création</h4>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(selectedMission.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {selectedMission.dueDate && (
                  <div>
                    <h4 className="font-medium mb-1">Date limite</h4>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(selectedMission.dueDate).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}
              </div>

              {selectedMission.status === "completed" && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Résultats</h4>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p>Les résultats de cette mission sont disponibles.</p>
                    <Button variant="link" className="p-0 h-auto text-sm">
                      Voir le rapport complet
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedMission(null)}>
                Fermer
              </Button>
              <Button onClick={handleStartChat} disabled={selectedMission?.status === 'completed'}>
                <MessageSquare className="mr-2 h-4 w-4" />
                {selectedMission?.status === 'completed'
                  ? 'Mission terminée'
                  : 'Discuter avec Alex'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
