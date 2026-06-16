import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Heart, Activity } from 'lucide-react';
import { VitalSignsGraphData } from '@/services/apiService';

interface VitalSignsTrendProps {
    graphData: VitalSignsGraphData | null | undefined;
}

export const VitalSignsTrend: React.FC<VitalSignsTrendProps> = ({ graphData }) => {
    const parseCustomDate = (timeStr: string): Date => {
        if (!timeStr) return new Date();
        // Handle DD-MM-YYYY HH:mm:ss format
        if (timeStr.includes('-') && timeStr.split('-')[0].length === 2) {
            const [datePart, timePart] = timeStr.split(' ');
            const [day, month, year] = datePart.split('-');
            const timeString = timePart || '00:00:00';
            return new Date(`${year}-${month}-${day}T${timeString}`);
        }
        // Handle other formats
        return new Date(timeStr);
    };

    const formatGraphData = (dataArray: any[]) => {
        if (!dataArray || dataArray.length === 0) return [];

        // Sort data by time to ensure proper chronological order
        const sortedData = [...dataArray].sort((a, b) => {
            const dateA = parseCustomDate(a.time || a.RecordedOn);
            const dateB = parseCustomDate(b.time || b.RecordedOn);
            return dateA.getTime() - dateB.getTime();
        });

        return sortedData.map((item, idx) => ({
            ...item,
            time: `Day ${idx + 1}`,
            originalTime: item.time || item.RecordedOn
        }));
    };

    return (
        <div className="bg-white rounded-[10px] p-3 mt-4">
            <div className="bg-white rounded-[12px] overflow-hidden p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[0.875rem] font-medium text-black font-['Inter'] tracking-[1.5px] uppercase">
                        Vitals History Trend
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Heart Rate Chart */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-[#ff4d4f]" />
                            <h4 className="text-[0.94rem] font-medium text-[#1a2256] font-['Inter']">Heart Rate Trend</h4>
                        </div>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={formatGraphData((graphData as any)?.heartRate || [])}>
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6c7c93' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6c7c93' }} domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e0e3f5', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#ff4d4f" strokeWidth={2.5} dot={{ fill: '#ff4d4f', r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Blood Pressure Chart */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#64549f]" />
                            <h4 className="text-[0.94rem] font-medium text-[#1a2256] font-['Inter']">Blood Pressure Trend</h4>
                        </div>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={formatGraphData((graphData as any)?.bp || [])}>
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6c7c93' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6c7c93' }} domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0e3f5', backgroundColor: 'rgba(255, 255, 255, 0.95)' }} />
                                    <Line type="monotone" dataKey="systolic" stroke="#64549f" strokeWidth={2.5} name="Systolic" dot={{ fill: '#64549f', r: 3 }} />
                                    <Line type="monotone" dataKey="diastolic" stroke="#0b87c1" strokeWidth={2.5} name="Diastolic" dot={{ fill: '#0b87c1', r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Oxygen Saturation Chart */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#00aaff]" />
                            <h4 className="text-[0.94rem] font-medium text-[#1a2256] font-['Inter']">Oxygen Saturation</h4>
                        </div>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={formatGraphData((graphData as any)?.sp02 || [])}>
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6c7c93' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6c7c93' }} domain={[90, 100]} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0e3f5', backgroundColor: 'rgba(255, 255, 255, 0.95)' }} />
                                    <Area type="monotone" dataKey="value" stroke="#00aaff" fill="url(#colorSp02)" strokeWidth={2} />
                                    <defs>
                                        <linearGradient id="colorSp02" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00aaff" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00aaff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Temperature Chart */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#d28501]" />
                            <h4 className="text-[0.94rem] font-medium text-[#1a2256] font-['Inter']">Temperature Trend</h4>
                        </div>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={formatGraphData((graphData as any)?.temperature || [])}>
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6c7c93' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6c7c93' }} domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0e3f5', backgroundColor: 'rgba(255, 255, 255, 0.95)' }} />
                                    <Bar dataKey="value" fill="#d28501" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
