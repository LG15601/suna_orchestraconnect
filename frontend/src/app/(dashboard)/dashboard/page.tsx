"use client";

import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from 'next/navigation';
import {
  Menu,
  PlusCircle,
  Briefcase,
  Clock,
  CheckCircle,
  BarChart3,
  Calendar,
  ArrowRight,
  MessageSquare,
  Loader2,
  Sparkles
} from "lucide-react";
import { MissionPlannerDialog } from "@/components/mission-planner/mission-planner-dialog";
import { ChatInput, ChatInputHandles } from '@/components/thread/chat-input';
import { initiateAgent, createThread, addUserMessage, startAgent, createProject, BillingError } from "@/lib/api";
import { generateThreadName } from "@/lib/actions/threads";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBillingError } from "@/hooks/useBillingError";
import { BillingErrorAlert } from "@/components/billing/usage-limit-alert";
import { useAccounts } from "@/hooks/use-accounts";
import { isLocalMode, config } from "@/lib/config";
import { toast } from "sonner";
import { useMissions } from "@/hooks/use-missions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Constant for localStorage key to ensure consistency
const PENDING_PROMPT_KEY = 'pendingAgentPrompt';

function DashboardContent() {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [showMissionPlanner, setShowMissionPlanner] = useState(false);
  const { billingError, handleBillingError, clearBillingError } = useBillingError();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const { data: accounts } = useAccounts();
  const personalAccount = accounts?.find(account => account.personal_account);
  const chatInputRef = useRef<ChatInputHandles>(null);
  const { data: missionsData, isLoading: missionsLoading } = useMissions();
  const missions = missionsData?.missions || [];

  // Calculate mission statistics
  const pendingMissions = missions.filter(m => m.status === 'pending').length;
  const inProgressMissions = missions.filter(m => m.status === 'in-progress').length;
  const completedMissions = missions.filter(m => m.status === 'completed').length;
  const totalMissions = missions.length;

  // Calculate completion percentage
  const completionPercentage = totalMissions > 0
    ? Math.round((completedMissions / totalMissions) * 100)
    : 0;

  // Get recent missions
  const recentMissions = [...missions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Get upcoming missions (with due dates in the future)
  const upcomingMissions = missions
    .filter(m => m.dueDate && new Date(m.dueDate) > new Date() && m.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);

  // Check for thread deletion success message on page load
  useEffect(() => {
    const wasThreadDeleted = sessionStorage.getItem('thread_deleted');
    const deletedThreadId = sessionStorage.getItem('deleted_thread_id');

    if (wasThreadDeleted === 'true' && deletedThreadId) {
      // Show success message
      toast.success("Conversation supprimée avec succès");

      // Clear the flags from sessionStorage
      sessionStorage.removeItem('thread_deleted');
      sessionStorage.removeItem('deleted_thread_id');
    }
  }, []);

  const handleSubmit = async (message: string, options?: { model_name?: string; enable_thinking?: boolean; reasoning_effort?: string; stream?: boolean; enable_context_manager?: boolean }) => {
    if ((!message.trim() && !(chatInputRef.current?.getPendingFiles().length)) || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const files = chatInputRef.current?.getPendingFiles() || [];
      localStorage.removeItem(PENDING_PROMPT_KEY);

      if (files.length > 0) {
        // ---- Handle submission WITH files ----
        console.log(`Submitting with message: "${message}" and ${files.length} files.`);
        const formData = new FormData();

        // Use 'prompt' key instead of 'message'
        formData.append('prompt', message);

        // Append files
        files.forEach((file, index) => {
          formData.append('files', file, file.name);
        });

        // Append options individually instead of bundled 'options' field
        if (options?.model_name) formData.append('model_name', options.model_name);
        // Default values from backend signature if not provided in options:
        formData.append('enable_thinking', String(options?.enable_thinking ?? false));
        formData.append('reasoning_effort', options?.reasoning_effort ?? 'low');
        formData.append('stream', String(options?.stream ?? true));
        formData.append('enable_context_manager', String(options?.enable_context_manager ?? false));

        console.log('FormData content:', Array.from(formData.entries()));

        const result = await initiateAgent(formData);
        console.log('Agent initiated with files:', result);

        if (result.thread_id) {
          router.push(`/agents/${result.thread_id}`);
        } else {
          throw new Error("Agent initiation did not return a thread_id.");
        }
        chatInputRef.current?.clearPendingFiles();

      } else {
        // ---- Handle text-only messages (NO CHANGES NEEDED HERE) ----
        console.log(`Submitting text-only message: "${message}"`);
        const projectName = await generateThreadName(message);
        const newProject = await createProject({ name: projectName, description: "" });
        const thread = await createThread(newProject.id);
        await addUserMessage(thread.thread_id, message);
        await startAgent(thread.thread_id, options); // Pass original options here
        router.push(`/agents/${thread.thread_id}`);
      }
    } catch (error: any) {
        console.error('Error during submission process:', error);
        if (error instanceof BillingError) {
             // Delegate billing error handling
             console.log("Handling BillingError:", error.detail);
             handleBillingError({
                message: error.detail.message || 'Monthly usage limit reached. Please upgrade your plan.',
                currentUsage: error.detail.currentUsage as number | undefined,
                limit: error.detail.limit as number | undefined,
                subscription: error.detail.subscription || {
                    price_id: config.SUBSCRIPTION_TIERS.FREE.priceId,
                    plan_name: "Free"
                }
             });
             setIsSubmitting(false);
             return; // Stop further processing for billing errors
        }

        // Handle other errors
        const isConnectionError = error instanceof TypeError && error.message.includes('Failed to fetch');
        if (!isLocalMode() || isConnectionError) {
           toast.error(error.message || "An unexpected error occurred");
        }
        setIsSubmitting(false); // Reset submitting state on all errors
    }
  };

  // Check for pending prompt in localStorage on mount
  useEffect(() => {
    // Use a small delay to ensure we're fully mounted
    const timer = setTimeout(() => {
      const pendingPrompt = localStorage.getItem(PENDING_PROMPT_KEY);

      if (pendingPrompt) {
        setInputValue(pendingPrompt);
        setAutoSubmit(true); // Flag to auto-submit after mounting
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Auto-submit the form if we have a pending prompt
  useEffect(() => {
    if (autoSubmit && inputValue && !isSubmitting) {
      const timer = setTimeout(() => {
        handleSubmit(inputValue);
        setAutoSubmit(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [autoSubmit, inputValue, isSubmitting]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      {isMobile && (
        <div className="absolute top-4 left-4 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpenMobile(true)}
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open menu</TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total des missions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalMissions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingMissions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{inProgressMissions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Terminées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedMissions}</div>
              </CardContent>
            </Card>
          </div>

          {/* Create Mission Card */}
          <Card className="mb-8 overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="p-6 md:w-2/3">
                <h2 className="text-2xl font-bold mb-2">Créer une nouvelle mission</h2>
                <p className="text-muted-foreground mb-4">
                  Discutez avec Alex, votre assistant de planification, pour définir précisément votre mission avant de la transmettre au super agent.
                </p>
                <Button
                  onClick={() => setShowMissionPlanner(true)}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Planifier une mission avec Alex
                </Button>
              </div>
              <div className="bg-muted p-6 md:w-1/3 flex items-center justify-center">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Définissez vos objectifs, contraintes et délais pour des résultats optimaux
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Progress Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Progression des missions</CardTitle>
              <CardDescription>Suivi de l'avancement global de vos missions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Recent and Upcoming Missions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Recent Missions */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Missions récentes</CardTitle>
                  <Link href="/missions">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Voir tout
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {missionsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : recentMissions.length > 0 ? (
                  <div className="space-y-4">
                    {recentMissions.map(mission => (
                      <Link href={`/missions?id=${mission.id}`} key={mission.id}>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <div className={`p-2 rounded-full
                            ${mission.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              mission.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                            {mission.status === 'completed' ? <CheckCircle className="h-4 w-4" /> :
                             mission.status === 'in-progress' ? <Clock className="h-4 w-4" /> :
                             <Briefcase className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{mission.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Créée {formatDistanceToNow(new Date(mission.createdAt), { addSuffix: true, locale: fr })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Aucune mission récente</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowMissionPlanner(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Créer une mission
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Missions */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Missions à venir</CardTitle>
                  <Link href="/missions">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Voir tout
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {missionsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : upcomingMissions.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMissions.map(mission => (
                      <Link href={`/missions?id=${mission.id}`} key={mission.id}>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <div className="p-2 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{mission.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Échéance {formatDistanceToNow(new Date(mission.dueDate!), { addSuffix: true, locale: fr })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Aucune mission à venir</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowMissionPlanner(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Créer une mission
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat with Alex */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Discuter avec Alex</CardTitle>
              <CardDescription>Posez une question ou demandez de l'aide à votre concierge</CardDescription>
            </CardHeader>
            <CardContent>
              <ChatInput
                ref={chatInputRef}
                onSubmit={handleSubmit}
                loading={isSubmitting}
                placeholder="Demandez à Alex..."
                value={inputValue}
                onChange={setInputValue}
                hideAttachments={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mission Planner Dialog */}
      <MissionPlannerDialog
        open={showMissionPlanner}
        onOpenChange={setShowMissionPlanner}
      />

      {/* Billing Error Alert */}
      <BillingErrorAlert
        message={billingError?.message}
        currentUsage={billingError?.currentUsage}
        limit={billingError?.limit}
        accountId={personalAccount?.account_id}
        onDismiss={clearBillingError}
        isOpen={!!billingError}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[90%]">
          <div className="flex flex-col items-center text-center mb-10">
            <Skeleton className="h-10 w-40 mb-2" />
            <Skeleton className="h-7 w-56" />
          </div>

          <Skeleton className="w-full h-[100px] rounded-xl" />
          <div className="flex justify-center mt-3">
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
