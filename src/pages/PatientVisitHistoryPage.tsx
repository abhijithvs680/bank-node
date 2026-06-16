import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, User, Download, Loader2, AlertTriangle, Pill, Upload, Activity, Clock, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiService } from '@/services/apiService';
import { PatientVisit, LabResult } from '@/types/patient';
import { RecentResults } from '@/components/RecentResults';
import { UploadReportModal } from '@/components/UploadReportModal';
import { PDFSidebar } from '@/components/PDFSidebar';
import { RelativeTime } from '@/components/RelativeTime';
import { SafeHTMLRenderer } from '@/components/SafeHTMLRenderer';
import { getFormattedDateTime } from '@/utils/timeUtils';
import { Touchable } from "@/components/ui/touchable";
import { groupVisitHistoryByDoctor } from '@/utils/visitHistoryUtils';

const PatientVisitHistoryPage = () => {
  const { admissionId } = useParams<{ admissionId: string }>();
  const navigate = useNavigate();
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('');
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState<string | null>(null);
  const [isPDFOpen, setIsPDFOpen] = useState<boolean>(false);
  const [isVisitAttachmentOpen, setisVisitAttachmentOpen] = useState<boolean>(false);
  const [isVisitAttachmentloading, setisVisitAttachmentloading] = useState<any>("false");

  const [selectedTest, setSelectedTest] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('visits');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');

  const visitsByDoctor = useMemo(() => groupVisitHistoryByDoctor(visits), [visits]);

  useEffect(() => {
    const fetchData = async () => {
      if (!admissionId) return;

      try {
        setLoading(true);
        setError(null);

        const visitData = await apiService.getVisitHistory(admissionId);
        setVisits(visitData);

        if (visitData && visitData.length > 0) {
          setPatientName(visitData[0].Name || visitData[0].PatientName || '');
        }
      } catch (err) {
        console.error('Error fetching visit history:', err);
        setError('Failed to load visit history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [admissionId]);

  useEffect(() => {
    const fetchLabResults = async () => {
      if (!admissionId || activeTab !== 'reports') return;

      try {
        setLabLoading(true);
        setLabError(null);
        const results = await apiService.getRecentLabResults(admissionId);
        setLabResults(results);
      } catch (err) {
        console.error('Error fetching lab results:', err);
        setLabError('Failed to load lab results');
      } finally {
        setLabLoading(false);
      }
    };

    if (activeTab === 'reports') {
      fetchLabResults();
    }
  }, [admissionId, activeTab]);

  // Using centralized time utilities from src/utils/timeUtils.ts

  const handleDownloadAttachment = (fileId: string, fileName: string) => {
    console.log('Download file:', fileId, fileName);
    setisVisitAttachmentloading(fileId);
    apiService.getAttachmentsFromVisitHistory(fileId).then((data) => {
      console.log('Attachment data received:', data);
      setisVisitAttachmentOpen(true);
      setSelectedFile(URL.createObjectURL(data));
      setSelectedFileType(data.type);
      setSelectedTest(fileName);
      setisVisitAttachmentloading(false);

    })

  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 animate-ping opacity-20"></div>
            </div>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4 relative z-10" />
          </div>
          <p className="text-slate-600 font-medium">Loading visit history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md shadow-2xl border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Data</h3>
              <p className="text-slate-600 mb-6">{error}</p>
              <Button
                onClick={() => navigate(`/consultationId/${admissionId}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Patient Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header with Gradient */}
      {/* Header - Gradient Theme */}
      <header className="relative overflow-hidden bg-[#1a2256] h-20 sticky top-0 z-50">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-[400px] h-full bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none" />
        <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[200%] bg-indigo-500/5 rotate-12 blur-[100px] pointer-events-none" />

        <div className="relative h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Touchable
              onClick={() => navigate(`/consultationId/${admissionId}`)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
            </Touchable>

            <div className="h-8 w-[1px] bg-white/10" />

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">Medical History</h1>
                <p className="text-[13px] text-white/50 font-medium">{patientName} <span className="text-white/30">•</span> ID: {admissionId}</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white">
            <div className="text-xl font-bold leading-none">{visits.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">{visits.length === 1 ? 'Visit' : 'Visits'}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-white shadow-md h-12">
              <TabsTrigger value="visits" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-medical-primary data-[state=active]:text-white">
                <Calendar className="w-4 h-4 mr-2" />
                Visits
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-medical-primary data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                Lab Reports
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-medical-primary hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload Report
            </Button>
          </div>

          {/* Enhanced Visits Tab */}
          <TabsContent value="visits">
            {visits.length === 0 ? (
              <Card className="shadow-xl border-0">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Visit History</h3>
                  <p className="text-slate-500">No visits have been recorded for this patient yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {visitsByDoctor.map((doctorGroup) => (
                  <Card key={doctorGroup.doctorId} className="overflow-hidden shadow-xl border-0">
                    <CardHeader className="border-b border-slate-200 p-4 bg-slate-50">
                      <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        <User className="w-5 h-5 text-blue-600" />
                        Dr. {doctorGroup.doctorName}
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-0">
                          {doctorGroup.visits.length} visit{doctorGroup.visits.length !== 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-0 divide-y divide-slate-100">
                      {doctorGroup.visits.map((visit, index) => (
                        <div key={visit.rowID} className="p-6 space-y-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <RelativeTime dateStr={visit.VisitedOn || visit.ScheduledDate} showDateOnly />
                                {visit.ScheduledTime ? ` • ${visit.ScheduledTime}` : ''}
                              </p>
                              {visit.PurposeOfVisit && (
                                <p className="text-sm text-slate-600 mt-2">
                                  <span className="font-semibold text-slate-900">Purpose: </span>
                                  {visit.PurposeOfVisit}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-0">
                              Visit {doctorGroup.visits.length - index}
                            </Badge>
                          </div>

                          {visit.UrgentConcerns && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                              <h4 className="font-semibold text-sm mb-1 text-red-800">Urgent Concerns</h4>
                              <p className="text-sm text-red-700">{visit.UrgentConcerns}</p>
                            </div>
                          )}

                          {visit.Ai_Interpretation && (
                            <div>
                              <h3 className="font-semibold text-slate-900 mb-2">AI Interpretation</h3>
                              <div className="text-sm text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                <SafeHTMLRenderer content={visit.Ai_Interpretation} forceHTML={true} />
                              </div>
                            </div>
                          )}

                          {visit.AISummary && visit.AISummary !== visit.Ai_Interpretation && (
                            <div>
                              <h3 className="font-semibold text-slate-900 mb-2">Consultation Summary</h3>
                              <div className="text-sm text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                <SafeHTMLRenderer content={visit.AISummary} forceHTML={true} />
                              </div>
                            </div>
                          )}

                          {visit.Prescriptions && visit.Prescriptions.length > 0 && (
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200 shadow-sm">
                              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                  <Pill className="w-4 h-4 text-white" />
                                </div>
                                Prescriptions
                              </h3>
                              <div className="space-y-2">
                                {visit.Prescriptions.map((p: any, pIdx: number) => (
                                  <div key={pIdx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-100">
                                    <div>
                                      <span className="text-sm font-semibold text-slate-900">{p.MedicationName}</span>
                                      <span className="mx-2 text-slate-400">•</span>
                                      <span className="text-sm text-slate-600">{p.Dosage}</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-emerald-700">{p.Frequency}</p>
                                      <p className="text-xs text-slate-500">{p.Duration}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {visit.attachments && visit.attachments.length > 0 && (
                            <div>
                              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Attachments
                              </h3>
                              <Accordion type="single" collapsible className="w-full space-y-2">
                                {visit.attachments.map((attachment, idx) => (
                                  <AccordionItem key={attachment.rowID} value={`item-${idx}`} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <AccordionTrigger className="text-sm hover:no-underline px-4 hover:bg-slate-50 transition-colors">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-medical-primary flex items-center justify-center">
                                          <FileText className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-medium text-slate-900">{attachment.FileName}</span>
                                        <Badge variant="outline" className="ml-2 text-xs border-blue-200 text-blue-700">
                                          {attachment.Modality || 'N/A'}
                                        </Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                      <div className="space-y-4 pt-2 bg-slate-50 p-4 rounded-lg">
                                        <div className="text-xs text-slate-600">
                                          <span className="font-semibold">Created:</span> <RelativeTime dateStr={attachment.CreatedOn} />
                                        </div>

                                        {attachment.Summary && (
                                          <div>
                                            <span className="text-xs font-semibold text-slate-900">Summary:</span>
                                            <p className="text-sm text-slate-700 mt-1 leading-relaxed">{attachment.Summary}</p>
                                          </div>
                                        )}

                                        {attachment.Observations && attachment.Observations !== 'Not provided' && (
                                          <div>
                                            <span className="text-xs font-semibold text-slate-900">Observations:</span>
                                            <p className="text-sm text-slate-700 mt-1 leading-relaxed">{attachment.Observations}</p>
                                          </div>
                                        )}

                                        {attachment.Medication && attachment.Medication !== 'Not provided' && (
                                          <div>
                                            <span className="text-xs font-semibold text-slate-900">Medications:</span>
                                            <p className="text-sm text-slate-700 mt-1 leading-relaxed">{attachment.Medication}</p>
                                          </div>
                                        )}

                                        {attachment.Followups && attachment.Followups !== 'Not provided' && (
                                          <div>
                                            <span className="text-xs font-semibold text-slate-900">Follow-ups:</span>
                                            <p className="text-sm text-slate-700 mt-1 leading-relaxed">{attachment.Followups}</p>
                                          </div>
                                        )}

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDownloadAttachment(attachment.FileID, attachment.FileName)}
                                          className="mt-2 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all"
                                        >
                                          <Download className="w-4 h-4 mr-2" />
                                          {isVisitAttachmentloading === attachment.FileID ? 'Loading...' : 'View'}
                                        </Button>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Lab Reports Tab */}
          <TabsContent value="reports">
            <div>
              <RecentResults
                admissionId={admissionId}
                labResults={labResults}
                loading={labLoading}
                error={labError}
                setIsPDFOpen={setIsPDFOpen}
                isPDFOpen={isPDFOpen}
                selectedTest={selectedTest}
                patientName={patientName}
                setSelectedTest={setSelectedTest}
                setPatientName={setPatientName}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <UploadReportModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        admission_id={admissionId || ''}
        onUploadComplete={() => {
          if (activeTab === 'reports') {
            apiService.getRecentLabResults(admissionId || '').then(setLabResults);
          }
        }}
      />
      <PDFSidebar
        selectedFileType={selectedFileType}
        isOpen={isVisitAttachmentOpen}
        onClose={() => setisVisitAttachmentOpen(false)}
        pdfUrl={selectedFile}
        testName={selectedTest}
        patientName={patientName}
      />
    </div>
  );
};

export default PatientVisitHistoryPage;

