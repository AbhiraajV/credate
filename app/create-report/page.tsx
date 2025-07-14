"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createReport } from "@/app/actions/report.action";
import { Star, User, Instagram, Facebook, Mail, Phone, MessageSquare } from "lucide-react";

const reportSchema = z.object({
  name: z.string().max(100).optional(),
  instagramId: z.string().max(100).optional(),
  facebookId: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phoneNumber: z.string().max(20).optional(),
  rating: z.number().min(0).max(10),
  description: z.string().max(1000).optional(),
}).refine(
  (data) => !!(data.name || data.instagramId || data.facebookId || data.email || data.phoneNumber),
  {
    message: "At least one identifier is required",
    path: ["name"],
  }
);

type ReportFormData = z.infer<typeof reportSchema>;

export default function CreateReportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      rating: 5,
    },
  });

  const rating = watch("rating");

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Mock user ID - in real app, get from auth
      const userId = "mock-user-id";
      const result = await createReport(userId, data);

      if (result.success) {
        setSubmitMessage({ type: 'success', text: 'Report created successfully!' });
        reset();
      } else {
        setSubmitMessage({ type: 'error', text: result.error || 'Failed to create report' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            Create Report
          </h1>
          <p className="text-slate-600">
            Share your experience and help the community make informed decisions
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-semibold">Report Details</CardTitle>
            <CardDescription>
              Fill in at least one identifier and rate your experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Identifiers Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Person Identifiers
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                    <Input
                      id="name"
                      placeholder="Full name"
                      {...register("name")}
                      className="transition-all duration-200 focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      {...register("email")}
                      className="transition-all duration-200 focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagramId" className="text-sm font-medium flex items-center gap-1">
                      <Instagram className="w-3 h-3" />
                      Instagram
                    </Label>
                    <Input
                      id="instagramId"
                      placeholder="@username"
                      {...register("instagramId")}
                      className="transition-all duration-200 focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebookId" className="text-sm font-medium flex items-center gap-1">
                      <Facebook className="w-3 h-3" />
                      Facebook
                    </Label>
                    <Input
                      id="facebookId"
                      placeholder="Profile name or ID"
                      {...register("facebookId")}
                      className="transition-all duration-200 focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+1 (555) 123-4567"
                      {...register("phoneNumber")}
                      className="transition-all duration-200 focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>

                {errors.name && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Rating Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Experience Rating
                </h3>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Rate your experience (0-10)
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={rating}
                      onChange={(e) => setValue("rating", parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex items-center justify-center w-12 h-8 bg-slate-100 rounded-md text-sm font-medium">
                      {rating}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Poor (0)</span>
                    <span>Excellent (10)</span>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Share details about your experience..."
                  rows={4}
                  {...register("description")}
                  className="transition-all duration-200 focus:ring-2 focus:ring-slate-400 resize-none"
                />
                <p className="text-xs text-slate-500">
                  Maximum 1000 characters
                </p>
              </div>

              {/* Submit Message */}
              {submitMessage && (
                <div className={`p-3 rounded-md text-sm ${
                  submitMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {submitMessage.text}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? "Creating Report..." : "Create Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}