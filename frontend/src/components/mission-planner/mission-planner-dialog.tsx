"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send, User, Bot, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useMissionActions } from "@/hooks/use-missions";
import { toast } from "sonner";

// Types for messages
type MessageRole = 'user' | 'assistant';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

// Initial messages from the assistant
const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Bonjour, je suis Alex, votre assistant de planification de mission. Je vais vous aider à définir précisément votre mission avant de la transmettre à notre super agent.\n\nPour commencer, pourriez-vous me décrire en quelques mots l'objectif principal de votre mission ?",
    timestamp: new Date()
  }
];

// Mission types
const missionTypes = [
  'prospection',
  'analyse',
  'veille',
  'recherche',
  'rédaction',
  'autre'
];

interface MissionPlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MissionPlannerDialog({ open, onOpenChange }: MissionPlannerDialogProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [missionData, setMissionData] = useState<{
    title?: string;
    description?: string;
    type?: string;
    dueDate?: string;
    objectives?: string[];
    constraints?: string[];
    step?: number;
  }>({ step: 1 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { createMission } = useMissionActions();
  const router = useRouter();

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to handle user input
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isSubmitting) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSubmitting(true);
    
    // Process the user's message based on the current step
    await processUserMessage(userMessage.content);
    
    setIsSubmitting(false);
  };

  // Function to add assistant message
  const addAssistantMessage = (content: string) => {
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, assistantMessage]);
  };

  // Process user message based on current step
  const processUserMessage = async (message: string) => {
    switch (missionData.step) {
      case 1: // Getting mission objective
        // Extract a title from the user's description
        const title = message.split('.')[0].trim();
        
        setMissionData(prev => ({
          ...prev,
          title: title.length > 5 ? title : message.substring(0, 30),
          description: message,
          step: 2
        }));
        
        // Ask for mission type
        setTimeout(() => {
          addAssistantMessage(
            `Merci pour cette description. Votre mission concernera donc "${title.length > 5 ? title : message.substring(0, 30)}".\n\n` +
            `Quel type de mission est-ce ? Vous pouvez choisir parmi :\n` +
            `- Prospection (recherche de clients/partenaires)\n` +
            `- Analyse (étude de marché, concurrence)\n` +
            `- Veille (surveillance des tendances)\n` +
            `- Recherche (informations spécifiques)\n` +
            `- Rédaction (contenu, emails)\n` +
            `- Autre (précisez)`
          );
        }, 1000);
        break;
        
      case 2: // Getting mission type
        let missionType = message.toLowerCase();
        
        // Try to match the message to a mission type
        const matchedType = missionTypes.find(type => 
          missionType.includes(type) || 
          (type === 'prospection' && missionType.includes('prospect'))
        );
        
        setMissionData(prev => ({
          ...prev,
          type: matchedType || 'autre',
          step: 3
        }));
        
        // Ask for objectives
        setTimeout(() => {
          addAssistantMessage(
            `Parfait. Maintenant, pourriez-vous me donner les objectifs spécifiques de cette mission ?\n\n` +
            `Par exemple :\n` +
            `- Combien de prospects/informations recherchez-vous ?\n` +
            `- Quels secteurs ou régions vous intéressent ?\n` +
            `- Y a-t-il des critères particuliers à prendre en compte ?`
          );
        }, 1000);
        break;
        
      case 3: // Getting objectives
        setMissionData(prev => ({
          ...prev,
          objectives: message.split('\n').filter(line => line.trim().length > 0),
          step: 4
        }));
        
        // Ask for constraints or deadline
        setTimeout(() => {
          addAssistantMessage(
            `Merci pour ces précisions. Y a-t-il des contraintes particulières ou une date limite pour cette mission ?\n\n` +
            `Par exemple :\n` +
            `- Budget limité\n` +
            `- Délai spécifique (ex: "avant le 15 juin")\n` +
            `- Restrictions géographiques\n` +
            `- Autres contraintes importantes`
          );
        }, 1000);
        break;
        
      case 4: // Getting constraints and deadline
        // Try to extract a date if present
        const datePattern = /avant\s+le\s+(\d{1,2})[\/\s-](\d{1,2}|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)[\/\s-]?(\d{4})?/i;
        const dateMatch = message.match(datePattern);
        
        let dueDate = undefined;
        if (dateMatch) {
          // Convert month name to number if needed
          const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
          let month = dateMatch[2];
          if (isNaN(parseInt(month))) {
            const monthIndex = monthNames.findIndex(m => m.toLowerCase() === month.toLowerCase());
            if (monthIndex !== -1) {
              month = (monthIndex + 1).toString();
            }
          }
          
          // Create date string
          const day = dateMatch[1].padStart(2, '0');
          month = month.padStart(2, '0');
          const year = dateMatch[3] || new Date().getFullYear().toString();
          
          dueDate = `${year}-${month}-${day}`;
        }
        
        setMissionData(prev => ({
          ...prev,
          constraints: message.split('\n').filter(line => line.trim().length > 0),
          dueDate,
          step: 5
        }));
        
        // Summarize the mission
        setTimeout(() => {
          const summary = `
Voici le récapitulatif de votre mission :

**Titre** : ${missionData.title}

**Type** : ${missionData.type}

**Description** : ${missionData.description}

**Objectifs** :
${missionData.objectives?.map(obj => `- ${obj}`).join('\n')}

**Contraintes** :
${message.split('\n').filter(line => line.trim().length > 0).map(con => `- ${con}`).join('\n')}
${dueDate ? `\n**Date limite** : ${dueDate}` : ''}

Est-ce que ce récapitulatif vous convient ? Si oui, je vais créer cette mission et la transmettre à notre super agent. Sinon, dites-moi ce que vous souhaitez modifier.
          `;
          
          addAssistantMessage(summary);
        }, 1500);
        break;
        
      case 5: // Confirmation
        if (message.toLowerCase().includes('oui') || message.toLowerCase().includes('parfait') || message.toLowerCase().includes('ok') || message.toLowerCase().includes('convient')) {
          // User confirmed, create the mission
          addAssistantMessage("Excellent ! Je crée votre mission et la transmets à notre super agent...");
          
          try {
            // Format the description to include all the details
            const formattedDescription = `
${missionData.description}

Objectifs :
${missionData.objectives?.map(obj => `- ${obj}`).join('\n')}

Contraintes :
${missionData.constraints?.map(con => `- ${con}`).join('\n')}
            `.trim();
            
            // Create the mission
            const mission = await createMission({
              title: missionData.title || "Nouvelle mission",
              description: formattedDescription,
              status: "pending",
              type: missionData.type || "autre",
              dueDate: missionData.dueDate
            });
            
            if (mission) {
              setTimeout(() => {
                addAssistantMessage(
                  "✅ Mission créée avec succès !\n\n" +
                  "Vous pouvez maintenant accéder à votre mission depuis le tableau de bord et suivre son avancement. " +
                  "Notre super agent Alex est prêt à travailler sur cette mission dès que vous le souhaiterez.\n\n" +
                  "Souhaitez-vous commencer à travailler sur cette mission maintenant ?"
                );
                
                setMissionData(prev => ({
                  ...prev,
                  step: 6,
                  missionId: mission.id
                }));
              }, 1500);
            } else {
              throw new Error("Échec de la création de la mission");
            }
          } catch (error) {
            console.error("Error creating mission:", error);
            addAssistantMessage(
              "Je suis désolé, mais une erreur est survenue lors de la création de la mission. " +
              "Veuillez réessayer ultérieurement ou contacter notre support."
            );
          }
        } else {
          // User wants to modify something
          addAssistantMessage(
            "D'accord, reprenons. Que souhaitez-vous modifier dans cette mission ?\n\n" +
            "1. Le titre\n" +
            "2. La description\n" +
            "3. Le type de mission\n" +
            "4. Les objectifs\n" +
            "5. Les contraintes\n" +
            "6. La date limite\n\n" +
            "Indiquez le numéro correspondant ou décrivez ce que vous voulez changer."
          );
          
          setMissionData(prev => ({
            ...prev,
            step: 5.1
          }));
        }
        break;
        
      case 5.1: // Handling modifications
        // Simple logic to determine what to modify
        if (message.includes("1") || message.toLowerCase().includes("titre")) {
          addAssistantMessage("Quel nouveau titre souhaitez-vous donner à cette mission ?");
          setMissionData(prev => ({ ...prev, step: 5.2, modifying: 'title' }));
        } else if (message.includes("2") || message.toLowerCase().includes("description")) {
          addAssistantMessage("Veuillez fournir une nouvelle description pour cette mission.");
          setMissionData(prev => ({ ...prev, step: 5.2, modifying: 'description' }));
        } else if (message.includes("3") || message.toLowerCase().includes("type")) {
          addAssistantMessage(
            "Quel nouveau type de mission souhaitez-vous définir ? Vous pouvez choisir parmi :\n" +
            "- Prospection (recherche de clients/partenaires)\n" +
            "- Analyse (étude de marché, concurrence)\n" +
            "- Veille (surveillance des tendances)\n" +
            "- Recherche (informations spécifiques)\n" +
            "- Rédaction (contenu, emails)\n" +
            "- Autre (précisez)"
          );
          setMissionData(prev => ({ ...prev, step: 5.2, modifying: 'type' }));
        } else if (message.includes("4") || message.toLowerCase().includes("objectif")) {
          addAssistantMessage("Veuillez redéfinir les objectifs de cette mission.");
          setMissionData(prev => ({ ...prev, step: 5.2, modifying: 'objectives' }));
        } else if (message.includes("5") || message.toLowerCase().includes("contrainte")) {
          addAssistantMessage("Veuillez redéfinir les contraintes de cette mission.");
          setMissionData(prev => ({ ...prev, step: 5.2, modifying: 'constraints' }));
        } else if (message.includes("6") || message.toLowerCase().includes("date") || message.toLowerCase().includes("limite") || message.toLowerCase().includes("deadline")) {
          addAssistantMessage("Quelle est la nouvelle date limite pour cette mission ? (format: JJ/MM/AAAA)");
          setMissionData(prev => ({ ...prev, step: 5.2, modifying: 'dueDate' }));
        } else {
          addAssistantMessage(
            "Je n'ai pas bien compris ce que vous souhaitez modifier. Pourriez-vous préciser en utilisant les numéros de 1 à 6 ?\n\n" +
            "1. Le titre\n" +
            "2. La description\n" +
            "3. Le type de mission\n" +
            "4. Les objectifs\n" +
            "5. Les contraintes\n" +
            "6. La date limite"
          );
        }
        break;
        
      case 5.2: // Applying modifications
        const modifying = missionData.modifying;
        
        if (modifying === 'title') {
          setMissionData(prev => ({ ...prev, title: message, step: 5 }));
        } else if (modifying === 'description') {
          setMissionData(prev => ({ ...prev, description: message, step: 5 }));
        } else if (modifying === 'type') {
          const matchedType = missionTypes.find(type => 
            message.toLowerCase().includes(type) || 
            (type === 'prospection' && message.toLowerCase().includes('prospect'))
          );
          setMissionData(prev => ({ ...prev, type: matchedType || 'autre', step: 5 }));
        } else if (modifying === 'objectives') {
          setMissionData(prev => ({ 
            ...prev, 
            objectives: message.split('\n').filter(line => line.trim().length > 0),
            step: 5 
          }));
        } else if (modifying === 'constraints') {
          setMissionData(prev => ({ 
            ...prev, 
            constraints: message.split('\n').filter(line => line.trim().length > 0),
            step: 5 
          }));
        } else if (modifying === 'dueDate') {
          // Try to parse the date
          let dueDate = undefined;
          
          // Check for DD/MM/YYYY format
          const dateRegex = /(\d{1,2})[\/\s-](\d{1,2})[\/\s-]?(\d{4})?/;
          const match = message.match(dateRegex);
          
          if (match) {
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            const year = match[3] || new Date().getFullYear().toString();
            
            dueDate = `${year}-${month}-${day}`;
          }
          
          setMissionData(prev => ({ ...prev, dueDate, step: 5 }));
        }
        
        // Re-display the summary with updated information
        setTimeout(() => {
          const summary = `
Voici le récapitulatif mis à jour de votre mission :

**Titre** : ${missionData.title}

**Type** : ${missionData.type}

**Description** : ${missionData.description}

**Objectifs** :
${missionData.objectives?.map(obj => `- ${obj}`).join('\n')}

**Contraintes** :
${missionData.constraints?.map(con => `- ${con}`).join('\n')}
${missionData.dueDate ? `\n**Date limite** : ${missionData.dueDate}` : ''}

Est-ce que ce récapitulatif vous convient maintenant ? Si oui, je vais créer cette mission et la transmettre à notre super agent.
          `;
          
          addAssistantMessage(summary);
        }, 1000);
        break;
        
      case 6: // Start working with super agent?
        if (message.toLowerCase().includes('oui') || message.toLowerCase().includes('commencer') || message.toLowerCase().includes('maintenant')) {
          // User wants to start working on the mission now
          addAssistantMessage(
            "Parfait ! Je vous redirige vers notre super agent Alex qui va travailler avec vous sur cette mission. " +
            "Il a déjà toutes les informations nécessaires pour commencer."
          );
          
          // Close the dialog after a short delay and redirect
          setTimeout(() => {
            onOpenChange(false);
            
            // Create a thread for this mission and redirect
            createThreadForMission();
          }, 2000);
        } else {
          // User doesn't want to start now
          addAssistantMessage(
            "D'accord ! Votre mission est enregistrée et vous pourrez y accéder à tout moment depuis le tableau de bord. " +
            "N'hésitez pas à revenir quand vous serez prêt à travailler dessus avec notre super agent."
          );
          
          // Close the dialog after a short delay
          setTimeout(() => {
            onOpenChange(false);
            router.push('/missions');
          }, 2000);
        }
        break;
    }
  };

  // Create a thread for the mission and redirect
  const createThreadForMission = async () => {
    try {
      // Create a new thread
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Mission: ${missionData.title}`,
          systemPrompt: `Tu es Alex, le concierge d'OrchestraConnect. Tu travailles sur la mission suivante:\n\nTitre: ${missionData.title}\nDescription: ${missionData.description}\nType: ${missionData.type}\n\nObjectifs:\n${missionData.objectives?.map(obj => `- ${obj}`).join('\n')}\n\nContraintes:\n${missionData.constraints?.map(con => `- ${con}`).join('\n')}\n\nTon objectif est d'aider l'utilisateur à accomplir cette mission. Commence par te présenter et demander comment tu peux aider avec cette mission spécifique.`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create thread');
      }
      
      const data = await response.json();
      const threadId = data.thread.thread_id;
      
      // Link the thread to the mission if we have a mission ID
      if (missionData.missionId) {
        await fetch(`/api/missions/${missionData.missionId}/threads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ threadId }),
        });
      }
      
      // Navigate to the new thread
      router.push(`/agents/${threadId}`);
    } catch (error) {
      console.error('Error creating thread for mission:', error);
      toast.error("Impossible de démarrer la conversation avec le super agent");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Planificateur de mission</DialogTitle>
          <DialogDescription>
            Discutez avec Alex pour définir votre mission avant de la transmettre au super agent.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8">
                    {message.role === 'assistant' ? (
                      <AvatarImage src="/logo.png" alt="Alex" />
                    ) : null}
                    <AvatarFallback>
                      {message.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`rounded-lg px-4 py-2 ${
                    message.role === 'assistant' 
                      ? 'bg-muted text-foreground' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    <div className="whitespace-pre-line text-sm">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex items-end gap-2 pt-4">
          <Textarea
            placeholder="Écrivez votre message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="min-h-[60px] flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={isSubmitting || !inputValue.trim()}>
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
