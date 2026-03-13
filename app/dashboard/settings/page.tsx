"use client";

import { useUser } from "@clerk/nextjs";
import {
  CircleNotch,
  Envelope,
  Calendar,
  IdentificationCard,
} from "@phosphor-icons/react";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <CircleNotch size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  const details = [
    {
      icon: IdentificationCard,
      label: "Full name",
      value:
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "\u2014",
    },
    {
      icon: Envelope,
      label: "Email",
      value: user?.primaryEmailAddress?.emailAddress || "\u2014",
    },
    {
      icon: Calendar,
      label: "Joined",
      value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "\u2014",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Settings
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Your account details.
      </p>

      {/* Profile card */}
      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Avatar + name header */}
        <div className="flex items-center gap-4 border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.firstName || "Profile"}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-lg font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {user?.firstName?.[0] || "?"}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>

        {/* Detail rows */}
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {details.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-4 px-6 py-4"
              >
                <Icon
                  size={18}
                  className="shrink-0 text-zinc-400 dark:text-zinc-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-zinc-900 dark:text-zinc-100">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User ID section */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            User ID
          </p>
          <p className="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {user?.id}
          </p>
        </div>
      </div>
    </div>
  );
}
