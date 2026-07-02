"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageStudio } from "@/components/vendor/PackageStudio";
import { addNewListing } from "@/lib/mock-data";
import { Listing, ListingType } from "@/lib/types";

function NewListingStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind = searchParams.get("kind");
  const initialType: ListingType = kind === "event" ? "Event" : "Turf";

  function handleSave(listing: Listing) {
    addNewListing(listing);
    router.push(`/vendor/listings/${listing.id}`);
  }

  return (
    <PackageStudio
      mode="create"
      initialType={initialType}
      onClose={() => router.push("/vendor/listings")}
      onSave={handleSave}
    />
  );
}

export default function NewListingPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-50 bg-cream-200" />}>
      <NewListingStudio />
    </Suspense>
  );
}
