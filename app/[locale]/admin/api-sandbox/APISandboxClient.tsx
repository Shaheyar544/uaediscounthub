'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
    Search, Database, Loader2, Play, AlertCircle, 
    Code, Copy, RefreshCw, AlertTriangle 
} from 'lucide-react'
import { AmazonCreatorsAPI } from '@/lib/amazon-creators-api'

export default function APISandboxClient({ locale }: { locale: string }) {
    const isManualMode = AmazonCreatorsAPI.isManualMode()
    // Search Tester State
    const [searchQuery, setSearchQuery] = useState('')
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchResponse, setSearchResponse] = useState<any>(null)
    const [searchError, setSearchError] = useState<string | null>(null)

    // ASIN Tester State
    const [asinQuery, setAsinQuery] = useState('')
    const [asinLoading, setAsinLoading] = useState(false)
    const [asinResponse, setAsinResponse] = useState<any>(null)
    const [asinError, setAsinError] = useState<string | null>(null)

    const runSearchTest = async () => {
        if (!searchQuery) return
        setSearchLoading(true)
        setSearchError(null)
        setSearchResponse(null)
        try {
            const res = await fetch(`/api/amazon/search?q=${encodeURIComponent(searchQuery)}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to fetch search results')
            setSearchResponse(data)
        } catch (err: any) {
            setSearchError(err.message)
        } finally {
            setSearchLoading(false)
        }
    }

    const runAsinTest = async () => {
        if (!asinQuery) return
        setAsinLoading(true)
        setAsinError(null)
        setAsinResponse(null)
        try {
            const res = await fetch(`/api/amazon/product?asin=${encodeURIComponent(asinQuery)}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to fetch product data')
            setAsinResponse(data)
        } catch (err: any) {
            setAsinError(err.message)
        } finally {
            setAsinLoading(false)
        }
    }

    const copyToClipboard = (text: any) => {
        navigator.clipboard.writeText(JSON.stringify(text, null, 2))
        alert('JSON copied to clipboard!')
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-[22px] font-extrabold text-[#0D1117]">API Integration Tester</h1>
                <p className="text-[13px] text-[#8A94A6] mt-1">Safely test Amazon Creators API endpoints and inspect raw data.</p>
            </div>

            {isManualMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-[14px] font-bold">Automation Suspended (Manual Entry Mode)</p>
                        <p className="text-[12px] opacity-90 leading-relaxed">
                            The system is currently configured to bypass Amazon API calls. 
                            Searching and fetching will return empty results to prevent errors while credentials are being updated.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Keyword Search Tester */}
                <Card className="border-[1.5px] border-[#DDE3EF] shadow-sm rounded-[14px] flex flex-col">
                    <CardHeader className="pb-4 border-b border-[#DDE3EF] mb-4">
                        <CardTitle className="flex items-center gap-2 text-[16px] font-extrabold">
                            <Search className="w-4 h-4 text-[#0057FF]" /> Keyword Search Testing
                        </CardTitle>
                        <CardDescription className="text-[12px]">Test the /api/amazon/search endpoint with keywords.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Search Keyword</Label>
                                <Input 
                                    placeholder="e.g., iPhone 15 Pro"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    onKeyDown={(e) => e.key === 'Enter' && !isManualMode && runSearchTest()}
                                    disabled={isManualMode}
                                />
                            </div>
                            <div className="flex items-end pb-0.5">
                                <Button 
                                    onClick={runSearchTest} 
                                    disabled={searchLoading || !searchQuery || isManualMode}
                                    className="bg-[#0057FF] hover:bg-[#0047dd] font-bold h-10 px-6 rounded-[8px]"
                                >
                                    {searchLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                                    Run Search
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-[400px]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider flex items-center gap-1.5">
                                    <Code className="w-3 h-3" /> JSON Response
                                </span>
                                {searchResponse && (
                                    <button 
                                        onClick={() => copyToClipboard(searchResponse)}
                                        className="text-[11px] font-bold text-[#0057FF] hover:underline flex items-center gap-1"
                                    >
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex-1 bg-[#0D1117] rounded-[12px] border border-[#1E293B] p-4 font-mono text-[12px] overflow-hidden flex flex-col">
                                {searchLoading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-[#4B5675] gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#0057FF]" />
                                        <span>Requesting data from Amazon...</span>
                                    </div>
                                ) : searchError ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-[#FF3B30] gap-2 text-center p-4">
                                        <AlertCircle className="w-8 h-8" />
                                        <p className="font-bold">API Error</p>
                                        <p className="text-[11px] opacity-80">{searchError}</p>
                                    </div>
                                ) : searchResponse ? (
                                    <pre className="flex-1 overflow-auto custom-scrollbar text-[#E2E8F0]">
                                        <code>{JSON.stringify(searchResponse, null, 2)}</code>
                                    </pre>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-[#4B5675] gap-2 opacity-50">
                                        <Database className="w-8 h-8" />
                                        <span>No data to display. Run a test search above.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ASIN Lookup Tester */}
                <Card className="border-[1.5px] border-[#DDE3EF] shadow-sm rounded-[14px] flex flex-col">
                    <CardHeader className="pb-4 border-b border-[#DDE3EF] mb-4">
                        <CardTitle className="flex items-center gap-2 text-[16px] font-extrabold">
                            <Database className="w-4 h-4 text-[#FF9900]" /> ASIN Lookup Testing
                        </CardTitle>
                        <CardDescription className="text-[12px]">Test the /api/amazon/product endpoint with a specific ASIN.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider">Product ASIN</Label>
                                <Input 
                                    placeholder="e.g., B0CHX68L8B"
                                    value={asinQuery}
                                    onChange={(e) => setAsinQuery(e.target.value)}
                                    className="bg-[#F6F8FC] border-[#DDE3EF] rounded-[8px]"
                                    onKeyDown={(e) => e.key === 'Enter' && !isManualMode && runAsinTest()}
                                    disabled={isManualMode}
                                />
                            </div>
                            <div className="flex items-end pb-0.5">
                                <Button 
                                    onClick={runAsinTest} 
                                    disabled={asinLoading || !asinQuery || isManualMode}
                                    className="bg-[#FF9900] hover:bg-[#e68a00] text-white font-bold h-10 px-6 rounded-[8px]"
                                >
                                    {asinLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    Fetch Deal
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-[400px]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-wider flex items-center gap-1.5">
                                    <Code className="w-3 h-3" /> JSON Response
                                </span>
                                {asinResponse && (
                                    <button 
                                        onClick={() => copyToClipboard(asinResponse)}
                                        className="text-[11px] font-bold text-[#0057FF] hover:underline flex items-center gap-1"
                                    >
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex-1 bg-[#0D1117] rounded-[12px] border border-[#1E293B] p-4 font-mono text-[12px] overflow-hidden flex flex-col">
                                {asinLoading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-[#4B5675] gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#FF9900]" />
                                        <span>Fetching specific ASIN data...</span>
                                    </div>
                                ) : asinError ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-[#FF3B30] gap-2 text-center p-4">
                                        <AlertCircle className="w-8 h-8" />
                                        <p className="font-bold">API Error</p>
                                        <p className="text-[11px] opacity-80">{asinError}</p>
                                    </div>
                                ) : asinResponse ? (
                                    <pre className="flex-1 overflow-auto custom-scrollbar text-[#E2E8F0]">
                                        <code>{JSON.stringify(asinResponse, null, 2)}</code>
                                    </pre>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-[#4B5675] gap-2 opacity-50">
                                        <Database className="w-8 h-8" />
                                        <span>No data to display. Enter an ASIN above.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
