"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createReport } from "@/app/actions/report.action";
import { approveAccessRequest, denyAccessRequest } from "@/app/actions/request.action";
import { 
  FileText, 
  User, 
  Instagram, 
  Facebook, 
  Mail, 
  Phone, 
  Star, 
  Clock, 
  Eye,
  MessageSquare,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";

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

interface AccessRequest {
  id: string;
  requesterId: string;
  message: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  createdAt: string;
  requester: {
    email: string;
  };
}

interface PreviousReport {
  id: string;
  name?: string;
  instagramId?: string;
  facebookId?: string;
  email?: string;
  phoneNumber?: string;
  rating: number;
  description?: string;
  createdAt: string;
  accessRequests: AccessRequest[];
}

export default function CreateReportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [previousReports, setPreviousReports] = useState<PreviousReport[]>([]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

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

  // Mock previous reports - in real app, fetch from API
  useEffect(() => {
    const mockReports: PreviousReport[] = [
      {
        id: "report-1",
        name: "John Doe",
        instagramId: "@johndoe",
        email: "john@example.com",
        rating: 8,
        description: "Great person to work with, very professional and reliable.",
        createdAt: "2024-01-15T10:30:00Z",
        accessRequests: [
          {
            id: "req-1",
            requesterId: "user-2",
            message: "Hi, I'm considering working with John on a project. Could you please share your experience report? I'd really appreciate your insights.",
            status: "PENDING",
            createdAt: "2024-01-20T14:20:00Z",
            requester: { email: "sarah@example.com" }
          },
          {
            id: "req-2",
            requesterId: "user-3",
            message: "I met John at a networking event and we're discussing a potential collaboration. Your report would help me make an informed decision.",
            status: "PENDING",
            createdAt: "2024-01-21T09:15:00Z",
            requester: { email: "mike@example.com" }
          }
        ]
      },
      {
        id: "report-2",
        name: "Jane Smith",
        facebookId: "jane.smith.profile",
        phoneNumber: "+1 (555) 123-4567",
        rating: 6,
        description: "Average experience, communication could be better.",
        createdAt: "2024-01-10T16:45:00Z",
        accessRequests: []
      },
      {
        id: "report-3",
        instagramId: "@creativestudio",
        email: "contact@creativestudio.com",
        rating: 9,
        description: "Excellent creative agency, delivered beyond expectations.",
        createdAt: "2024-01-05T11:20:00Z",
        accessRequests: [
          {
            id: "req-3",
            requesterId: "user-4",
            message: "I'm looking to hire a creative agency for my startup. Could you share your experience with this studio?",
            status: "APPROVED",
            createdAt: "2024-01-18T13:30:00Z",
            requester: { email: "alex@startup.com" }
          }
        ]
      }
    ];
    setPreviousReports(mockReports);
  }, []);

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
        setValue("rating", 5);
        
        // Add to previous reports (mock)
        const newReport: PreviousReport = {
          id: result.report.id,
          ...data,
          createdAt: new Date().toISOString(),
          accessRequests: []
        };
        setPreviousReports(prev => [newReport, ...prev]);
      } else {
        setSubmitMessage({ type: 'error', text: result.error || 'Failed to create report' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccessRequest = async (requestId: string, action: 'approve' | 'deny') => {
    setProcessingRequest(requestId);
    
    try {
      const userId = "mock-user-id";
      const result = action === 'approve' 
        ? await approveAccessRequest(userId, requestId)
        : await denyAccessRequest(userId, requestId);

      if (result.success) {
        // Update the request status in the UI
        setPreviousReports(prev => 
          prev.map(report => ({
            ...report,
            accessRequests: report.accessRequests.map(req => 
              req.id === requestId 
                ? { ...req, status: action === 'approve' ? 'APPROVED' : 'DENIED' }
                : req
            )
          }))
        );
        setExpandedRequest(null);
      }
    } catch (error) {
      console.error('Failed to process request:', error);
    } finally {
      setProcessingRequest(null);
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

  const getReportIdentifiers = (report: PreviousReport) => {
    const identifiers = [];
    if (report.name) identifiers.push(report.name);
    if (report.instagramId) identifiers.push(report.instagramId);
    if (report.facebookId) identifiers.push(report.facebookId);
    if (report.email) identifiers.push(report.email);
    if (report.phoneNumber) identifiers.push(report.phoneNumber);
    return identifiers[0] || "Anonymous Report";
  };

  const getPendingRequestsCount = (report: PreviousReport) => {
    return report.accessRequests.filter(req => req.status === 'PENDING').length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            Create Report
          </h1>
          <p className="text-slate-600">
            Share your experience and help others make informed decisions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Report Form */}
          <div>
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  New Report
                </CardTitle>
                <CardDescription>
                  Rate and describe your experience with someone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Person Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                        <Input
                          id="name"
                          placeholder="Full name"
                          {...register("name")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-purple-400"
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
                          className="transition-all duration-200 focus:ring-2 focus:ring-purple-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="text-sm font-medium flex items-center gap-1">
                          <Instagram className="w-3 h-3" />
                          Instagram
                        </Label>
                        <Input
                          id="instagram"
                          placeholder="@username"
                          {...register("instagramId")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-purple-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="facebook" className="text-sm font-medium flex items-center gap-1">
                          <Facebook className="w-3 h-3" />
                          Facebook
                        </Label>
                        <Input
                          id="facebook"
                          placeholder="Profile name or ID"
                          {...register("facebookId")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-purple-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          placeholder="+1 (555) 123-4567"
                          {...register("phoneNumber")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                    </div>

                    {errors.name && (
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Your Experience
                    </h3>
                    
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Rating: {rating}/10
                      </Label>
                      <div className="px-1">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={rating}
                          onChange={(e) => setValue("rating", parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>0</span>
                          <span>5</span>
                          <span>10</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Share your experience, what went well or what could be improved..."
                        {...register("description")}
                        className="min-h-[100px] transition-all duration-200 focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  {submitMessage && (
                    <div className={`p-3 rounded-md text-sm ${
                      submitMessage.type === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {submitMessage.text}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating Report..." : "Create Report"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Previous Reports */}
          <div>
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Your Reports
                </CardTitle>
                <CardDescription>
                  Manage your previous reports and access requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {previousReports.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No reports created yet</p>
                    </div>
                  ) : (
                    previousReports.map((report) => {
                      const pendingCount = getPendingRequestsCount(report);
                      const isExpanded = expandedReport === report.id;
                      
                      return (
                        <div key={report.id} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div 
                            className="p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">
                                  {getReportIdentifiers(report)}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Star className="w-3 h-3 text-yellow-500" />
                                  <span className="text-sm text-slate-600">
                                    {report.rating}/10
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {formatDate(report.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {pendingCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {pendingCount} pending
                                  </Badge>
                                )}
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 bg-white border-t border-slate-200">
                              {/* Report Details */}
                              <div className="space-y-3 mb-4">
                                <h4 className="text-sm font-medium text-slate-900">Report Details</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {report.name && (
                                    <div><span className="text-slate-500">Name:</span> {report.name}</div>
                                  )}
                                  {report.email && (
                                    <div><span className="text-slate-500">Email:</span> {report.email}</div>
                                  )}
                                  {report.instagramId && (
                                    <div><span className="text-slate-500">Instagram:</span> {report.instagramId}</div>
                                  )}
                                  {report.facebookId && (
                                    <div><span className="text-slate-500">Facebook:</span> {report.facebookId}</div>
                                  )}
                                  {report.phoneNumber && (
                                    <div><span className="text-slate-500">Phone:</span> {report.phoneNumber}</div>
                                  )}
                                </div>
                                {report.description && (
                                  <div>
                                    <span className="text-slate-500 text-sm">Description:</span>
                                    <p className="text-sm text-slate-700 mt-1">{report.description}</p>
                                  </div>
                                )}
                              </div>

                              {/* Access Requests */}
                              {report.accessRequests.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Access Requests ({report.accessRequests.length})
                                  </h4>
                                  
                                  {report.accessRequests.map((request) => (
                                    <div key={request.id} className="border border-slate-200 rounded-md overflow-hidden">
                                      <div 
                                        className="p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                                        onClick={() => setExpandedRequest(
                                          expandedRequest === request.id ? null : request.id
                                        )}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-900">
                                              {request.requester.email}
                                            </span>
                                            <Badge 
                                              variant={
                                                request.status === 'PENDING' ? 'destructive' :
                                                request.status === 'APPROVED' ? 'default' : 'secondary'
                                              }
                                              className="text-xs"
                                            >
                                              {request.status.toLowerCase()}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">
                                              {formatDate(request.createdAt)}
                                            </span>
                                            <Eye className="w-3 h-3 text-slate-400" />
                                          </div>
                                        </div>
                                      </div>

                                      {expandedRequest === request.id && (
                                        <div className="p-3 bg-white border-t border-slate-200">
                                          <div className="space-y-3">
                                            <div>
                                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                Request Message
                                              </span>
                                              <p className="text-sm text-slate-700 mt-1">
                                                {request.message}
                                              </p>
                                            </div>
                                            
                                            {request.status === 'PENDING' && (
                                              <div className="flex gap-2 pt-2">
                                                <Button
                                                  size="sm"
                                                  onClick={() => handleAccessRequest(request.id, 'approve')}
                                                  disabled={processingRequest === request.id}
                                                  className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                  <Check className="w-3 h-3 mr-1" />
                                                  Approve
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleAccessRequest(request.id, 'deny')}
                                                  disabled={processingRequest === request.id}
                                                  className="border-red-300 text-red-700 hover:bg-red-50"
                                                >
                                                  <X className="w-3 h-3 mr-1" />
                                                  Reject
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
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