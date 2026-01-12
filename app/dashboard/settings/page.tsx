"use client";

import React, { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { type Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
});

type UsernameFormData = z.infer<typeof usernameSchema>;

type UserData = {
  _id: Id<"users">;
  _creationTime: number;
  name: string;
  email: string;
  tokenIdentifier: string;
  imageUrl?: string;
  username?: string;
  createdAt: number;
  lastActiveAt: number;
};

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Data fetching
  const { data: currentUser, isLoading } = useConvexQuery<UserData>(
    api.users.getCurrentUser
  );
  const updateUsername = useConvexMutation<Id<"users">>(
    api.users.updateUsername
  );

  // Form setup
  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  // Update form when user data loads
  useEffect(() => {
    if (currentUser) {
      reset({
        username: currentUser.username || "",
      });
    }
  }, [currentUser, reset]);

  // Form submission handler
  const onSubmit: SubmitHandler<UsernameFormData> = async (data) => {
    setIsSubmitting(true);

    try {
      await updateUsername.mutate({
        username: data.username,
      });

      toast.success("Username updated successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update username";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
          <p className="text-slate-400 mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text-primary">Settings</h1>
        <p className="text-slate-400 mt-2">
          Manage your profile and account preferences
        </p>
      </div>

      {/* Username Settings */}
      <Card className="card-glass max-w-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="h-5 w-5 mr-2" />
            Username Settings
          </CardTitle>
          <CardDescription>
            Set your unique username for your public profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                Username
              </Label>
              <Input
                id="username"
                {...register("username")}
                placeholder="Enter your username"
                className="bg-slate-800 border-slate-600 text-white"
              />

              {/* Current Username */}
              {currentUser?.username && (
                <div className="text-sm text-slate-400">
                  Current username:{" "}
                  <span className="text-white">@{currentUser.username}</span>
                </div>
              )}

              {/* Username Help */}
              <div className="text-xs text-slate-500">
                3-20 characters, letters, numbers, underscores, and hyphens only
              </div>

              {errors.username && (
                <p className="text-red-400 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Username"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}