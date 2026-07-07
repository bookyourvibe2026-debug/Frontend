"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageStudio } from "@/components/vendor/PackageStudio";
import { HostEventForm } from "@/components/vendor/HostEventForm";
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

  async function handleSave(listing: MockListing) {
    try {
      const created = await createVendorListing(mockListingToApiInput(listing));
      router.push(`/vendor/listings/${created._id}`);
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to create listing");
    }
  }

  function handleEventSaved(listing: Listing) {
    router.push(`/vendor/listings/${listing._id}`);
  }

  if (kind === "event") {
    return <HostEventForm onClose={() => router.push("/vendor/listings")} onSaved={handleEventSaved} />;
  }

  return (
    <>
      <PackageStudio
        mode="create"
        initialType={initialType}
        onClose={() => router.push("/vendor/listings")}
        onSave={handleSave}
      />
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
