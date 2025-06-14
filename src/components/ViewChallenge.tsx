import Calendar from "@/components/Calendar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ViewChallengeHeader } from "@/components/ViewChallengeHeader";
import { SwipeDirection, useEdgeSwipe } from "@/hooks/use-edge-swipe";
import { useUrlState } from "@/hooks/use-url-state";
import { trpc } from "@/lib/util/trpc";
import { useEffect, useState } from "react";
import { BackButton } from "./BackButton";

const handleSwipe = (
  direction: SwipeDirection,
  challenges: any[] | undefined,
  currentChallengeId: string | null,
  updateQueryParam: (key: string, value: string) => void,
  utils: ReturnType<typeof trpc.useUtils>,
) => {
  if (!challenges || !currentChallengeId) return;

  const currentIndex = challenges.findIndex((c) => c.id === currentChallengeId);
  if (currentIndex === -1) return;

  let nextIndex: number;
  if (direction === SwipeDirection.LEFT) {
    // Move to next challenge (or wrap around to first)
    nextIndex = (currentIndex + 1) % challenges.length;
  } else {
    // Move to previous challenge (or wrap around to last)
    nextIndex = (currentIndex - 1 + challenges.length) % challenges.length;
  }

  const nextChallenge = challenges[nextIndex];

  updateQueryParam("challenge", nextChallenge.id);
};

export const ViewChallenge = () => {
  const { getQueryParam, removeQueryParam, updateQueryParam } = useUrlState();
  const utils = trpc.useUtils();
  const [isNavigating, setIsNavigating] = useState(false);

  const {
    data: challenges,
    isLoading: isChallengesLoading,
    isFetching: isChallengesFetching,
  } = trpc.challenge.getChallengesWithDailyProgress.useQuery();

  const { containerRef, bind, style } = useEdgeSwipe({
    onSwipe: (direction) => {
      setIsNavigating(true);
      handleSwipe(
        direction,
        challenges,
        getQueryParam("challenge"),
        updateQueryParam,
        utils,
      );
      setIsNavigating(false);
    },
  });

  const challengeId = getQueryParam("challenge");

  const challenge = challenges?.find((c) => c.id === challengeId);

  const isLoading = isChallengesLoading || isChallengesFetching;

  useEffect(() => {
    if (
      !isLoading &&
      !challenge &&
      challengeId &&
      !isChallengesLoading &&
      !isChallengesFetching
    ) {
      removeQueryParam("challenge");
    }
  }, [
    isLoading,
    challenge,
    challengeId,
    removeQueryParam,
    isChallengesLoading,
    isChallengesFetching,
  ]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!challenge) {
    return <div>Something went wrong.</div>;
  }

  return (
    <div
      ref={containerRef}
      {...bind()}
      style={style}
      className={`m-2 w-full rounded-lg p-2 shadow-lg transition-opacity duration-300 sm:p-4 md:mx-auto md:w-5/6 md:p-5 lg:w-2/3 lg:p-6 xl:w-1/2 2xl:w-[45%] ${
        isNavigating ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="mb-6 flex items-start justify-between">
        <BackButton />
      </div>
      <ViewChallengeHeader />
      <div className="mt-6 rounded-lg p-1 ring-1 ring-neutral-100 sm:p-4 lg:p-8">
        <Calendar challenge={challenge} />
      </div>
    </div>
  );
};
