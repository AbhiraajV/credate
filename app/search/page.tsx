"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSearch } from "@/app/actions/search.action";
import { Search, User, Instagram, Facebook, Mail, Phone, Clock, Star, Eye } from "lucide-react";

const searchSchema = z.object({
  name: z.string().max(100).optional(),
  instagramId: z.string().max(100).optional(),
  facebookId: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().max(20).optional(),
}).refine(
  (data) => !!(data.name || data.instagramId || data.facebookId || data.email || data.phoneNumber),
  {
    message: "At least one identifier is required",
    path: ["name"],
  }
);

type SearchFormData = z.infer<typeof searchSchema>;

interface SearchResult {
  id: string;
  searchId: string;
  reportId: string;
  matchedOn: string;
  report: {
    id: string;
    name?: string;
    instagramId?: string;
    facebookId?: string;
    email?: string;
    phoneNumber?: string;
    rating: number;
    description?: string;
    createdAt: string;
  };
}

interface PreviousSearch {
  id: string;
  name?: string;
  instagramId?: string;
  facebookId?: string;
  email?: string;
  phoneNumber?: string;
  createdAt: string;
  searchResults: SearchResult[];
}

export default function SearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentResults, setCurrentResults] = useState<SearchResult[]>([]);
  const [previousSearches, setPreviousSearches] = useState<PreviousSearch[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  });

  // Mock previous searches - in real app, fetch from API
  useEffect(() => {
    const mockPreviousSearches: PreviousSearch[] = [
      {
        id: "search-1",
        name: "John Doe",
        instagramId: "@johndoe",
        createdAt: "2024-01-15T10:30:00Z",
        searchResults: [
          {
            id: "result-1",
            searchId: "search-1",
            reportId: "report-1",
            matchedOn: "name",
            report: {
              id: "report-1",
              name: "John Doe",
              instagramId: "@johndoe",
              rating: 8,
              description: "Great person to work with, very professional.",
              createdAt: "2024-01-10T15:20:00Z",
            }
          }
        ]
      },
      {
        id: "search-2",
        email: "jane@example.com",
        createdAt: "2024-01-14T14:15:00Z",
        searchResults: []
      }
    ];
    setPreviousSearches(mockPreviousSearches);
  }, []);

  const onSubmit = async (data: SearchFormData) => {
    setIsSearching(true);
    setSearchMessage(null);
    setCurrentResults([]);

    try {
      // Mock user ID - in real app, get from auth
      const userId = "mock-user-id";
      const result = await createSearch(userId, data);

      if (result.success) {
        setSearchMessage({ 
          type: 'success', 
          text: `Search completed! Found ${result.searchResults?.length || 0} results.` 
        });
        setCurrentResults(result.searchResults || []);
        
        // Add to previous searches (mock)
        const newSearch: PreviousSearch = {
          id: result.search.id,
          ...data,
          createdAt: new Date().toISOString(),
          searchResults: result.searchResults || []
        };
        setPreviousSearches(prev => [newSearch, ...prev]);
        
        reset();
      } else {
        setSearchMessage({ type: 'error', text: result.error || 'Search failed' });
      }
    } catch (error) {
      setSearchMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSearchIdentifiers = (search: PreviousSearch) => {
    const identifiers = [];
    if (search.name) identifiers.push(`Name: ${search.name}`);
    if (search.instagramId) identifiers.push(`IG: ${search.instagramId}`);
    if (search.facebookId) identifiers.push(`FB: ${search.facebookId}`);
    if (search.email) identifiers.push(`Email: ${search.email}`);
    if (search.phoneNumber) identifiers.push(`Phone: ${search.phoneNumber}`);
    return identifiers.join(" • ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            Search Reports
          </h1>
          <p className="text-slate-600">
            Find reports about people and see your search history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search Form */}
          <div>
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  New Search
                </CardTitle>
                <CardDescription>
                  Enter at least one identifier to search for reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Search Criteria
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="search-name" className="text-sm font-medium">Name</Label>
                        <Input
                          id="search-name"
                          placeholder="Full name"
                          {...register("name")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="search-email" className="text-sm font-medium flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Email
                        </Label>
                        <Input
                          id="search-email"
                          type="email"
                          placeholder="email@example.com"
                          {...register("email")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="search-instagram" className="text-sm font-medium flex items-center gap-1">
                          <Instagram className="w-3 h-3" />
                          Instagram
                        </Label>
                        <Input
                          id="search-instagram"
                          placeholder="@username"
                          {...register("instagramId")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="search-facebook" className="text-sm font-medium flex items-center gap-1">
                          <Facebook className="w-3 h-3" />
                          Facebook
                        </Label>
                        <Input
                          id="search-facebook"
                          placeholder="Profile name or ID"
                          {...register("facebookId")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="search-phone" className="text-sm font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Phone Number
                        </Label>
                        <Input
                          id="search-phone"
                          placeholder="+1 (555) 123-4567"
                          {...register("phoneNumber")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>

                    {errors.name && (
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {searchMessage && (
                    <div className={`p-3 rounded-md text-sm ${
                      searchMessage.type === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {searchMessage.text}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSearching}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {isSearching ? "Searching..." : "Search Reports"}
                  </Button>
                </form>

                {/* Current Search Results */}
                {currentResults.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-sm font-medium text-slate-900">Search Results</h4>
                    {currentResults.map((result) => (
                      <div key={result.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {result.report.name || "Anonymous"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="text-sm text-slate-600">
                                {result.report.rating}/10
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                Matched on {result.matchedOn}
                              </Badge>
                            </div>
                            {result.report.description && (
                              <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                                {result.report.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Previous Searches */}
          <div>
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Previous Searches
                </CardTitle>
                <CardDescription>
                  Your recent search history and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {previousSearches.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No previous searches yet</p>
                    </div>
                  ) : (
                    previousSearches.map((search) => (
                      <div key={search.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 line-clamp-1">
                              {getSearchIdentifiers(search)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDate(search.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={search.searchResults.length > 0 ? "default" : "secondary"}>
                              {search.searchResults.length} results
                            </Badge>
                          </div>
                        </div>
                        
                        {search.searchResults.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {search.searchResults.slice(0, 2).map((result) => (
                              <div key={result.id} className="p-2 bg-white rounded border border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-slate-800">
                                    {result.report.name || "Anonymous"}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500" />
                                    <span className="text-xs text-slate-600">
                                      {result.report.rating}/10
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {search.searchResults.length > 2 && (
                              <p className="text-xs text-slate-500 text-center">
                                +{search.searchResults.length - 2} more results
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}