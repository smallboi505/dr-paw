"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserProfileButton from "@/components/layout/user-profile-button";
import ClinicSwitcher from "@/components/layout/clinic-switcher";
import { Input } from "@/components/ui/input";
import { Bell, Search, PawPrint, User, Menu, X, Calendar } from "lucide-react";
import { useMobileMenu } from "@/lib/mobile-menu-context";

interface SearchResult {
  pets: Array<{
    id: string;
    idNumber: string;
    name: string;
    species: string;
    breed: string | null;
    owner: {
      name: string;
      phone: string;
    };
  }>;
  owners: Array<{
    id: string;
    idNumber: string;
    name: string;
    phone: string;
    address: string | null;
    petCount: number;
  }>;
}

interface SearchFilters {
  species: string[];
  dateRange: string;
}

export default function Header() {
  const router = useRouter();
  const { toggleMenu } = useMobileMenu();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult>({ pets: [], owners: [] });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({
    species: [],
    dateRange: "",
  });
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications");
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };
    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim().length > 0) {
        performSearch();
      } else {
        setResults({ pets: [], owners: [] });
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, filters]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ query: search });
      
      // Add species filters
      if (filters.species.length > 0) {
        params.append("species", filters.species.join(","));
      }
      
      // Add date range filter
      if (filters.dateRange) {
        params.append("dateRange", filters.dateRange);
      }

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (type: "pet" | "owner", id: string) => {
    if (type === "pet") {
      router.push(`/pets/${id}`);
    } else {
      router.push(`/owners/${id}`);
    }
    setShowResults(false);
    setSearch("");
    clearFilters();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.pets.length > 0) {
      handleResultClick("pet", results.pets[0].id);
    }
  };

  const toggleSpeciesFilter = (species: string) => {
    setFilters(prev => ({
      ...prev,
      species: prev.species.includes(species)
        ? prev.species.filter(s => s !== species)
        : [...prev.species, species],
    }));
  };

  const setDateRangeFilter = (range: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: prev.dateRange === range ? "" : range,
    }));
  };

  const clearFilters = () => {
    setFilters({ species: [], dateRange: "" });
  };

  const hasActiveFilters = filters.species.length > 0 || filters.dateRange !== "";
  const totalResults = results.pets.length + results.owners.length;

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 bg-white border-b border-slate-200 z-10">
      <div className="h-16 flex items-center px-4 lg:px-6">
        {/* HAMBURGER MENU BUTTON - Only visible on mobile */}
        <button
          onClick={toggleMenu}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg mr-3 flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-slate-600" />
        </button>

        {/* Paw Icon */}
        <PawPrint className="h-6 w-6 text-purple-500 flex-shrink-0" />

        {/* Search Bar with Dropdown */}
        <div className="ml-4 lg:ml-6 w-full max-w-2xl relative" ref={searchRef}>
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
          <Input
            placeholder="Search pets, owners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (totalResults > 0) setShowResults(true);
            }}
            className="pl-10 bg-slate-50 text-slate-900 placeholder:text-slate-500"
          />

          {/* Filter Chips - Shows below search when typing */}
          {(search.length > 0 || hasActiveFilters) && (
            <div className="absolute top-full left-0 right-0 bg-white border-x border-slate-200 px-3 py-2 flex items-center gap-2 flex-wrap z-50">
              {/* Species Filters */}
              <button
                onClick={() => toggleSpeciesFilter("Dog")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.species.includes("Dog")
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🐕 Dogs
              </button>
              <button
                onClick={() => toggleSpeciesFilter("Cat")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.species.includes("Cat")
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🐱 Cats
              </button>
              <button
                onClick={() => toggleSpeciesFilter("Bird")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.species.includes("Bird")
                    ? "bg-green-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🦜 Birds
              </button>

              <div className="h-4 w-px bg-slate-300 mx-1" />

              {/* Date Range Filters */}
              <button
                onClick={() => setDateRangeFilter("week")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.dateRange === "week"
                    ? "bg-purple-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Calendar className="h-3 w-3 inline mr-1" />
                This Week
              </button>
              <button
                onClick={() => setDateRangeFilter("month")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.dateRange === "month"
                    ? "bg-purple-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Calendar className="h-3 w-3 inline mr-1" />
                This Month
              </button>

              {/* Clear All */}
              {hasActiveFilters && (
                <>
                  <div className="h-4 w-px bg-slate-300 mx-1" />
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    <X className="h-3 w-3 inline mr-1" />
                    Clear All
                  </button>
                </>
              )}
            </div>
          )}

          {/* Search Results Dropdown */}
          {showResults && totalResults > 0 && (
            <div className={`absolute left-0 right-0 bg-white border border-slate-200 rounded-b-lg shadow-xl max-h-96 overflow-y-auto z-50 ${
              (search.length > 0 || hasActiveFilters) ? "top-[calc(100%+48px)]" : "top-full mt-2"
            }`}>
              {/* Pets Section */}
              {results.pets.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Pets ({results.pets.length})
                  </p>
                  {results.pets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => handleResultClick("pet", pet.id)}
                      className="w-full p-3 rounded-lg hover:bg-slate-50 transition-colors text-left flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {pet.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{pet.name}</p>
                        <p className="text-sm text-slate-600 truncate">
                          {pet.species}
                          {pet.breed && `, ${pet.breed}`} • {pet.idNumber}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          Owner: {pet.owner.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Owners Section */}
              {results.owners.length > 0 && (
                <div className="p-2 border-t border-slate-100">
                  <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Owners ({results.owners.length})
                  </p>
                  {results.owners.map((owner) => (
                    <button
                      key={owner.id}
                      onClick={() => handleResultClick("owner", owner.id)}
                      className="w-full p-3 rounded-lg hover:bg-slate-50 transition-colors text-left flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{owner.name}</p>
                        <p className="text-sm text-slate-600 truncate">
                          {owner.phone} • {owner.idNumber}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {owner.petCount} {owner.petCount === 1 ? "pet" : "pets"}
                          {owner.address && ` • ${owner.address}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {showResults && search.trim().length > 0 && totalResults === 0 && !loading && (
            <div className={`absolute left-0 right-0 bg-white border border-slate-200 rounded-b-lg shadow-xl p-8 text-center z-50 ${
              hasActiveFilters ? "top-[calc(100%+48px)]" : "top-full mt-2"
            }`}>
              <p className="text-slate-500">No results found for "{search}"</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm text-purple-600 hover:underline"
                >
                  Clear filters and try again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Spacer to push right items to the end */}
        <div className="flex-1" />

        {/* Right Side */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Notification Bell */}
          <Link href="/notifications">
            <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </Link>

          {/* Clinic Switcher - Hidden on very small screens */}
          <div className="hidden sm:block">
            <ClinicSwitcher />
          </div>

          {/* User Profile with Clinic Name */}
          <UserProfileButton />
        </div>
      </div>
    </header>
  );
}