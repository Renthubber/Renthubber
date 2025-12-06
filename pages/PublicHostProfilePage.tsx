import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicHostProfile } from "../views/PublicHostProfile";
import { supabase } from "../lib/supabase";
import { User, Listing } from "../types";

export const PublicHostProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [host, setHost] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;

      setLoading(true);

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      const { data: listingsData } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", userId);

      setHost(userData as User | null);
      setListings((listingsData || []) as Listing[]);
      setLoading(false);
    };

    loadData();
  }, [userId]);

  if (loading) return <div className="p-4">Caricamento profilo...</div>;
  if (!host) return <div className="p-4">Host non trovato.</div>;

  return (
    <PublicHostProfile
      host={host}
      listings={listings}
      onBack={() => navigate(-1)}
      onListingClick={(listing) => navigate(`/listing/${listing.id}`)}
    />
  );
};
