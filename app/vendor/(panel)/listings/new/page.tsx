"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageStudio } from "@/components/vendor/PackageStudio";
import { EventStudio } from "@/components/vendor/EventStudio";
import { AddAcademyPrompt } from "@/components/vendor/AddAcademyPrompt";
import { Listing as MockListing, ListingType } from "@/lib/types";
import { Listing } from "@/lib/api/types";
import { createVendorListing } from "@/lib/api/vendor";
import { mockListingToApiInput } from "@/lib/api/listingAdapter";
import { ApiError } from "@/lib/api/client";
import { Toast } from "@/components/admin/Toast";

function NewListingStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind = searchParams.get("kind");
  const initialType: ListingType = kind === "event" ? "Event" : "Turf";
  const [toast, setToast] = useState<string | null>(null);
  // Once a Turf is created, offer to add a linked academy before leaving the flow.
  const [academyPromptFor, setAcademyPromptFor] = useState<Listing | null>(null);

  async function handleSave(listing: MockListing) {
    try {
      const created = await createVendorListing(mockListingToApiInput(listing));
      if (created.type === "Turf") {
        setAcademyPromptFor(created);
      } else {
        router.push(`/vendor/listings/${created._id}`);
      }
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to create listing");
    }
  }

  if (kind === "event") {
    return (
      <EventStudio
        mode="create"
        onClose={() => router.push("/vendor/listings")}
        onSave={handleSave}
      />
    );
  }

  return (
    <>
      <PackageStudio
        mode="create"
        initialType={initialType}
        onClose={() => router.push("/vendor/listings")}
        onSave={handleSave}
      />
      {academyPromptFor && (
        <AddAcademyPrompt
          turfListingId={academyPromptFor._id}
          turfTitle={academyPromptFor.title}
          onDone={(added) => {
            const dest = `/vendor/listings/${academyPromptFor._id}`;
            // Adding an academy grants the vendor's session a new "coaches" vertical
            // server-side — a full navigation (not router.push) is what makes the
            // panel layout re-fetch that session so "Coaches" actually shows up in
            // the sidebar/bottom nav without requiring a manual logout/login.
            if (added) window.location.href = dest;
            else router.push(dest);
          }}
        />
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

export default function NewListingPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-50 bg-cream-200" />}>
      <NewListingStudio />
    </Suspense>
  );
}
