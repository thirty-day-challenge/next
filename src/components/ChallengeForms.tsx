"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/util/trpc";
import { Challenge } from "@prisma/client";
import { MoreVertical, Trash } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BackButton } from "./BackButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

type ChallengeFormProps = {
  defaultValues?: z.infer<typeof challengeFormSchema>;
  onSubmit: (values: z.infer<typeof challengeFormSchema>) => void;
  onDelete?: () => void;
  disabled?: boolean;
};

export const challengeFormSchema = z.object({
  title: z.string().nonempty({
    message: "Title is required.",
  }),
  wish: z.string().nonempty({
    message: "Wish is required.",
  }),
  dailyAction: z.string().nonempty({
    message: "Daily action is required.",
  }),
  icon: z
    .string()
    .nonempty({ message: "Icon is required." })
    .refine(
      (value) => {
        const singleEmojiRegex =
          /^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})?)$/u;
        return singleEmojiRegex.test(value);
      },
      { message: "Icon must be a single emoji." },
    ),
});

function ChallengeForm({
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  isDeleting = false, // Make isDeleting optional with a default value
}: {
  defaultValues?: {
    title: string;
    wish: string;
    dailyAction: string;
    icon: string;
  };
  onSubmit: (values: z.infer<typeof challengeFormSchema>) => void;
  onDelete?: () => void; // Make onDelete optional
  disabled: boolean;
  isDeleting?: boolean; // Make isDeleting optional
}) {
  const form = useForm<z.infer<typeof challengeFormSchema>>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues: defaultValues || {
      title: "",
      wish: "",
      dailyAction: "",
      icon: "✅",
    },
  });

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-2"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Hydration Challenge" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="wish"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wish</FormLabel>
              <FormControl>
                <Input placeholder="Drinking more water every day" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dailyAction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Daily Action</FormLabel>
              <FormControl>
                <Input
                  placeholder="I will drink 8 glasses of water every day"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="mt-4 flex justify-between">
          <Button type="submit" disabled={disabled}>
            Submit
          </Button>
          {/* Conditionally render the delete button if onDelete is provided */}
          {onDelete && (
            <Popover
              open={isPopoverOpen} // Control the popover's open state
              onOpenChange={(open) => {
                if (!isDeleting) {
                  setIsPopoverOpen(open); // Only allow closing if not deleting
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" disabled={disabled}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                {isConfirmingDelete ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-600">Are you sure?</p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={onDelete}
                        disabled={isDeleting}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setIsConfirmingDelete(false)}
                        disabled={isDeleting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:bg-red-50"
                    onClick={() => setIsConfirmingDelete(true)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </form>
    </Form>
  );
}

export function CreateChallenge() {
  const utils = trpc.useUtils();

  const { data: challenges, isLoading } =
    trpc.challenge.getChallenges.useQuery();

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const { mutate, isPending } = trpc.challenge.createChallenge.useMutation({
    onSuccess: async (challenge) => {
      await utils.challenge.getChallenges.invalidate();
      const params = new URLSearchParams(searchParams);
      params.set("challenge", challenge.id);
      replace(`${pathname}?${params.toString()}`);
    },
  });

  const onSubmit = async (values: z.infer<typeof challengeFormSchema>) => {
    mutate(values);
  };

  return (
    <Card className="w-full md:w-3/4 lg:w-1/2 xl:w-1/3">
      <CardHeader>
        {challenges?.length ? (
          <div className="mb-6">
            <BackButton />
          </div>
        ) : null}
        <CardTitle className="text-xl font-bold">Create Challenge</CardTitle>
        <CardDescription>Set up your new challenge details.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChallengeForm onSubmit={onSubmit} disabled={isPending} />
      </CardContent>
    </Card>
  );
}

export function EditChallenge({
  challenge,
  setIsDialogOpen,
}: {
  challenge: Challenge;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const utils = trpc.useUtils();

  const { mutate: updateChallenge, isPending: isUpdatePending } =
    trpc.challenge.updateChallenge.useMutation({
      onSettled: async () => {
        await utils.challenge.getChallenges.invalidate();
        setIsDialogOpen(false);
      },
    });
  const { mutate: deleteChallenge, isPending: isDeletePending } =
    trpc.challenge.deleteChallenge.useMutation({
      onSettled: async () => {
        await utils.challenge.getChallenges.invalidate();
        setIsDialogOpen(false);

        const params = new URLSearchParams(searchParams);
        params.delete("challenge");
        replace(`${pathname}?${params.toString()}`);
      },
    });

  const handleSubmit = async (values: z.infer<typeof challengeFormSchema>) => {
    updateChallenge({
      ...challenge,
      ...values,
    });
  };

  const handleDelete = () => {
    deleteChallenge(challenge.id);
  };

  const defaultValues = {
    title: challenge.title,
    wish: challenge.wish,
    dailyAction: challenge.dailyAction,
    icon: challenge.icon,
  };

  return (
    <ChallengeForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      disabled={isUpdatePending || isDeletePending}
      isDeleting={isDeletePending}
    />
  );
}
