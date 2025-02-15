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
import ExpandableText from "@/components/ui/expandable-text";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ChallengeIdeaResult } from "@/lib/db/challengeIdeas";
import { trpc } from "@/lib/util/trpc";
import { Loader2, Pencil } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMediaQuery } from "react-responsive";

const ChallengeIdea = ({
  challengeIdea,
  activeChallengeId,
  onJoinChallenge,
  onApplyChallenge,
}: {
  challengeIdea: ChallengeIdeaResult;
  activeChallengeId: number | null;
  onJoinChallenge: (challengeIdea: ChallengeIdeaResult) => void;
  onApplyChallenge: (challengeIdea: ChallengeIdeaResult) => void;
}) => {
  const isActive = activeChallengeId === challengeIdea.id;
  const disabled = activeChallengeId !== null;

  return (
    <Card
      key={challengeIdea.id}
      className="transition-shadow duration-300 hover:shadow-xl"
    >
      <CardHeader>
        <CardTitle className="text-xl text-gray-800">
          {challengeIdea.title}
        </CardTitle>
        <CardDescription>
          <ExpandableText text={challengeIdea.description} />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Wish: </span>
          {challengeIdea.wish}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Daily Action: </span>
          {challengeIdea.dailyAction}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Source: </span>
          <a
            href={challengeIdea.sourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {challengeIdea.sourceName}
          </a>
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={() => onJoinChallenge(challengeIdea)}
          disabled={disabled}
        >
          {isActive ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Join Challenge"
          )}
        </Button>
        <Button
          variant={"outline"}
          size={"icon"}
          onClick={() => onApplyChallenge(challengeIdea)}
          disabled={disabled}
        >
          <Pencil />
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ChallengeSearchCard = ({
  leftCardHeight,
  setDefaultValues,
}: {
  leftCardHeight: number;
  setDefaultValues: React.Dispatch<React.SetStateAction<any>>;
}) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChallengeIdeaResult[]>([]);
  const [activeChallengeId, setActiveChallengeId] = useState<number | null>(
    null,
  );

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const utils = trpc.useUtils();

  const { mutate: createChallenge } =
    trpc.challenge.createChallenge.useMutation({
      onSuccess: async (challenge) => {
        await utils.challenge.getChallenges.invalidate();
        const params = new URLSearchParams(searchParams);
        params.set("challenge", challenge.id);
        replace(`${pathname}?${params.toString()}`);
        setActiveChallengeId(null);
      },
      onError: () => {
        setActiveChallengeId(null);
      },
    });

  const {
    mutateAsync: searchChallenges,
    isPending: isSearchChallengesPending,
  } = trpc.challengeIdea.search.useMutation();

  const handleJoinChallenge = (challengeIdea: ChallengeIdeaResult) => {
    if (activeChallengeId !== null) return;
    setActiveChallengeId(challengeIdea.id);
    createChallenge({
      title: challengeIdea.title,
      wish: challengeIdea.wish,
      dailyAction: challengeIdea.dailyAction,
      icon: "✅",
    });
  };

  const handleApplyChallenge = (challengeIdea: ChallengeIdeaResult) => {
    if (activeChallengeId !== null) return;
    setDefaultValues({
      title: challengeIdea.title,
      wish: challengeIdea.wish,
      dailyAction: challengeIdea.dailyAction,
      icon: "✅",
    });
    toast({
      title: "Success!",
      description: `Information from ${challengeIdea.title} has been applied to the form`,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query) {
      setResults([]);
      return;
    }
    const response = await searchChallenges(query);
    setResults(response);
  };

  return (
    <Card
      className="flex w-full flex-col md:w-1/3"
      style={{
        height:
          isMobile && !(results.length || isSearchChallengesPending)
            ? "auto"
            : leftCardHeight,
      }}
    >
      <CardContent className="flex h-full flex-col items-center justify-center p-0 pt-6">
        {!results.length && !isSearchChallengesPending && (
          <CardHeader className="w-full pb-3 text-left">
            <CardTitle>Find Challenges</CardTitle>
            <CardDescription>
              Looking for inspiration? Find challenge ideas to kickstart your
              journey to a healthier lifestyle.
            </CardDescription>
          </CardHeader>
        )}

        <form onSubmit={handleSubmit} className="mb-6 flex w-full gap-2 px-6">
          <Input
            placeholder="Search challenges..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>

        {(results.length || isSearchChallengesPending) && (
          <ScrollArea className="flex h-full w-full flex-col items-center justify-center px-6">
            {!isSearchChallengesPending ? (
              <div className="mb-6 grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
                {results.map((result) => (
                  <ChallengeIdea
                    key={result.id}
                    challengeIdea={result}
                    activeChallengeId={activeChallengeId}
                    onJoinChallenge={handleJoinChallenge}
                    onApplyChallenge={handleApplyChallenge}
                  />
                ))}
              </div>
            ) : (
              <div className="mb-6 grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
                {Array.from({ length: 10 }).map((_, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden transition-shadow duration-300 hover:shadow-xl"
                  >
                    <CardHeader>
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="mt-2 h-4 w-full" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-8 w-32" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
