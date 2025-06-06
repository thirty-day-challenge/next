"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePwa } from "@/hooks/use-pwa";
import { toast } from "@/hooks/use-toast";
import { useUrlState } from "@/hooks/use-url-state";
import {
  EXCELLENT_PROGRESS_THRESHOLD,
  GOOD_PROGRESS_THRESHOLD,
} from "@/lib/constants";
import { Challenge, DailyProgress } from "@/lib/db/drizzle/zod";
import {
  calculateCompletionRate,
  calculateElapsedTime,
} from "@/lib/util/dates";
import { trpc } from "@/lib/util/trpc";
import { Pencil, PlusCircle, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { EditChallengeDialog } from "./organism/challenge-form/EditChallengeDialog";
import { Leaderboard } from "./organism/Leaderboard";
import { PwaInstallDialog } from "./PwaInstallDialog";
import { LoadingSpinner } from "./ui/loading-spinner";

const ProgressBar = ({
  elapsedTime,
  completionRate,
}: {
  elapsedTime: number;
  completionRate: number;
}) => {
  const backgroundColor =
    completionRate >= EXCELLENT_PROGRESS_THRESHOLD
      ? "bg-green-500"
      : completionRate >= GOOD_PROGRESS_THRESHOLD
        ? "bg-orange-300"
        : "bg-red-300";
  const textColor =
    completionRate >= EXCELLENT_PROGRESS_THRESHOLD
      ? "text-green-600"
      : completionRate >= GOOD_PROGRESS_THRESHOLD
        ? "text-orange-600"
        : "text-red-600";
  const emoji =
    completionRate >= EXCELLENT_PROGRESS_THRESHOLD
      ? "✅"
      : completionRate >= GOOD_PROGRESS_THRESHOLD
        ? "🟠"
        : "🔴";

  return (
    <div className="relative w-full space-y-3">
      <div className="mb-1 flex justify-between text-xs font-semibold">
        <span className="text-gray-600">
          🕒 Time Elapsed:{" "}
          {(elapsedTime * 100).toLocaleString(undefined, {
            maximumFractionDigits: 1,
          })}
          %
        </span>
        <span className={textColor}>
          {emoji} Completion:{" "}
          {(completionRate * 100).toLocaleString(undefined, {
            maximumFractionDigits: 1,
          })}
          %
        </span>
      </div>
      <div className="relative h-3 w-full rounded-md bg-gray-300">
        <div
          className={`absolute top-0 left-0 h-3 bg-gray-500 ${
            elapsedTime === 1 ? "rounded-full" : "rounded-l-full"
          }`}
          style={{ width: `${elapsedTime * 100}%` }}
        ></div>
        <div
          className={`absolute top-1/2 left-0 h-4 -translate-y-1/2 rounded-full bg-green-500 ${backgroundColor}`}
          style={{ width: `${completionRate * elapsedTime * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

const ChallengeCard = ({
  challenge,
  setEditChallenge,
  setIsEditChallengeDialogOpen,
}: {
  challenge: Challenge & { dailyProgress: DailyProgress[] };
  setEditChallenge: React.Dispatch<React.SetStateAction<Challenge | undefined>>;
  setIsEditChallengeDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { setQueryParam } = useUrlState();

  const elapsedTime = calculateElapsedTime(challenge);
  const completionRate = calculateCompletionRate(challenge);
  const shadowColor =
    completionRate >= EXCELLENT_PROGRESS_THRESHOLD
      ? "hover:shadow-green-500/20"
      : completionRate >= GOOD_PROGRESS_THRESHOLD
        ? "hover:shadow-orange-500/20"
        : "hover:shadow-red-500/20";

  const handleViewClick = (challengeId: string) => {
    setQueryParam("challenge", challengeId);
  };

  const handleEditClick = (challenge: Challenge) => {
    setEditChallenge(challenge);
    setIsEditChallengeDialogOpen(true);
  };

  return (
    <Card
      key={challenge.id}
      className={`cursor-pointer transition-shadow duration-200 hover:shadow-lg ${shadowColor}`}
      onClick={() => handleViewClick(challenge.id)}
    >
      <CardHeader>
        <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-2xl">
          {challenge.icon}
        </div>
        <CardTitle className="text-lg font-semibold">
          {challenge.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-7 space-y-2">
          <p className="text-foreground text-base">
            <span className="font-semibold">Wish:</span> {challenge.wish}
          </p>
          <p className="text-base">
            <span className="font-semibold text-black">Daily Action:</span>{" "}
            {challenge.dailyAction}
          </p>
        </div>
        <div className="text-muted-foreground mt-2 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{new Date(challenge.startDate).toLocaleDateString()}</span>
            <span>{new Date(challenge.endDate).toLocaleDateString()}</span>
          </div>
          <ProgressBar
            elapsedTime={elapsedTime}
            completionRate={completionRate}
          />
        </div>
      </CardContent>
      <CardFooter className="mt-4 gap-2">
        <Button variant="outline" className="w-full">
          View Challenge
        </Button>
        <Button
          variant="outline"
          size={"icon"}
          className="aspect-square"
          onClick={(e) => {
            e.stopPropagation();
            handleEditClick(challenge);
          }}
        >
          <Pencil />
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ChallengeGrid = () => {
  const { data: challenges, isLoading: isChallengesLoading } =
    trpc.challenge.getChallengesWithDailyProgress.useQuery();
  const { getQueryParam, updateQueryParam } = useUrlState();

  const [isMounted, setIsMounted] = useState(false);
  const [isEditChallengeDialogOpen, setIsEditChallengeDialogOpen] =
    useState(false);
  const [editChallenge, setEditChallenge] = useState<Challenge | undefined>(
    undefined,
  );
  const [isPwaDialogOpen, setIsPwaDialogOpen] = useState(false);
  const { isPwa, isClient } = usePwa();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (
      !isChallengesLoading &&
      (!challenges || !challenges.length) &&
      getQueryParam("challenge") !== "new"
    ) {
      updateQueryParam("challenge", "new");
    }
  }, [isChallengesLoading, challenges, updateQueryParam, getQueryParam]);

  if (challenges?.length === 0 || isChallengesLoading) {
    return <LoadingSpinner />;
  }

  const handleCreateChallengeClick = () => {
    updateQueryParam("challenge", "new");
  };

  return (
    <>
      <section className="flex w-11/12 flex-col gap-6 md:w-2/3">
        <div className="flex items-center justify-between">
          <h1
            className="text-3xl font-bold"
            onClick={() => {
              toast({
                title: "Welcome back!",
                description:
                  "You can now start your journey towards a healthier life.",
              });
            }}
          >
            Welcome back!
          </h1>
          {isClient && isMobile && !isPwa && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setIsPwaDialogOpen(true)}
            >
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Install App</span>
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          <Leaderboard />
          <Card
            className="flex cursor-pointer flex-col justify-center transition-shadow duration-200 hover:shadow-lg"
            onClick={handleCreateChallengeClick}
          >
            <CardHeader className="flex flex-row items-center justify-start gap-3 space-y-0 md:flex-col md:items-start md:justify-center">
              <div className="bg-primary/10 mb-0 flex h-12 w-12 items-center justify-center rounded-lg text-2xl md:mb-4">
                <PlusCircle />
              </div>
              <CardTitle className="mt-0 text-lg font-semibold">
                Create New Challenge
              </CardTitle>
              <CardDescription className="text-foreground hidden text-base md:block">
                Start a new personalized challenge.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm md:block md:text-base">
                Define your goals and track your progress.
              </p>
            </CardContent>
            <CardFooter className="md:mt-4">
              <Button variant="outline" className="w-full">
                Get Started
              </Button>
            </CardFooter>
          </Card>

          {challenges?.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              setEditChallenge={setEditChallenge}
              setIsEditChallengeDialogOpen={setIsEditChallengeDialogOpen}
            />
          ))}
        </div>
      </section>
      <>
        {editChallenge ? (
          <EditChallengeDialog
            challenge={editChallenge}
            isEditChallengeDialogOpen={isEditChallengeDialogOpen}
            setIsEditChallengeDialogOpen={setIsEditChallengeDialogOpen}
          />
        ) : null}
      </>
      <PwaInstallDialog
        open={isPwaDialogOpen}
        onOpenChange={setIsPwaDialogOpen}
      />
    </>
  );
};
